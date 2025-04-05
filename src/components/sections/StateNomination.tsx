import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Building2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  FileCheck,
  AlertCircle,
  Globe,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth, checkAdminStatus } from '../../lib/firebase';
import { uploadStateNominationData } from '../../lib/stateNominationData';
import TrendingStates from './TrendingStates';

// ---------- Types ----------
interface StateNominationProps {
  content: string;
  /**
   * The raw ANZSCO code, e.g. '261313' or '411711'.
   * Provided by the parent (which might get it from OccupationHeader).
   */
  occupationCode?: string;

  /**
   * A classification such as 'MLTSSL', 'STSOL', or 'ROL'
   * (or possibly undefined if not known).
   * This helps us decide fallback eligibility for 190/491
   * if the code is not found in /state/.json.
   */
  occupationList?: 'MLTSSL' | 'STSOL' | 'ROL' | string;
}

interface StateAPIItem {
  anzsco: string;
  occupationName: string;
  ACT?: { eligible190: boolean; eligible491: boolean };
  NSW?: { eligible190: boolean; eligible491: boolean };
  VIC?: { eligible190: boolean; eligible491: boolean };
  QLD?: { eligible190: boolean; eligible491: boolean };
  WA?:  { eligible190: boolean; eligible491: boolean };
  SA?:  { eligible190: boolean; eligible491: boolean };
  TAS?: { eligible190: boolean; eligible491: boolean };
  NT?:  { eligible190: boolean; eligible491: boolean };
}

interface RowItem {
  stateName: string;
  website: string;
  visa190: boolean;
  visa491: boolean;
  isDamaPossible: boolean;
}

interface StateRequirementRec {
  stateName: string;
  requirements: string[];
  lastUpdated: string;
}

interface DamaRegion {
  regionName: string;
  regionData: { [key: string]: any };
}

interface DamaPivotEntry {
  occupationName: string;
  regions: DamaRegion[];
}

type DamaPivotData = Record<string, DamaPivotEntry>;

const statesMetadata = [
  { shortKey: 'ACT', name: 'Australian Capital Territory', website: 'https://www.act.gov.au/migrating_to_act/' },
  { shortKey: 'NSW', name: 'New South Wales',             website: 'https://www.nsw.gov.au/topics/visas-and-migration' },
  { shortKey: 'VIC', name: 'Victoria',                    website: 'https://liveinmelbourne.vic.gov.au/' },
  { shortKey: 'QLD', name: 'Queensland',                  website: 'https://migration.qld.gov.au/' },
  { shortKey: 'WA',  name: 'Western Australia',           website: 'https://migration.wa.gov.au/' },
  { shortKey: 'SA',  name: 'South Australia',             website: 'https://migration.sa.gov.au/' },
  { shortKey: 'TAS', name: 'Tasmania',                    website: 'https://www.migration.tas.gov.au/' },
  { shortKey: 'NT',  name: 'Northern Territory',          website: 'https://theterritory.com.au/migrate' },
];

/**
 * regionMap keys:
 *   "Kimberley, WA"
 *   "South Australia"
 *   "WA State-wide"
 *   ...
 * If your data has extra words (like "Kimberley, WA - Occupations"),
 * we do a partial match.
 */
const regionMap: Record<string, { fullName: string; link: string }> = {
  'Orana, NSW': {
    fullName: 'Regional Development Australia - Orana, NSW',
    link: 'https://www.rdaorana.org.au/',
  },
  'Pilbara, WA': {
    fullName: 'RDA Pilbara',
    link: 'https://www.rdapilbara.org.au/',
  },
  'South Australia': {
    fullName: 'Skilled & Business Migration (South Australia Regional DAMA)',
    link: 'https://migration.sa.gov.au/skilled-migrants/designated-area-migration-agreements',
  },
  'South West, WA': {
    fullName: 'Shire of Dardanup (South West DAMA)',
    link: 'https://www.dardanup.wa.gov.au/',
  },
  'TNQ, QLD': {
    fullName: 'Townsville Enterprise Limited (TNQ DAMA)',
    link: 'https://www.cairnschamber.com.au/visas-and-migration/tnq-dama',
  },
  'WA State-wide': {
    fullName: 'Department of Training and Workforce Development (WA State-wide DAMA)',
    link: 'https://migration.wa.gov.au/services/skilled-migration-wa/designated-area-migration-agreements-dama',
  },
  'Kalgoorlie (Goldfields), WA': {
    fullName: 'City of Kalgoorlie Boulder (Goldfields DAMA)',
    link: 'https://www.ckb.wa.gov.au/',
  },
  'Kimberley, WA': {
    fullName: 'East Kimberley Chamber of Commerce and Industry',
    link: 'https://www.kimberleychamber.com.au/',
  },
  'Northern Territory': {
    fullName: 'Northern Territory Designated Area Migration Agreement',
    link: 'https://theterritory.com.au/migrate/designated-area-migration-agreement',
  },
  'Far North Queensland': {
    fullName: 'Cairns Chamber of Commerce (Far North QLD)',
    link: 'https://www.cairnschamber.com.au/visas-and-migration/tnq-dama',
  },
  'Great South Coast, VIC': {
    fullName: 'Warrnambool City Council (Great South Coast DAMA)',
    link: 'https://www.warrnambool.vic.gov.au/great-south-coast-dama',
  },
  'Goulburn Valley, VIC': {
    fullName: 'Goulburn Valley DAMA',
    link: 'https://www.growgreatershepparton.com.au/live/goulburn-valley-dama',
  },
};

// ---------- Utility: fuzzy region matching ----------
function findRegionKey(regionName: string): string | null {
  // Lowercase the input
  const rLower = regionName.toLowerCase();
  // Check if there's a key in regionMap whose substring appears in rLower
  const keys = Object.keys(regionMap);
  // Example: if regionName includes "Kimberley, WA", we match that
  for (const key of keys) {
    if (rLower.includes(key.toLowerCase())) {
      return key;
    }
  }
  return null;
}

// Smaller icons: just a check or an X
function SmallEligibilityIcon({ eligible }: { eligible: boolean }) {
  return eligible ? (
    <CheckCircle2 className="w-4 h-4 text-green-600" />
  ) : (
    <XCircle className="w-4 h-4 text-red-600" />
  );
}

/** Convert a boolean or string ("true","yes") -> boolean, then show the icon. */
function toSmallEligibilityIcon(value: any) {
  let isEligible = false;
  if (typeof value === 'boolean') {
    isEligible = value;
  } else if (typeof value === 'string') {
    const s = value.toLowerCase();
    isEligible = s === 'true' || s === 'yes';
  }
  return <SmallEligibilityIcon eligible={isEligible} />;
}

const StateNomination: React.FC<StateNominationProps> = ({
  content,
  occupationCode,
  occupationList,
}) => {
  // Firestore-based custom requirements
  const [reqLoading, setReqLoading] = useState(true);
  const [reqError, setReqError] = useState<string | null>(null);
  const [stateRequirements, setStateRequirements] = useState<Record<string, StateRequirementRec>>({});
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // State data from /state/.json
  const [matrixRows, setMatrixRows] = useState<RowItem[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [statesError, setStatesError] = useState<string | null>(null);

  // DAMA pivot from /statedama/.json
  const [damaPivot, setDamaPivot] = useState<DamaPivotData>({});
  const [damaLoading, setDamaLoading] = useState(false);
  const [damaError, setDamaError] = useState<string | null>(null);

  // Expand/collapse for rows
  const [expandedState, setExpandedState] = useState<string | null>(null);

  // -----------------------------
  // (A) Firestore custom requirements
  // -----------------------------
  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        // Clean the ANZSCO code to ensure consistent format
        const cleanCode = occupationCode?.replace(/\D/g, '') || '';
        
        // Only attempt upload if user is admin
        if (auth.currentUser) {
          const isAdmin = await checkAdminStatus(auth.currentUser.uid);
          if (isAdmin) {
            await uploadStateNominationData(cleanCode);
          }
        }

        setReqLoading(true);
        setReqError(null);

        if (!cleanCode) {
          setReqError('Please provide an ANZSCO code.');
          setReqLoading(false);
          return;
        }

        // Ensure data is uploaded (if needed) then query
        await uploadStateNominationData(cleanCode);
        const ref = collection(db, 'stateRequirements');
        const q_ = query(ref, where('anzscocode', '==', cleanCode));
        const snap = await getDocs(q_);

        if (snap.empty) {
          setReqError(
            `No custom state requirements found in Firestore for ANZSCO: ${cleanCode}`
          );
        }

        const map: Record<string, StateRequirementRec> = {};
        let latest = '';

        snap.forEach((docSnap) => {
          const data = docSnap.data() as StateRequirementRec;
          if (data.stateName && data.requirements) {
            map[data.stateName] = {
              stateName: data.stateName,
              requirements: Array.isArray(data.requirements) ? data.requirements : [data.requirements],
              lastUpdated: data.lastUpdated
            };
            if (!latest || data.lastUpdated > latest) {
              latest = data.lastUpdated;
            }
          }
        });

        setStateRequirements(map);
        setLastUpdated(latest);
      } catch (err: any) {
        console.error(err);
        setReqError(err?.message || 'Failed to fetch Firestore state requirements');
      } finally {
        setReqLoading(false);
      }
    };

    fetchRequirements();
  }, [occupationCode]);

  // -----------------------------
  // (B) Fetch /state/.json for 190/491 data
  // -----------------------------
  useEffect(() => {
    const doFetchStates = async () => {
      if (!occupationCode) return; // no code => skip

      setStatesLoading(true);
      setStatesError(null);
      try {
        const res = await fetch('https://occupation-search.firebaseio.com/state/.json');
        if (!res.ok) throw new Error(`Bad status: ${res.status}`);
        const arr: StateAPIItem[] = await res.json();
        if (!Array.isArray(arr)) {
          throw new Error('Expected an array from /state/.json');
        }

        // Try to find an explicit entry for this ANZSCO
        const found = arr.find((item) => item.anzsco === occupationCode);

        const newRows: RowItem[] = statesMetadata.map((st) => {
          let _190 = false;
          let _491 = false;

          // If found in the JSON data
          if (found && (found as any)[st.shortKey]) {
            const stObj = (found as any)[st.shortKey];
            _190 = stObj.eligible190;
            _491 = stObj.eligible491;
          } else {
            // Fallback assumption based on occupationList
            if (occupationList === 'MLTSSL' || occupationList === 'STSOL') {
              _190 = true;
              _491 = true;
            } else if (occupationList === 'ROL') {
              _190 = false;
              _491 = true;
            } else {
              // If occupationList is unknown/undefined, default to false
              _190 = false;
              _491 = false;
            }
          }

          return {
            stateName: st.name,
            website: st.website,
            visa190: _190,
            visa491: _491,
            isDamaPossible: false,
          };
        });

        setMatrixRows(newRows);
      } catch (err: any) {
        console.error(err);
        setStatesError(err?.message || 'Failed to fetch states');
      } finally {
        setStatesLoading(false);
      }
    };

    doFetchStates();
  }, [occupationCode, occupationList]);

  // -----------------------------
  // (C) Fetch /statedama/.json pivot
  // -----------------------------
  useEffect(() => {
    const doFetchDama = async () => {
      if (!occupationCode) return; // no code => skip

      setDamaLoading(true);
      setDamaError(null);
      try {
        const resp = await fetch('https://occupation-search.firebaseio.com/statedama/.json');
        if (!resp.ok) throw new Error(`Bad status: ${resp.status}`);
        const pivot: DamaPivotData = await resp.json();
        if (typeof pivot !== 'object' || pivot === null) {
          throw new Error('Expected an object from /statedama/.json');
        }
        setDamaPivot(pivot);
      } catch (err: any) {
        console.error(err);
        setDamaError(err?.message || 'Failed to fetch statedama');
      } finally {
        setDamaLoading(false);
      }
    };

    doFetchDama();
  }, [occupationCode]);

  // -----------------------------
  // (D) Update matrixRows to mark isDamaPossible
  // -----------------------------
  useEffect(() => {
    if (!occupationCode || !damaPivot || !Object.keys(damaPivot).length) return;
    if (!matrixRows.length) return;

    const pivotEntry = damaPivot[occupationCode];
    if (!pivotEntry) return;

    let changed = false;
    const updatedRows = matrixRows.map((r) => {
      const matchedRegions = pivotEntry.regions.filter((rg) =>
        regionBelongsToState(r.stateName, rg.regionName)
      );
      const newVal = matchedRegions.length > 0;
      if (newVal !== r.isDamaPossible) {
        changed = true;
        return { ...r, isDamaPossible: newVal };
      }
      return r;
    });

    if (changed) {
      setMatrixRows(updatedRows);
    }
  }, [occupationCode, damaPivot, matrixRows]);

  // Expand/collapse row
  const handleRowToggle = (stateName: string) => {
    setExpandedState((prev) => (prev === stateName ? null : stateName));
  };

  // Check if region belongs to a given State
  function regionBelongsToState(stateFull: string, regionName: string): boolean {
    const abbrMap: Record<string, string> = {
      'Australian Capital Territory': 'ACT',
      'New South Wales': 'NSW',
      'Victoria': 'VIC',
      'Queensland': 'QLD',
      'Western Australia': 'WA',
      'South Australia': 'SA',
      'Tasmania': 'TAS',
      'Northern Territory': 'NT',
    };
    const abbr = abbrMap[stateFull] || '';
    return (
      regionName.toLowerCase().includes(abbr.toLowerCase()) ||
      regionName.toLowerCase().includes(stateFull.toLowerCase())
    );
  }

  // Render expansions for matched DAMA regions
  function renderDamaForState(stateName: string) {
    if (!occupationCode) return null;
    const pivotEntry = damaPivot[occupationCode];
    if (!pivotEntry) return null;

    const matched = pivotEntry.regions.filter((rg) =>
      regionBelongsToState(stateName, rg.regionName)
    );
    if (!matched.length) return null;

    return (
      <div className="mt-4 space-y-4">
        {matched.map((mr, idx) => {
          const data = mr.regionData || {};
          const occName = pivotEntry.occupationName || data.Occupation || '';
          // Use the partial-match function here
          const matchedKey = findRegionKey(mr.regionName) || '';
          // If found, great. If not, fallback to the raw string.
          const regionObj = regionMap[matchedKey] || {
            fullName: mr.regionName,
            link: '',
          };

          const possibleConcessions = [
            { key: 'Age Concession', label: 'Age Concession' },
            { key: 'English Language Concession', label: 'English Language Concession' },
            { key: 'SESR PR Pathway', label: 'SESR PR Pathway' },
            { key: 'TSMIT Concession', label: 'TSMIT Concession' },
          ];
          const altKeyMap: Record<string, string[]> = {
            'Age Concession': ['Age (Up to 55)'],
            'English Language Concession': ['English Concession'],
          };

          const lines: JSX.Element[] = [];
          possibleConcessions.forEach((item) => {
            let val = data[item.key];
            // If not found, check alt keys
            if (val === undefined && altKeyMap[item.key]) {
              for (const alt of altKeyMap[item.key]) {
                if (data[alt] !== undefined) {
                  val = data[alt];
                  break;
                }
              }
            }
            if (val !== undefined) {
              lines.push(
                <div key={item.key} className="flex items-center gap-2">
                  {toSmallEligibilityIcon(val)}
                  <span>{item.label}</span>
                </div>
              );
            }
          });

          const skillLevel = data['Skill Level'] || 'N/A';

          return (
            <div
              key={idx}
              className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm"
            >
              <div className="font-medium">
                🧑‍💼 {occName || 'Unknown Occupation'} (ANZSCO: {occupationCode})
              </div>
              <div className="mt-1">
                📍 <strong>{regionObj.fullName}</strong>
                {regionObj.link && (
                  <a
                    href={regionObj.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline ml-1 text-xs"
                  >
                    Visit <ExternalLink className="w-3 h-3 inline" />
                  </a>
                )}
              </div>
              <div className="border-t border-gray-300 my-2" />
              <div className="flex flex-col gap-1 text-sm">
                {/* lines for any concessions we found */}
                {lines.map((line, i) => (
                  <React.Fragment key={i}>{line}</React.Fragment>
                ))}
                {/* Always show skill level (N/A fallback) */}
                <div>📊 Skill Level: {skillLevel}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // RENDER
  return (
    <section className="bg-white rounded-xl shadow-lg p-6 border border-blue-100 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-600" />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">State/Territory Nominations</h3>
            {occupationCode && (
              <p className="text-sm text-gray-600 mt-1">
                ANZSCO: {occupationCode}
              </p>
            )}
          </div>
        </div>

        {/* Potential warnings if no code */}
        {!occupationCode && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-3">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="w-5 h-5" />
              <p>Please provide an ANZSCO code to see state requirements.</p>
            </div>
          </div>
        )}

        {/* Error messages */}
        {reqError && (
          <div className="bg-red-50 border border-red-200 text-center p-4 rounded-lg mt-3">
            <p className="text-red-600">{reqError}</p>
          </div>
        )}
        {statesError && (
          <div className="bg-red-50 border border-red-200 text-center p-4 rounded-lg mt-3">
            <p className="text-red-600">{statesError}</p>
          </div>
        )}
        {damaError && (
          <div className="bg-red-50 border border-red-200 text-center p-4 rounded-lg mt-3">
            <p className="text-red-600">{damaError}</p>
          </div>
        )}
      </div>

      {/* Example aggregator/stats */}
      <TrendingStates />

      {/* Comparison Matrix Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
        <table className="min-w-full border-collapse bg-white text-sm divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-100 to-blue-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-gray-800 tracking-wide">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>State/Territory</span>
                </div>
              </th>
              <th className="px-6 py-4 text-center font-semibold text-gray-800 tracking-wide">
                <span className="inline-flex items-center gap-1">
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                    190
                  </span>
                </span>
              </th>
              <th className="px-6 py-4 text-center font-semibold text-gray-800 tracking-wide">
                <span className="inline-flex items-center gap-1">
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                    491
                  </span>
                </span>
              </th>
              <th className="px-6 py-4 text-center font-semibold text-gray-800 tracking-wide">
                <span className="inline-flex items-center gap-1">
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                    DAMA
                  </span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {matrixRows.map((row) => {
              const isExpanded = expandedState === row.stateName;
              return (
                <React.Fragment key={row.stateName}>
                  <tr
                    onClick={() => handleRowToggle(row.stateName)}
                    className={`
                      cursor-pointer transition-all duration-200
                      ${
                        isExpanded
                          ? 'bg-blue-50/50 hover:bg-blue-100/50'
                          : 'hover:bg-gray-50'
                      }
                    `}
                  >
                    <td className="px-6 py-4 relative">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{row.stateName}</span>
                          <a
                            href={row.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="block text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            Visit Website <ExternalLink className="w-3 h-3 inline" />
                          </a>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-500 ml-auto" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500 ml-auto" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.visa190 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.visa491 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.isDamaPossible ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 mx-auto" />
                      )}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-gradient-to-r from-blue-50/50 to-indigo-50/10 animate-fadeIn">
                      <td colSpan={5} className="p-6">
                        {/* Firestore-based Requirements */}
                        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm mb-4">
                          <div className="flex items-center gap-2 text-gray-900">
                            <FileCheck className="w-4 h-4 text-blue-600" />
                            <h5 className="font-medium text-sm">Key Requirements (Firestore)</h5>
                            {stateRequirements[row.stateName]?.lastUpdated && (
                              <span className="text-xs text-gray-500 ml-2">
                                (Updated: {new Date(stateRequirements[row.stateName].lastUpdated).toLocaleDateString()})
                              </span>
                            )}
                          </div>
                          <ul className="mt-3 space-y-2">
                            {stateRequirements[row.stateName]?.requirements.map((req, idx) => (
                              <li key={idx} className="text-sm text-gray-700 leading-relaxed">
                                <div className="flex items-start gap-2">
                                  <span className="text-blue-600 mt-1">•</span>
                                  <span className="flex-1">{req}</span>
                                </div>
                              </li>
                            ))}
                            {(!stateRequirements[row.stateName] || !stateRequirements[row.stateName].requirements.length) && !reqLoading && (
                              <li className="text-gray-500 italic">
                                No custom requirements found.
                              </li>
                            )}
                          </ul>
                          {reqLoading && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                              <span>Loading requirements...</span>
                            </div>
                          )}
                        </div>

                        {/* DAMA expansions if applicable */}
                        {row.isDamaPossible && (
                          <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                            <h5 className="font-medium text-sm text-gray-900 mb-2">
                              DAMA Regions for {row.stateName}
                            </h5>
                            {damaLoading ? (
                              <p className="text-sm text-gray-500">Loading DAMA data...</p>
                            ) : (
                              renderDamaForState(row.stateName)
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Last Updated if available */}
      {!!lastUpdated && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Last Updated: {lastUpdated}</span>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-700 text-sm">
            <strong>Disclaimer:</strong> State nomination requirements and availability are
            subject to change. Always verify current requirements on the official state
            migration websites. Requirements and eligibility criteria may vary by state and
            territory.
          </p>
        </div>
      </div>
    </section>
  );
};

export default StateNomination;
