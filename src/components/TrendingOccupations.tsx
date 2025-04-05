import React, { useEffect, useState } from 'react'
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
  ArrowUp, 
  Sparkles,
  Rocket,
  TrendingDown,
  Info,
  RefreshCw
} from 'lucide-react'
import { db } from '../lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

interface TrendingOccupationsProps {
  selectedMonth: string
  selectedYear: string
}

/** Aggregated data about an occupation's invites. */
interface OccupationAggregate {
  anzscocode: string
  occupationName: string
  totalInvites: number
  /** Number of invites broken down by visa type. */
  invitesByType: {
    '189': number
    '190': number
    '491': number
    // You can store other or unknown visa types here if needed
    others: number
  }
}

/** Convert "01"-"12" to a full month name. */
function monthNumberToName(monthStr: string): string {
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ]
  const index = parseInt(monthStr, 10) - 1
  return months[index] || 'Unknown'
}

/**
 * parseCountEOIs: Convert Firestore’s `countEOIs` (string/number) to a numeric value.
 * If `<20`, interpret as 0 (or any logic you prefer). Otherwise parse the integer.
 */
function parseCountEOIs(raw: string | number | undefined): number {
  if (raw == null) return 0
  const str = String(raw).trim()
  if (str === '<20') {
    return 0
  }
  const parsed = parseInt(str, 10)
  return isNaN(parsed) ? 0 : parsed
}

/** Identify the visa type based on the Firestore field: e.g. "189PTS Points-Tested Stream" => "189". */
function parseVisaType(visaTypeStr: string | undefined): '189' | '190' | '491' | 'others' {
  if (!visaTypeStr) return 'others'
  const lower = visaTypeStr.toLowerCase()
  if (lower.includes('189')) return '189'
  if (lower.includes('190')) return '190'
  if (lower.includes('491')) return '491'
  return 'others'
}

const TrendingOccupations: React.FC<TrendingOccupationsProps> = ({
  selectedMonth,
  selectedYear,
}) => {
  const [occupations, setOccupations] = useState<OccupationAggregate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false) // "Show More" / "Show Less"

  const monthName = monthNumberToName(selectedMonth)

  const fetchTrendingOccupations = async () => {
    setLoading(true)
    setError(null)

    try {
      // Query "point" collection for docs matching (month, year, eoiStatus=INVITED)
      const pointRef = collection(db, 'point')
      const q = query(
        pointRef,
        where('month', '==', selectedMonth),
        where('year', '==', selectedYear),
        where('eoiStatus', '==', 'INVITED')
      )

      const snapshot = await getDocs(q)
      if (snapshot.empty) {
        setOccupations([])
        setError('No trending occupation data found.')
        return
      }

      const aggMap = new Map<string, OccupationAggregate>()

      snapshot.forEach((docSnap) => {
        const d = docSnap.data() || {}
        const code = d.anzscocode || ''
        const occName = d.occupationName || ''
        const rawCount = d.countEOIs
        const eoiCount = parseCountEOIs(rawCount)
        const vt = parseVisaType(d.visaType)

        // Construct a unique key by code+occupationName
        const key = `${code}||${occName}`
        if (!aggMap.has(key)) {
          aggMap.set(key, {
            anzscocode: code,
            occupationName: occName,
            totalInvites: 0,
            invitesByType: {
              '189': 0,
              '190': 0,
              '491': 0,
              others: 0,
            },
          })
        }

        // Update aggregator
        const agg = aggMap.get(key)!
        agg.totalInvites += eoiCount
        // Increment count for the specific visa type
        agg.invitesByType[vt] += eoiCount
      })

      // Convert the map to an array
      const results = Array.from(aggMap.values())
      // Sort descending by total invites
      results.sort((a, b) => b.totalInvites - a.totalInvites)
      // Limit to top 20
      const top20 = results.slice(0, 20)
      setOccupations(top20)
    } catch (err) {
      console.error(err)
      setError('Failed to load trending occupations.')
    } finally {
      setLoading(false)
    }
  }

  // Re-fetch data whenever selectedMonth/Year changes
  useEffect(() => {
    fetchTrendingOccupations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear])

  // Summaries
  const totalInvites = occupations.reduce((sum, occ) => sum + occ.totalInvites, 0)
  const mostInvited = occupations[0]?.occupationName || 'N/A'
  const topInvites = occupations[0]?.totalInvites || 0

  // Show 5 by default, or all 20 if "Show More"
  const displayedOccupations = showAll ? occupations : occupations.slice(0, 5)

  // Loading / Error States
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-600">Loading trending occupations...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center h-64 text-red-600">
          <span>{error}</span>
        </div>
      </div>
    )
  }

  // Main UI
  return (
    <div className="relative w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Wave background */}
      <div className="absolute inset-0 pointer-events-none -z-10 opacity-30">
        <svg
          className="w-full h-full"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 720"
        >
          <path
            fill="url(#gradient)"
            fillOpacity="0.5"
            d="M0,32L48,42.7C96,53,192,75,288,101.3C384,128,480,160,576,154.7C672,149,768,107,864,117.3C960,128,1056,192,1152,224C1248,256,1344,256,1392,256L1440,256L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="w-full py-8 px-6 sm:px-8">
        <div className="bg-white/80 backdrop-blur-sm">
          {/* Header */}
          <div className="p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-200 rounded-full opacity-10 translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg relative">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">
                    Trending Occupations
                  </h2>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Top 20 by Invites ({monthName} {selectedYear})
                  </p>
                </div>
              </div>

              {/* Refresh */}
              <button
                onClick={fetchTrendingOccupations}
                className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Invitations */}
              <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 border border-blue-200 
                            shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                              translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-200 group-hover:bg-blue-300 transition-colors">
                    <Target className="w-5 h-5 text-blue-700" />
                  </div>
                  <span className="text-sm font-medium text-blue-800">Total Invitations</span>
                </div>
                <div className="text-3xl font-bold text-blue-900">
                  {totalInvites.toLocaleString()}
                </div>
              </div>

              {/* Most Invited Occupation */}
              <div className="group relative bg-gradient-to-br from-green-50 to-emerald-100/50 rounded-xl p-6 border border-green-200 
                            shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                              translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-200 group-hover:bg-green-300 transition-colors">
                    <Award className="w-5 h-5 text-green-700" />
                  </div>
                  <span className="text-sm font-medium text-green-800">Most Invited Occupation</span>
                </div>
                <div className="text-lg font-bold text-green-900 truncate">
                  {mostInvited}
                </div>
              </div>

              {/* Top Invitations */}
              <div className="group relative bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-6 border border-purple-200 
                            shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                              translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-200 group-hover:bg-purple-300 transition-colors">
                    <Zap className="w-5 h-5 text-purple-700" />
                  </div>
                  <span className="text-sm font-medium text-purple-800">Top Invitations</span>
                </div>
                <div className="text-3xl font-bold text-purple-900">
                  {topInvites.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <BarChart className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Top 20 Occupations for {monthName} {selectedYear}
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      ANZSCO
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Occupation
                    </th>
                    {/* Visa Type columns */}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      189 Invites
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      190 Invites
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      491 Invites
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Total Invites
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {displayedOccupations.map((occ, index) => {
                    const rowIndex = occupations.indexOf(occ) // actual index in the full array
                    const isTopRow = rowIndex === 0
                    const isTopThree = rowIndex < 3

                    return (
                      <tr
                        key={index}
                        className={
                          isTopRow
                            ? 'bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100 transition-all duration-300'
                            : isTopThree
                              ? 'bg-gradient-to-r from-blue-50/30 to-indigo-50/30 hover:from-blue-100/50 hover:to-indigo-100/50 transition-all duration-300'
                              : 'hover:bg-blue-50/50 transition-all duration-300'
                        }
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 flex items-center gap-2">
                          {isTopRow && (
                            <div className="relative">
                              <Crown className="w-5 h-5 text-yellow-600 animate-pulse" />
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                            </div>
                          )}
                          {!isTopRow && isTopThree && (
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-600">{rowIndex + 1}</span>
                            </div>
                          )}
                          {occ.anzscocode}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {occ.occupationName}
                        </td>
                        {/* 189 column */}
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {occ.invitesByType['189'].toLocaleString()}
                        </td>
                        {/* 190 column */}
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {occ.invitesByType['190'].toLocaleString()}
                        </td>
                        {/* 491 column */}
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {occ.invitesByType['491'].toLocaleString()}
                        </td>
                        {/* Total invites */}
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          {occ.totalInvites.toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Show More / Show Less */}
            {occupations.length > 5 && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white 
                           bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg relative 
                           overflow-hidden hover:shadow-xl hover:translate-y-[-1px] focus:outline-none 
                           focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showAll ? 'Show Less' : 'Show More'}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Disclaimer */}
        <div className="mt-6 bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-xl p-4 mx-auto 
                       hover:bg-amber-100/80 transition-colors group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                         translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
          <div className="flex items-center gap-2 justify-center text-sm text-amber-700 animate-pulse">
            <Star className="w-4 h-4 text-amber-500" />
            <p>Data is updated monthly based on the Department of Home Affairs invitation rounds</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrendingOccupations
