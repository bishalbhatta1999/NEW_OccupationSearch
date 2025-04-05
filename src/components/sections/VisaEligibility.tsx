import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  Building2
} from 'lucide-react';

/** 
 * Props for the VisaEligibility component.
 */
interface VisaEligibilityProps {
  content?: string;
  skillLevel?: string; // optional override from props
  occupationCode: string; // e.g. "261314"
}

/** 
 * The shape of each occupation in your Firebase data.
 */
interface FirebaseOccupationData {
  anzscoCode: string;
  Occupation?: string | null;
  'Skill Level'?: string | null;

  // Skilled lists
  OccupationTypeMLTSSL?: string | { OccupationList?: string | null; 'occupation list'?: string | null } | null;
  OccupationTypeSTSOL?: string | { OccupationList?: string | null; 'occupation list'?: string | null } | null;
  OccupationTypeROL?:   string | { OccupationList?: string | null; 'occupation list'?: string | null } | null;

  // Employer sub-types
  visaSubType186?: { OccupationList?: string | null; caveats?: string | null };
  visaSubType482?: { OccupationList?: string | null; caveats?: string | null };
  visaSubType494?: { OccupationList?: string | null; caveats?: string | null };
  visaSubType407?: { OccupationList?: string | null; caveats?: string | null };
  /** 187 no longer needs OccupationList because we just show 494's list instead */
  visaSubType187?: { OccupationList?: string | null; caveats?: string | null };
}

/** 
 * isNotNull now trims the string to handle cases like " MLTSSL ".
 */
function isNotNull(value?: string | null): boolean {
  if (!value) return false;
  const trimmed = value.trim().toLowerCase();
  // If it's empty or "null", return false, else true
  return trimmed !== '' && trimmed !== 'null';
}

/** 
 * This checks if a property is a plain string (e.g. "MLTSSL") 
 * or an object with "OccupationList" or "occupation list". 
 * We trim both to handle extra spaces.
 */
function checkSkilledList(
  entry?: string | { OccupationList?: string | null; 'occupation list'?: string | null } | null
): boolean {
  if (!entry) return false;

  if (typeof entry === 'string') {
    // e.g. "MLTSSL" or " MLTSSL "
    return isNotNull(entry);
  }

  // If it's an object
  if (entry.OccupationList && isNotNull(entry.OccupationList)) return true;
  if (entry['occupation list'] && isNotNull(entry['occupation list'])) return true;

  return false;
}

/** 
 * Convert long strings to short codes: 
 * "Medium and Long-term Strategic Skills List" => "MLTSSL"
 * "Short-term Skilled Occupation List" => "STSOL"
 * "Regional Occupation List" => "ROL"
 * "CSOL" => "CSOL"
 */
function beautifyListName(raw?: string | null): string {
  if (!raw) return 'N/A';
  const val = raw.trim().toLowerCase();
  if (!val || val === 'null') return 'N/A';

  if (val.includes('medium and long-term')) return 'MLTSSL';
  if (val.includes('short-term skilled'))   return 'STSOL';
  if (val.includes('regional occupation list')) return 'ROL';
  if (val.includes('csol')) return 'CSOL';
  return raw.trim(); // fallback
}

// Minimal caveat code => description
const caveatDescriptions: Record<string, string> = {
  '2': 'Clerical/bookkeeper/accounting clerk position.',
  '11': 'Position in a business with turnover < AUD1,000,000.',
  '13': 'Position in a business with fewer than 5 employees.',
};

