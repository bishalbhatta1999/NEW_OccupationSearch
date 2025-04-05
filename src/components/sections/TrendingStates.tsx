import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  TrendingUp,
  Award,
  BarChart,
  ChevronDown,
  ChevronUp,
  Crown,
  Star,
  Target,
  Zap,
  AlertCircle,
} from 'lucide-react';

/** Month filter dropdown options (all 12 months). */
const monthOptions = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

/** Year filter dropdown options. */
const yearOptions = [
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
];

/** EOI status filter dropdown options. */
const statusOptions = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'INVITED', label: 'Invited' },
  { value: 'LODGED', label: 'Lodged' },
  { value: 'HELD', label: 'Held' },
  { value: 'HOLD', label: 'Hold' },
  { value: 'CLOSED', label: 'Closed' },
];

/** Represents one row of aggregated data: (State + Occupation -> total invites + breakdown by visa type). */
interface StateOccupationAggregate {
  state: string;
  occupationName: string;
  totalInvites: number;
  invitesByType: {
    '190': number;
    '491': number;
    other: number;
  };
}

/** Firestore doc shape in the 'state' collection. */
interface FirestoreDoc {
  anzscocode: string;
  month: string;
  year: string;
  eoiStatus: string;
  nominatedState?: string;
  countEOIs?: string | number;
  occupationName?: string;
  visaType?: string; // e.g. "190 Skilled Nominated"
}

/** Convert "03" => "March" for display. */
function monthNumberToName(monthStr: string): string {
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const idx = parseInt(monthStr, 10) - 1;
  return months[idx] || 'Unknown';
}

/** 
 * Parse Firestore's `countEOIs`. 
 * If "<20", interpret as e.g. 10. 
 * Otherwise parse as a number.
 */
function parseCountEOIs(raw: string | number | undefined): number {
  if (raw == null) return 0;
  const str = String(raw).trim();
  if (str === '<20') return 10;  // or 0 if you prefer
  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/** 
 * Categorize the doc’s `visaType` field into "190", "491", or "other". 
 */
function parseVisaType(visaTypeStr?: string): '190' | '491' | 'other' {
  if (!visaTypeStr) return 'other';
  const lower = visaTypeStr.toLowerCase();
  if (lower.includes('190')) return '190';
  if (lower.includes('491')) return '491';
  return 'other';
}

/**
 * Returns appropriate labels for "Total", "Highest", and "Top" 
 * depending on the current status.
 */
function getLabelsForStatus(status: string) {
  switch (status.toUpperCase()) {
    case 'SUBMITTED':
      return {
        total: 'Total Submissions',
        highest: 'Highest Submissions',
        top: 'Top Submissions',
      };
    case 'INVITED':
      return {
        total: 'Total Invitations',
        highest: 'Highest Invites',
        top: 'Top Invites',
      };
    case 'LODGED':
      return {
        total: 'Total Lodged',
        highest: 'Highest Lodged',
        top: 'Top Lodged',
      };
    case 'HELD':
      return {
        total: 'Total Held',
        highest: 'Highest Held',
        top: 'Top Held',
      };
    case 'HOLD':
      return {
        total: 'Total Holds',
        highest: 'Highest Holds',
        top: 'Top Holds',
      };
    case 'CLOSED':
      return {
        total: 'Total Closed',
        highest: 'Highest Closed',
        top: 'Top Closed',
      };
    default:
      // fallback
      return {
        total: 'Total',
        highest: 'Highest',
        top: 'Top',
      };
  }
}

const TrendingStates: React.FC = () => {
  // 1) Default month/year to "last month" from today's date
  const today = new Date();
  let currentMonth = today.getMonth() + 1; 
  let currentYear = today.getFullYear();

  // Subtract 1 to get last month
  currentMonth -= 1;
  if (currentMonth < 1) {
    currentMonth += 12;
    currentYear -= 1;
  }
  const defaultMonth = String(currentMonth).padStart(2, '0');
  const defaultYear = String(currentYear);

  // 2) Use those defaults + set status to "INVITED"
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [status, setStatus] = useState('INVITED');

  // Aggregated data, loading, error states, showAll
  const [aggregates, setAggregates] = useState<StateOccupationAggregate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // For display
  const monthName = monthNumberToName(month);

  // 3) Firestore fetch aggregator from "state" collection
  const fetchStates = async () => {
    try {
      setLoading(true);
      setError(null);

      const stateRef = collection(db, 'state');
      const q_ = query(
        stateRef,
        where('month', '==', month),
        where('year', '==', year),
        where('eoiStatus', '==', status),
      );

      const snap = await getDocs(q_);
      if (snap.empty) {
        setError('No data found for these filters.');
        setAggregates([]);
        return;
      }

      // aggregator: key = "state||occupationName" => invites + invitesByType
      const aggregator = new Map<string, StateOccupationAggregate>();

      snap.forEach((doc) => {
        const data = doc.data() as FirestoreDoc;
        const st = data.nominatedState || 'UNKNOWN';
        const occ = data.occupationName || 'Unknown Occupation';
        const count = parseCountEOIs(data.countEOIs);
        const visaType = parseVisaType(data.visaType);

        // Build a unique key from state + occupation
        const key = `${st}||${occ}`;

        if (!aggregator.has(key)) {
          aggregator.set(key, {
            state: st,
            occupationName: occ,
            totalInvites: 0,
            invitesByType: {
              '190': 0,
              '491': 0,
              other: 0,
            },
          });
        }

        const aggRow = aggregator.get(key)!;
        aggRow.totalInvites += count;
        aggRow.invitesByType[visaType] += count;
      });

      // convert aggregator map to array
      const results = Array.from(aggregator.values());
      // sort descending by totalInvites
      results.sort((a, b) => b.totalInvites - a.totalInvites);
      // keep top 20
      setAggregates(results.slice(0, 20));
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load data.');
      setAggregates([]);
    } finally {
      setLoading(false);
    }
  };

  // Re-run fetch on filter changes
  useEffect(() => {
    fetchStates();
  }, [month, year, status]);

  // Summaries
  const totalInvites = aggregates.reduce((sum, row) => sum + row.totalInvites, 0);
  // If we have data, the first row is the highest
  const topRow = aggregates[0];
  const highestInvites = topRow?.totalInvites || 0;

  // Show top 5 or top 20
  const displayedRows = showAll ? aggregates : aggregates.slice(0, 5);

  // Use the helper to get labels based on the current status
  const labelsForStatus = getLabelsForStatus(status);

  return (
    <div className="relative w-full bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-xl border border-blue-100 overflow-hidden backdrop-blur-sm">
      {/* Wave background */}
      <div className="absolute inset-0 pointer-events-none -z-10 opacity-30">
        <svg
          className="w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 1440 720"
        >
          <path
            fill="url(#gradient-wave)"
            fillOpacity="0.5"
            d="M0,32L48,42.7C96,53,192,75,288,101.3C384,128,480,160,576,154.7C672,149,768,107,864,117.3C960,128,1056,192,1152,224C1248,256,1344,256,1392,256L1440,256L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          />
          <defs>
            <linearGradient id="gradient-wave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="w-full py-8 px-6 sm:px-8">
        <div className="bg-white/90 backdrop-blur-sm">
          {/* Header + Filter */}
          <div className="p-8 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 border-b border-blue-100 space-y-6 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-200 rounded-full opacity-10 translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-800">
                  Trending States &amp; Occupations
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Month: {monthName}, Year: {year}, Status: {status}
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              {/* Month */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm
                           text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200 hover:border-blue-300"
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Year */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm
                           text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200 hover:border-blue-300"
                >
                  {yearOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Status */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm
                           text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200 hover:border-blue-300"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Loading / Error */}
          {loading && (
            <div className="flex items-center justify-center p-12">
              <div className="flex items-center gap-3 px-6 py-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                <p className="text-blue-700 font-medium">Loading trending data...</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="p-12">
              <div className="flex items-center gap-3 px-6 py-4 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Main Content */}
          {!loading && !error && (
            <>
              {/* Summaries */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-gray-200">
                {/* 1) "Total" box */}
                <div className="group bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 border border-blue-200 
                           shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-200 group-hover:bg-blue-300 transition-colors">
                      <Target className="w-5 h-5 text-blue-700" />
                    </div>
                    <span className="text-sm font-medium text-blue-800">
                      {labelsForStatus.total}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-blue-900">
                    {totalInvites.toLocaleString()}
                  </div>
                </div>

                {/* 2) "Highest" box => aggregator[0], if any */}
                <div className="group bg-gradient-to-br from-green-50 to-emerald-100/50 rounded-xl p-6 border border-green-200 
                           shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-green-200 group-hover:bg-green-300 transition-colors">
                      <Award className="w-5 h-5 text-green-700" />
                    </div>
                    <span className="text-sm font-medium text-green-800">
                      {labelsForStatus.highest}
                    </span>
                  </div>
                  {aggregates.length > 0 ? (
                    <div className="text-sm">
                      <span className="font-bold text-green-900">{aggregates[0].occupationName}</span>
                      <span className="text-gray-700"> ({aggregates[0].state})</span>
                      <div className="text-xl font-bold text-green-900">
                        {aggregates[0].totalInvites.toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-600">N/A</div>
                  )}
                </div>

                {/* 3) "Top" box */}
                <div className="group bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-6 border border-purple-200 
                           shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-purple-200 group-hover:bg-purple-300 transition-colors">
                      <Zap className="w-5 h-5 text-purple-700" />
                    </div>
                    <span className="text-sm font-medium text-purple-800">
                      {labelsForStatus.top}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-purple-900">
                    {highestInvites.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Table for top 20 (or top 5) aggregator rows */}
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <BarChart className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Top 20 (State + Occupation) for {monthName} {year}
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          State
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Occupation
                        </th>
                        {/* 190 column */}
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          190 Invites
                        </th>
                        {/* 491 column */}
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          491 Invites
                        </th>
                        {/* Total */}
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {displayedRows.map((row, index) => {
                        const isTopRow = index === 0;
                        return (
                          <tr
                            key={index}
                            className={
                              isTopRow
                                ? 'bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100 transition-all duration-300'
                                : 'hover:bg-blue-50/50 transition-all duration-300'
                            }
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                              {isTopRow && <Crown className="w-4 h-4 text-yellow-600" />}
                              {row.state}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {row.occupationName}
                            </td>
                            {/* 190 invites */}
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-bold">
                              {row.invitesByType['190'].toLocaleString()}
                            </td>
                            {/* 491 invites */}
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-bold">
                              {row.invitesByType['491'].toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                              {row.totalInvites.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {aggregates.length > 5 && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white 
                               bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl 
                               shadow-lg relative overflow-hidden hover:shadow-xl hover:translate-y-[-1px] 
                               focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                    translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                      {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {showAll ? 'Show Less' : 'Show More'}
                    </button>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="mt-6 bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-xl p-4 mx-auto
                           hover:bg-amber-100/80 transition-colors group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                             translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <div className="flex items-center gap-2 justify-center text-sm text-amber-700 animate-pulse">
                  <Star className="w-4 h-4 text-amber-500" />
                  <p>
                    Data is updated monthly. Values like &ldquo;&lt;20&rdquo; are approximations used for trending.
                    Always check official sources for final details.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrendingStates;