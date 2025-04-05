import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { DropdownFilter, type Option } from './ui/DropdownFilter';
import axios from 'axios';

import {
  AlertCircle,
  RefreshCw,
  Users,
  TrendingUp,
  Calendar,
  FileCheck,
  ChevronDown,
  LayoutGrid,
  Table,
  CheckCircle2,
  Star, // <--- ADDED import for Star from lucide-react
} from 'lucide-react';

import TrendingOccupations from './TrendingOccupations';

/** EOIDetail is the structure after we transform from Firestore docs. */
interface EOIDetail {
  visa_type: string;   // e.g. "189", "190", "491"
  point: string;       // e.g. "125"
  prefix: string;      // (unused)
  EOI_count: string;   // e.g. "<20"
  EOI_status: string;  // e.g. "SUBMITTED"
  EOI_month: string;   // e.g. "06"
  EOI_year: string;    // e.g. "2024"
  VType: string;       // (unused)
  visa_title: string;  // the raw "visaType" from Firestore
  color?: string;      // optional
}

/** Filter state for the EOIDashboard. */
interface FilterState {
  month: string;
  year: string;
  status: string;
}

/** Month options for dropdowns. */
const monthOptions: Option[] = [
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

/** Year options. */
const yearOptions: Option[] = [
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' },
  { value: '2021', label: '2021' },
];

/** Status options. */
const statusOptions: Option[] = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'INVITED', label: 'Invited' },
  { value: 'LODGED', label: 'Lodged' },
  { value: 'HELD', label: 'Held' },
  { value: 'HOLD', label: 'Hold' },
  { value: 'CLOSED', label: 'Closed' },
];

/** A helper function to parse "189PTS Points-Tested Stream" into "189", etc. */
function parseVisaType(visaTypeStr: string): string {
  if (!visaTypeStr) return '';
  if (visaTypeStr.includes('189')) return '189';
  if (visaTypeStr.includes('190')) return '190';
  if (visaTypeStr.includes('491') && visaTypeStr.includes('Family')) return '491 FSR';
  if (visaTypeStr.includes('491') && visaTypeStr.includes('State')) return '491 SNR';
  return visaTypeStr;
}

/**
 * A convenience function to format EOI_count so that:
 *   - if Firestore value is "<20", show "<20"
 *   - if numeric and < 20, show "<20"
 *   - if numeric and >= 20, show the exact number
 */
function formatEOICount(rawCount: string | number) {
  const trimmed = String(rawCount ?? '').trim();

  // If Firestore literally stores "<20", show "<20"
  if (trimmed === '<20') {
    return { numericCount: 0, displayCount: '<20' };
  }

  const parsed = parseInt(trimmed, 10);
  if (!isNaN(parsed)) {
    // If the integer is less than 20, display as "<20"
    if (parsed < 20) {
      return { numericCount: parsed, displayCount: '<20' };
    }
    // Otherwise, show the numeric value
    return { numericCount: parsed, displayCount: parsed.toString() };
  }

  // Fallback if parsing fails
  return { numericCount: 0, displayCount: '<20' };
}

/** Mapping from short visa_type to descriptive heading. */
const visaTypeMapping: Record<string, string> = {
  '189': 'Subclass 189 Skilled Independent visa (Points-tested stream)',
  '190': 'Subclass 190 Skilled Nominated visa',
  '491 FSR': '491 FSR Family Sponsored - Regional',
  '491 SNR': '491 SNR State or Territory Nominated - Regional',
};

/**
 * Return { month, year } as strings representing the *previous* month
 * from today's date. For example, if it's currently March 2025,
 * this will return: { month: '02', year: '2025' }.
 */
function getDefaultPrevMonthYear(): { month: string; year: string } {
  const now = new Date();
  let m = now.getMonth() + 1; // 1-based month
  let y = now.getFullYear();

  // Subtract 1 month
  m -= 1;
  if (m <= 0) {
    m += 12;
    y -= 1;
  }

  return {
    month: String(m).padStart(2, '0'), // e.g. '02'
    year: String(y),                   // e.g. '2025'
  };
}

const EOIDashboard: React.FC = () => {
  // Occupation code from global or parent context
  const occupationCode = (window as any).selectedOccupation?.anzsco_code || '';

  // Determine default filter values dynamically (previous month/year)
  const { month: defaultMonth, year: defaultYear } = getDefaultPrevMonthYear();

  // EOI data, loading, error states
  const [eoiDetails, setEoiDetails] = useState<EOIDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Collapsing sections in the table view
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  // Expanding sections in the card view
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    month: defaultMonth,  // e.g. '02'
    year: defaultYear,    // e.g. '2025'
    status: 'SUBMITTED',  // or pick any default status
  });

  // **CHANGED**: Default view is now 'cards' instead of 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // -----------------------------
  // Fetch EOI data from Firestore
  // -----------------------------
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!occupationCode) {
        setError('Please select an occupation first');
        setEoiDetails([]);
        return;
      }

      const pointRef = collection(db, 'point');
      const q = query(
        pointRef,
        where('anzscocode', '==', occupationCode),
        where('month', '==', filters.month),
        where('year', '==', filters.year),
        where('eoiStatus', '==', filters.status)
      );

      const snapshot = await getDocs(q);
      const newData: EOIDetail[] = snapshot.docs.map((doc) => {
        const d = doc.data() as any;
        return {
          visa_type: parseVisaType(d.visaType || ''),
          // IMPORTANT: Firestore might store "Points" with a capital "P"
          point: String(d.Points ?? ''),
          prefix: '',
          EOI_count: String(d.countEOIs ?? ''),
          EOI_status: d.eoiStatus || '',
          EOI_month: d.month || '',
          EOI_year: d.year || '',
          VType: '',
          visa_title: d.visaType || '',
        };
      });

      setEoiDetails(newData);

      if (newData.length === 0) {
        setError('No EOI data available for the selected criteria');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load EOI data. Please try again later.');
      setEoiDetails([]);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch data whenever filters or occupationCode changes
  useEffect(() => {
    if (occupationCode) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, occupationCode]);

  /** Group EOI details by (transformed) `visa_type`. */
  const groupedDataByVisaType = eoiDetails.reduce((acc, item) => {
    const vt = item.visa_type;
    if (!acc[vt]) {
      acc[vt] = [];
    }
    acc[vt].push(item);
    return acc;
  }, {} as Record<string, EOIDetail[]>);

  /** Toggle expand/collapse in table view. */
  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Render a collapsible “card” for the "Cards" view
  const renderVisaTypeCard = (visaType: string, heading: string) => {
    const items = groupedDataByVisaType[visaType] || [];
    const isExpanded = expandedSections[visaType];

    // Convert items to a more usable format
    const formattedItems = items
      .map((item) => {
        const points = parseInt(item.point, 10) || 0;
        const { numericCount, displayCount } = formatEOICount(item.EOI_count);
        return {
          points,
          count: numericCount,
          displayCount,
        };
      })
      // Sort descending by points
      .sort((a, b) => b.points - a.points);

    return (
      <div 
        key={visaType}
        className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden 
                   hover:shadow-lg hover:border-blue-200 transition-all duration-300 ease-in-out 
                   transform hover:-translate-y-1"
      >
        {/* Header row */}
        <div
          className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50
                     cursor-pointer group-hover:from-blue-100/50 group-hover:to-indigo-100/50
                     transition-all duration-300 border-b border-gray-200"
          onClick={() =>
            setExpandedSections((prev) => ({ ...prev, [visaType]: !prev[visaType] }))
          }
        >
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100/50 group-hover:bg-blue-200/50 transition-colors">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{heading}</h3>
              <p className="text-sm text-gray-600">
                {formattedItems.length} entries
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ChevronDown
              className={`w-5 h-5 text-blue-600 transition-all duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {/* Points/Count rows (collapse if isExpanded is false) */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            !isExpanded ? 'max-h-0 overflow-hidden' : 'max-h-[800px]'
          }`}
        >
          {formattedItems.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500 italic">No data available for this stream</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {formattedItems.map((fi, idx) => (
                <div key={idx} className="p-4 hover:bg-blue-50/50 transition-all duration-200">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100/50">
                        <Star className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {fi.points} Points
                        </div>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          fi.displayCount === '<20'
                            ? 'bg-gray-100/50 text-gray-600 border border-gray-200'
                            : 'bg-emerald-100/50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        <Users className="w-3 h-3 mr-1" />
                        {fi.displayCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Show unknown visa types (not in visaTypeMapping)
  const SHOW_UNKNOWN_VISA_TYPES = true;
  const orderedVisaTypes = Object.entries(visaTypeMapping);
  const allKeys = Object.keys(groupedDataByVisaType);
  const knownKeys = Object.keys(visaTypeMapping);
  const unknownTypes = allKeys.filter((k) => !knownKeys.includes(k));

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1920px] mx-auto">
      {/* Combined Card: EOI Round Details + Filter EOI Data */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* EOI Round Details */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">EOI Round Details</h2>
                <p className="text-base text-gray-600">
                  ANZSCO: <span className="font-medium">{occupationCode}</span> •{' '}
                  {
                    monthOptions.find((m) => m.value === filters.month)?.label
                  }{' '}
                  {filters.year} • {filters.status}
                </p>
              </div>
            </div>
          </div>
          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={!occupationCode || loading}
            className="px-4 py-2 text-sm font-medium bg-white text-blue-600 
                       hover:bg-blue-50 border border-blue-200
                       rounded-lg transition-colors flex items-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Filters (in the same card) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filter EOI Data</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <DropdownFilter
              options={monthOptions}
              value={filters.month}
              onChange={(value) => setFilters((prev) => ({ ...prev, month: value }))}
              placeholder="Select Month"
            />
            <DropdownFilter
              options={yearOptions}
              value={filters.year}
              onChange={(value) => setFilters((prev) => ({ ...prev, year: value }))}
              placeholder="Select Year"
            />
            <DropdownFilter
              options={statusOptions}
              value={filters.status}
              onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              placeholder="Select Status"
            />
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setViewMode('cards')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
            viewMode === 'cards'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="text-sm font-medium">Cards</span>
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
            viewMode === 'table'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Table className="w-4 h-4" />
          <span className="text-sm font-medium">Table</span>
        </button>
      </div>

      {/* Loading Banner */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-4 border-blue-300 border-t-blue-600 mr-3" />
          <p className="text-blue-600 font-medium">Fetching Latest EOI Data...</p>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Trending Occupations */}
      <div className="pt-2">
        <TrendingOccupations
          selectedMonth={filters.month}
          selectedYear={filters.year}
        />
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-fadeIn">
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Table className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">EOI Data Overview</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Grouped by visa subclass with detailed points breakdown
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="space-y-6 p-6">
              {/* Known visa types */}
              {Object.entries(visaTypeMapping).map(([visaType, heading]) => {
                const visaData = eoiDetails.filter((detail) => detail.visa_type === visaType);
                if (visaData.length === 0) return null;

                return (
                  <div
                    key={visaType}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 
                                 cursor-pointer hover:bg-blue-100/50 transition-all duration-300"
                      onClick={() => toggleSection(visaType)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <FileCheck className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{heading}</h3>
                          <p className="text-sm text-gray-600">
                            {visaData.length} invitation rounds
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
                          !collapsedSections[visaType] ? 'rotate-180' : ''
                        }`}
                      />
                    </div>

                    {/* Expand/Collapse section */}
                    {!collapsedSections[visaType] && (
                      <div className="divide-y divide-gray-100">
                        {visaData.map((detail, index) => {
                          const { displayCount } = formatEOICount(detail.EOI_count);
                          return (
                            <div key={index} className="p-4 hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col items-center">
                                    <span className="text-sm text-gray-600">Points</span>
                                    <span className="text-xl font-bold text-blue-600">
                                      {detail.point}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm text-gray-600">EOI Count</span>
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                                        displayCount === '<20'
                                          ? 'bg-gray-100 text-gray-600 border border-gray-200'
                                          : 'bg-green-100 text-green-800 border border-green-200'
                                      }`}
                                    >
                                      {displayCount}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col items-end">
                                    <span className="text-sm text-gray-600">Status</span>
                                    <span className="inline-flex items-center gap-1.5 text-blue-600">
                                      {detail.EOI_status === 'INVITED' && (
                                        <CheckCircle2 className="w-4 h-4" />
                                      )}
                                      {detail.EOI_status}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <span className="text-sm text-gray-600">Date</span>
                                    <span className="text-gray-900">
                                      {detail.EOI_month}/{detail.EOI_year}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Optionally show unknown visa types */}
              {SHOW_UNKNOWN_VISA_TYPES &&
                allKeys
                  .filter((k) => !knownKeys.includes(k))
                  .map((unknownVT) => {
                    const data = eoiDetails.filter((d) => d.visa_type === unknownVT);
                    if (data.length === 0) return null;

                    return (
                      <div
                        key={unknownVT}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                      >
                        <div
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50
                                   cursor-pointer hover:bg-blue-100/50 transition-all duration-300"
                          onClick={() => toggleSection(unknownVT)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-blue-100">
                              <FileCheck className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                Subclass {unknownVT}
                              </h3>
                              <p className="text-sm text-gray-600">{data.length} invitation rounds</p>
                            </div>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
                              !collapsedSections[unknownVT] ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                        {!collapsedSections[unknownVT] && (
                          <div className="divide-y divide-gray-100">
                            {data.map((detail, index) => {
                              const { displayCount } = formatEOICount(detail.EOI_count);
                              return (
                                <div key={index} className="p-4 hover:bg-gray-50">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="flex flex-col items-center">
                                        <span className="text-sm text-gray-600">Points</span>
                                        <span className="text-xl font-bold text-blue-600">
                                          {detail.point}
                                        </span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm text-gray-600">EOI Count</span>
                                        <span
                                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                                            displayCount === '<20'
                                              ? 'bg-gray-100 text-gray-600 border border-gray-200'
                                              : 'bg-green-100 text-green-800 border border-green-200'
                                          }`}
                                        >
                                          {displayCount}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="flex flex-col items-end">
                                        <span className="text-sm text-gray-600">Status</span>
                                        <span className="inline-flex items-center gap-1.5 text-blue-600">
                                          {detail.EOI_status === 'INVITED' && (
                                            <CheckCircle2 className="w-4 h-4" />
                                          )}
                                          {detail.EOI_status}
                                        </span>
                                      </div>
                                      <div className="flex flex-col items-end">
                                        <span className="text-sm text-gray-600">Date</span>
                                        <span className="text-gray-900">
                                          {detail.EOI_month}/{detail.EOI_year}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
            </div>

            {/* Simple Pagination UI (static placeholder) */}
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to{' '}
                  <span className="font-medium">10</span> of{' '}
                  <span className="font-medium">{eoiDetails.length}</span> results
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Previous
                </button>
                <button className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Expression of Interest Details</h2>
                <p className="text-sm text-gray-600">Detailed breakdown by visa type and points</p>
              </div>
            </div>
          </div>

          {/* If no data at all (and not loading), top-level message */}
          {eoiDetails.length === 0 && !loading && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200 
                         p-8 rounded-2xl text-center shadow-lg">
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 rounded-full bg-amber-100">
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-xl font-semibold text-amber-800 mb-2">No EOI Data Available</h3>
                  <p className="text-amber-700 leading-relaxed">
                    No data found for the selected filters. Try adjusting your search criteria.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Render known + unknown visa types as collapsible “cards” */}
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-4 gap-6">
            {orderedVisaTypes.map(([typeKey, heading]) =>
              renderVisaTypeCard(typeKey, heading)
            )}
            {SHOW_UNKNOWN_VISA_TYPES &&
              unknownTypes.map((k) => renderVisaTypeCard(k, `Subclass ${k}`))}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-6">
            <div className="flex items-center gap-2 justify-center text-sm text-gray-600">
              <AlertCircle className="w-4 h-4" />
              <p>For privacy protection, EOI counts of 20 or fewer are displayed as '&lt;20'</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EOIDashboard;