/** parse "2,11,13" => ["2","11","13"] */
function parseCaveatCodes(caveatStr: string): string[] {
  return caveatStr
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const VisaEligibility: React.FC<VisaEligibilityProps> = ({
  content,
  skillLevel,
  occupationCode,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [occupationData, setOccupationData] = useState<FirebaseOccupationData | null>(null);

  // 1) Fetch from Firebase
  useEffect(() => {
    if (!occupationCode) return;

    const cleanCode = occupationCode.replace(/\D/g, '');
    if (cleanCode.length < 4) {
      setApiError('Invalid ANZSCO code format.');
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setApiError(null);
      setOccupationData(null);

      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const response = await fetch('https://newvisasubclass.firebaseio.com/.json', {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            cache: 'no-cache'
          });

          if (!response.ok) {
            throw new Error(`Firebase fetch failed. Status: ${response.status}`);
          }

          const rawData = await response.json();

          let typedData: FirebaseOccupationData[] = [];
          if (Array.isArray(rawData)) {
            typedData = rawData;
          } else if (rawData && typeof rawData === 'object') {
            typedData = Object.values(rawData) as FirebaseOccupationData[];
          } else {
            throw new Error('Unexpected format from Firebase.');
          }

          const found = typedData.find((item) => item.anzscoCode === cleanCode);
          if (!found) {
            throw new Error(`No occupation found for code ${cleanCode}.`);
          }

          setOccupationData(found);
          break; // success
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) {
            let errMsg = 'Failed to fetch occupation data. Please try again.';
            if (error instanceof Error) {
              errMsg = error.message;
            }
            setApiError(errMsg);
          } else {
            // exponential backoff
            await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, retryCount)));
          }
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, [occupationCode]);

  // 2) Skilled logic
  let isOnMLTSSL = false;
  let isOnSTSOL = false;
  let isOnROL = false;

  if (occupationData) {
    isOnMLTSSL = checkSkilledList(occupationData.OccupationTypeMLTSSL);
    isOnSTSOL = checkSkilledList(occupationData.OccupationTypeSTSOL);
    isOnROL   = checkSkilledList(occupationData.OccupationTypeROL);
  }

  // => MLTSSL => 189,190,491 (State & Family), 485
  const is189Eligible = isOnMLTSSL;
  const is190Eligible = isOnMLTSSL || isOnSTSOL;
  const is491StateEligible = isOnMLTSSL || isOnSTSOL || isOnROL;
  const is491FamilyEligible = isOnMLTSSL;
  const is485Eligible = isOnMLTSSL;

  // 3) Employer logic
  function employerEligible(subType: keyof FirebaseOccupationData) {
    if (!occupationData) return false;

    // Subclass 187 is always eligible
    if (subType === 'visaSubType187') return true;

    const sub = occupationData[subType];
    if (!sub) return false;

    // For 407, the field is "407List", not "OccupationList"
    if (subType === 'visaSubType407') {
      return isNotNull(sub['OccupationList']);
    }

    // For all other employer subclasses, we use "OccupationList"
    return isNotNull(sub.OccupationList);
  }

  // 4) Caveats
  const caveats482 = occupationData?.visaSubType482?.caveats || null;
  const caveats186 = occupationData?.visaSubType186?.caveats || null;

  const caveatCodes482 = caveats482 && caveats482.toLowerCase() !== 'null'
    ? parseCaveatCodes(caveats482)
    : [];
  const caveatCodes186 = caveats186 && caveats186.toLowerCase() !== 'null'
    ? parseCaveatCodes(caveats186)
    : [];

  const hasCaveats482 = caveatCodes482.length > 0;
  const hasCaveats186 = caveatCodes186.length > 0;

  // 5) Renders
  if (isLoading) {
    return (
      <section className="bg-white rounded-xl shadow-lg p-8 border border-blue-100">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-600">
            Loading visa eligibility data...
          </span>
        </div>
      </section>
    );
  }

  if (apiError) {
    return (
      <section className="bg-white rounded-xl shadow-lg p-8 border border-blue-100">
        <div className="p-6 border-l-4 border-red-500 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">Error: {apiError}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!occupationData) {
    return null;
  }

  // 6) Skilled & Employer tables only (no occupation details card)
  return (
    <section className="bg-white rounded-xl shadow-lg p-8 border border-blue-100">
      <div className="flex flex-col gap-6">
        {content && (
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-gray-700">{content}</p>
          </div>
        )}

        {/* SKILLED MIGRATION VISAS */}
        <div className="flex items-center gap-3">
          <FileCheck className="w-7 h-7 text-blue-600" />
          <div>
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Skilled Migration Visas
            </h3>
            <p className="text-sm text-gray-600">Check your eligibility for various skilled visa pathways</p>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-100 overflow-hidden 
                     hover:shadow-xl transition-all duration-300">
          <div className="p-4 bg-blue-50 border-b border-blue-100">
            <h4 className="text-lg font-semibold text-blue-900">Eligibility</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Visa Subclass
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Eligibility
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Occupation List
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* 189 => MLTSSL */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">Subclass 189</td>
                  <td className="px-6 py-4">
                    {is189Eligible ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-4 h-4" />
                        Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4" />
                        Not Eligible
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">{is189Eligible ? 'MLTSSL' : '-'}</td>
                </tr>
                {/* 190 => MLTSSL or STSOL */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">Subclass 190</td>
                  <td className="px-6 py-4">
                    {is190Eligible ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-4 h-4" />
                        Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4" />
                        Not Eligible
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {is190Eligible ? (isOnMLTSSL ? 'MLTSSL' : 'STSOL') : '-'}
                  </td>
                </tr>
                {/* 491 (State) => MLTSSL or STSOL or ROL */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">Subclass 491 (State Nominated)</td>
                  <td className="px-6 py-4">
                    {is491StateEligible ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-4 h-4" />
                        Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4" />
                        Not Eligible
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {is491StateEligible
                      ? isOnMLTSSL
                        ? 'MLTSSL'
                        : isOnSTSOL
                        ? 'STSOL'
                        : 'ROL'
                      : '-'}
                  </td>
                </tr>
                {/* 491 (Family) => MLTSSL */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">Subclass 491 (Family)</td>
                  <td className="px-6 py-4">
                    {is491FamilyEligible ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-4 h-4" />
                        Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4" />
                        Not Eligible
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">{is491FamilyEligible ? 'MLTSSL' : '-'}</td>
                </tr>
                {/* 485 => MLTSSL */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">Subclass 485</td>
                  <td className="px-6 py-4">
                    {is485Eligible ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-4 h-4" />
                        Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4" />
                        Not Eligible
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">{is485Eligible ? 'MLTSSL' : '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* EMPLOYER SPONSORED VISAS */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-indigo-100 overflow-hidden
                     hover:shadow-xl transition-all duration-300">
          <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-indigo-900">
                  Employer Sponsored Visas
                </h4>
                <p className="text-sm text-indigo-600/80">
                  Explore employer-sponsored migration pathways
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Visa Subclass
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Eligibility
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Occupation List
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* 482 */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">Subclass 482</td>
                  <td className="px-6 py-4">
                    {employerEligible('visaSubType482') ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-4 h-4" />
                        Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4" />
                        Not Eligible
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const raw = occupationData.visaSubType482?.OccupationList;
                      const displayName = beautifyListName(raw);
                      if (displayName === 'CSOL') {
                        return (
                          <span className="inline-flex items-center gap-1">
                            CSOL <Info className="w-4 h-4 text-blue-600" />
                          </span>
                        );
                      }
                      return displayName;
                    })()}
                  </td>
                </tr>
                {/* 186 */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">Subclass 186</td>
                  <td className="px-6 py-4">
                    {employerEligible('visaSubType186') ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-4 h-4" />
                        Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4" />
                        Not Eligible
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const raw = occupationData.visaSubType186?.OccupationList;
                      const displayName = beautifyListName(raw);
                      if (displayName === 'CSOL') {
                        return (
                          <span className="inline-flex items-center gap-1">
                            CSOL <Info className="w-4 h-4 text-blue-600" />
                          </span>
                        );
                      }
                      return displayName;
                    })()}
                  </td>
                </tr>
                {/* 187 => always eligible (but shows the same list as 494) */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">Subclass 187</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircle2 className="w-4 h-4" />
                      Eligible
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {/* Show the same occupation-list name as 494 */}
                    {beautifyListName(occupationData.visaSubType494?.OccupationList)}
                  </td>
                </tr>
                {/* 494 */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">Subclass 494</td>
                  <td className="px-6 py-4">
                    {employerEligible('visaSubType494') ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-4 h-4" />
                        Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4" />
                        Not Eligible
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {beautifyListName(occupationData.visaSubType494?.OccupationList)}
                  </td>
                </tr>
                {/* 407 */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">Subclass 407</td>
                  <td className="px-6 py-4">
                    {employerEligible('visaSubType407') ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-4 h-4" />
                        Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4" />
                        Not Eligible
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {beautifyListName(occupationData.visaSubType407?.['OccupationList'])}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Caveats Card (482 or 186) */}
        {(hasCaveats482 || hasCaveats186) && (
          <div className="mt-6 bg-gradient-to-r from-orange-50 to-amber-50/50 border border-orange-200 p-6 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div>
                <h5 className="text-orange-800 font-semibold mb-1">Caveats</h5>
                <ul className="list-disc ml-5 space-y-2 text-sm text-orange-700">
                  {hasCaveats482 && (
                    <li>
                      <strong>Subclass 482:</strong>
                      <div className="pl-4 mt-1 space-y-1">
                        {caveatCodes482.map((code) => (
                          <div key={code} className="flex items-start gap-2">
                            <span className="font-semibold">{code}.</span>
                            <span>
                              {caveatDescriptions[code] || 'Unknown caveat code.'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </li>
                  )}
                  {hasCaveats186 && (
                    <li>
                      <strong>Subclass 186:</strong>
                      <div className="pl-4 mt-1 space-y-1">
                        {caveatCodes186.map((code) => (
                          <div key={code} className="flex items-start gap-2">
                            <span className="font-semibold">{code}.</span>
                            <span>
                              {caveatDescriptions[code] || 'Unknown caveat code.'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50/50 border border-amber-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 group-hover:bg-amber-200/50 transition-colors">
              <XCircle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-amber-700 text-sm">
              Eligibility criteria and occupation lists are subject to change.
              Always verify current requirements on the{' '}
              <a
                href="https://immi.homeaffairs.gov.au"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-800 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
              >
                Department of Home Affairs website
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisaEligibility