import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Timestamp } from 'firebase/firestore';
import { TrendingUp, Calculator, Users, Search } from 'lucide-react';

const Reports: React.FC = () => {
  const [currentMonthLeads, setCurrentMonthLeads] = useState<number>(0);
  const [previousMonthLeads, setPreviousMonthLeads] = useState<number>(0);
  const [conversions, setConversions] = useState<number>(0);
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to compute start and end dates for a given month.
  const getMonthRange = (year: number, month: number) => {
    // month is 0-indexed (0 = January, 11 = December)
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    return { start, end };
  };

  useEffect(() => {
    const fetchReportsData = async () => {
      setIsLoading(true);
      try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const { start: currentMonthStart, end: currentMonthEnd } = getMonthRange(currentYear, currentMonth);

        // Calculate previous month (handle January edge-case)
        let previousMonthStart: Date, previousMonthEnd: Date;
        if (currentMonth === 0) {
          const previousYear = currentYear - 1;
          ({ start: previousMonthStart, end: previousMonthEnd } = getMonthRange(previousYear, 11));
        } else {
          ({ start: previousMonthStart, end: previousMonthEnd } = getMonthRange(currentYear, currentMonth - 1));
        }

        // Query current month leads
        const leadsRef = collection(db, 'leads');
        const currentMonthQuery = query(
          leadsRef,
          where('timestamp', '>=', currentMonthStart),
          where('timestamp', '<', currentMonthEnd)
        );
        const currentSnapshot = await getDocs(currentMonthQuery);
        setCurrentMonthLeads(currentSnapshot.size);

        // Query previous month leads
        const previousMonthQuery = query(
          leadsRef,
          where('timestamp', '>=', previousMonthStart),
          where('timestamp', '<', previousMonthEnd)
        );
        const previousSnapshot = await getDocs(previousMonthQuery);
        setPreviousMonthLeads(previousSnapshot.size);

        // Query total leads overall
        const totalSnapshot = await getDocs(leadsRef);
        setTotalLeads(totalSnapshot.size);

        // Query conversions (assumed collection 'conversions')
        const conversionsRef = collection(db, 'conversions');
        const conversionsSnapshot = await getDocs(conversionsRef);
        setConversions(conversionsSnapshot.size);

        // Query recent searches (assumed collection 'searches')
        const searchesRef = collection(db, 'searches');
        const searchesQuery = query(searchesRef, orderBy('timestamp', 'desc'), limit(5));
        const searchesSnapshot = await getDocs(searchesQuery);
        setRecentSearches(searchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Query active users (assumed collection 'users' with field isOnline === true)
        const usersRef = collection(db, 'users');
        const activeQuery = query(usersRef, where('isOnline', '==', true));
        const activeSnapshot = await getDocs(activeQuery);
        setActiveUsers(activeSnapshot.size);
      } catch (error) {
        console.error('Error fetching reports data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportsData();
  }, []);

  // Derived stats
  const conversionRate = totalLeads > 0 ? (conversions / totalLeads) * 100 : 0;
  const leadsIncreasePercent =
    previousMonthLeads > 0
      ? ((currentMonthLeads - previousMonthLeads) / previousMonthLeads) * 100
      : currentMonthLeads > 0
      ? 100
      : 0;

  // Function to download report as CSV
  const handleDownloadReport = () => {
    const reportData = [
      ['Metric', 'Value'],
      ['Current Month Leads', currentMonthLeads],
      ['Previous Month Leads', previousMonthLeads],
      ['Conversion Rate (%)', conversionRate.toFixed(2)],
      ['Active Users', activeUsers],
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      reportData.map(row => row.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Reports</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Monthly Leads Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Monthly Leads</p>
              <h4 className="text-2xl font-bold text-gray-900">{currentMonthLeads}</h4>
            </div>
          </div>
          <div className="text-sm text-green-600">
            {leadsIncreasePercent >= 0
              ? `↑ ${leadsIncreasePercent.toFixed(2)}% increase from previous month`
              : `↓ ${Math.abs(leadsIncreasePercent).toFixed(2)}% decrease`}
          </div>
        </div>

        {/* Recent Searches Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Search className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Recent Searches</p>
              <h4 className="text-2xl font-bold text-gray-900">{recentSearches.length}</h4>
            </div>
          </div>
          {recentSearches.length > 0 && (
            <div className="text-sm text-gray-600">
              Latest: {recentSearches[0]?.query || 'N/A'}
            </div>
          )}
        </div>

        {/* Conversion Rate Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calculator className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <h4 className="text-2xl font-bold text-gray-900">
                {conversionRate.toFixed(2)}%
              </h4>
            </div>
          </div>
          <div className="text-sm text-green-600">
            {conversions} conversions out of {totalLeads} leads
          </div>
        </div>

        {/* Active Users Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <h4 className="text-2xl font-bold text-gray-900">{activeUsers}</h4>
            </div>
          </div>
          <div className="text-sm text-blue-600">Currently online</div>
        </div>
      </div>

      {/* Recent Searches List */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Recent Searches</h2>
        {recentSearches.length === 0 ? (
          <p className="text-gray-600">No recent searches</p>
        ) : (
          <ul className="space-y-2">
            {recentSearches.map((search) => (
              <li key={search.id} className="border-b pb-2">
                <div className="font-medium">{search.query || 'N/A'}</div>
                <div className="text-xs text-gray-500">
                  {search.timestamp
                    ? new Date(search.timestamp.seconds * 1000).toLocaleString()
                    : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Download Report Button */}
      <button
        onClick={handleDownloadReport}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Download Report
      </button>
    </div>
  );
};

export default Reports;