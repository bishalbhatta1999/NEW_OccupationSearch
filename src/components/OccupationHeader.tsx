import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  Building2,
  Globe,
  ExternalLink,
  AlertCircle,
  Link as LinkIcon,
  FileCheck,
  Award,
  MapPin,
  Calendar
} from 'lucide-react';
import PDFGenerator from '../utils/pdfGenerator';
import { type Occupation } from '../types';

/** The shape of the AA (ANZSCO) data. */
export interface ApiResponse {
  occupation_list?: string;  // e.g. "MLTSSL", "STSOL", "ROL"
  skill_level?: string;      // e.g. numeric or 'N/A'
  occupation_link?: string;  // e.g. 'https://example.com'
}

/** The shape of the OSCA data. */
export interface OscaResponse {
  osca_name?: string;    // e.g. "Corporate Services Manager"
  link?: string;         // e.g. "OSCA Link"
  skill_level?: string;  // e.g. "1"
}

/** Combine both pieces of data to return to the parent. */
export interface OccupationApiPayload {
  aaData: ApiResponse;           // AA/ANZSCO info
  oscaData: OscaResponse | null; // OSCA info, or null if not found
}

interface OccupationHeaderProps {
  occupation: Occupation;  // includes .anzsco_code, .osca_code, etc.

  /**
   * Parent can catch the loaded data
   * and store them in state for global usage.
   */
  onApiDataLoaded?: (payload: OccupationApiPayload) => void;
}

const OccupationHeader: React.FC<OccupationHeaderProps> = ({
  occupation,
  onApiDataLoaded,
}) => {
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [oscaData, setOscaData] = useState<OscaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // Avoid re-fetching if the same combination of codes is used
  const lastFetchedRef = useRef<{ anzsco_code: string; osca_code: string } | null>(null);

  useEffect(() => {
    // If we have no ANZSCO code, skip
    if (!occupation.anzsco_code) {
      return;
    }

    // Build a key to detect repeated fetch
    const codeKey = (occupation.anzsco_code || '') + '|' + (occupation.osca_code || '');
    if (
      lastFetchedRef.current &&
      codeKey ===
        lastFetchedRef.current.anzsco_code + '|' + lastFetchedRef.current.osca_code
    ) {
      // same combo => skip
      return;
    }

    // Update ref
    lastFetchedRef.current = {
      anzsco_code: occupation.anzsco_code,
      osca_code: occupation.osca_code || '',
    };

    setError(null);
    setLoading(true);

    // Clean ANZSCO up to 6 digits
    const cleanAnzsco = occupation.anzsco_code.replace(/\D/g, '').slice(0, 6);
    // Clean OSCA code (6 digits if possible)
    const cleanOsca = occupation.osca_code
      ? occupation.osca_code.replace(/\D/g, '')
      : '';

    const fetchData = async () => {
      try {
        // 1) Fetch from both endpoints
        const [aaResp, oscaResp] = await Promise.all([
          fetch('https://occupation-search-default-rtdb.firebaseio.com/AA.json'),
          fetch('https://occupation-search-default-rtdb.firebaseio.com/osca.json'),
        ]);

        if (!aaResp.ok || !oscaResp.ok) {
          throw new Error('One or more endpoints failed.');
        }

        // 2) Parse responses
        const [aaData, oscaDataJson] = await Promise.all([
          aaResp.json(),
          oscaResp.json(),
        ]);

        // Convert AA to array if needed
        const aaItems = aaData && typeof aaData === 'object' ? Object.values(aaData) : [];
        // Convert OSCA to array if needed
        const oscaItems =
          oscaDataJson && typeof oscaDataJson === 'object'
            ? Object.values(oscaDataJson)
            : [];

        // ------------------- ANZSCO MATCH -------------------
        let matchedOccupation = null;
        if (cleanAnzsco.length >= 4) {
          matchedOccupation = aaItems.find((item: any) => {
            return item?.OCode?.toString() === cleanAnzsco;
          });
        }

        let finalData: ApiResponse;
        if (!matchedOccupation) {
          // fallback if no match
          // e.g., default to MLTSSL for certain codes
          const isSoftwareOccupation =
            cleanAnzsco.startsWith('261') ||
            cleanAnzsco.startsWith('262') ||
            cleanAnzsco.startsWith('263');

          finalData = {
            occupation_list: isSoftwareOccupation ? 'MLTSSL' : undefined,
            skill_level: '1',
            occupation_link: undefined,
          };
        } else {
          // unify OccupationType into a single string
          let rawListVal = '';
          if (Array.isArray(matchedOccupation.OccupationType)) {
            rawListVal = matchedOccupation.OccupationType.join(', ');
          } else {
            rawListVal = matchedOccupation.OccupationType || '';
          }

          // check for MLTSSL, STSOL, ROL
          const lower = rawListVal.toLowerCase();
          const tokens: string[] = [];
          if (lower.includes('mltssl')) tokens.push('MLTSSL');
          if (lower.includes('stsol')) tokens.push('STSOL');
          if (lower.includes('rol')) tokens.push('ROL');

          let normalizedList: string | undefined;
          if (tokens.length > 0) {
            normalizedList = tokens.join(', ');
          } else {
            normalizedList = rawListVal ? rawListVal : undefined;
          }

          finalData = {
            occupation_list: normalizedList,
            skill_level: matchedOccupation.SLevel?.toString() || 'N/A',
            occupation_link: matchedOccupation.OLink || undefined,
          };
        }

        // ------------------- OSCA MATCH -------------------
        let matchedOsca = null;
        if (cleanOsca) {
          const oscaEntries =
            oscaDataJson && typeof oscaDataJson === 'object'
              ? Object.entries(oscaDataJson)
              : [];

          // match by the key first
          const foundByKey = oscaEntries.find(([key]) => key === cleanOsca);
          if (foundByKey) {
            matchedOsca = foundByKey[1];
          } else {
            // fallback: check "OSCA Code" property
            matchedOsca = oscaItems.find((item: any) => {
              return item['OSCA Code']?.toString() === cleanOsca;
            });
          }
        }

        let finalOsca: OscaResponse | null = null;
        if (matchedOsca) {
          finalOsca = {
            osca_name: matchedOsca['Occupation Name'] || '',
            link: matchedOsca['OSCA Link'] || '',
            skill_level: matchedOsca['Skill Level'] || '',
          };
          setOscaData(finalOsca);
        } else {
          setOscaData(null);
        }

        // 4) Update state
        setApiData(finalData);

        // Pass data to parent
        onApiDataLoaded?.({
          aaData: finalData,
          oscaData: finalOsca,
        });

      } catch (err) {
        console.error('API Error:', err);
        setError('Failed to fetch occupation data.');
        const fallbackData: ApiResponse = {
          occupation_list: undefined,
          skill_level: undefined,
          occupation_link: undefined,
        };
        setApiData(fallbackData);
        setOscaData(null);
        onApiDataLoaded?.({
          aaData: fallbackData,
          oscaData: null,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [occupation.anzsco_code, occupation.osca_code, onApiDataLoaded]);

  // RENDER
  // Generate PDF report
  const generatePDF = async () => {
    setPdfGenerating(true);
    try {
      // Initialize PDF with cover page options
      const pdf = new PDFGenerator({
        coverTitle: 'Occupation Report',
        coverSubtitle: `${occupation.occupation_name}\nANZSCO: ${occupation.anzsco_code}${occupation.osca_code ? ` | OSCA: ${occupation.osca_code}` : ''}`,
        filename: `occupation-report-${occupation.anzsco_code}.pdf`,
        includeTimestamp: true,
        includePageNumbers: true
      });

      await pdf.init();
      pdf.addCoverLetter();

      // 1. Basic Details Section
      pdf.addSectionTitle('Occupation Details');
      pdf.addTable(
        [
          { header: 'Category', dataKey: 'category' },
          { header: 'Details', dataKey: 'details' }
        ],
        [
          { category: 'Occupation Name', details: occupation.occupation_name },
          { category: 'ANZSCO Code', details: occupation.anzsco_code },
          { category: 'OSCA Code', details: occupation.osca_code || 'N/A' },
          { category: 'Skill Level', details: apiData?.skill_level || 'N/A' },
          { category: 'Occupation List', details: apiData?.occupation_list || 'N/A' }
        ]
      );

      // 2. Visa Eligibility Section
      if (apiData?.occupation_list) {
        pdf.addSectionTitle('Visa Eligibility');
        const visaEligibility = [];
        if (apiData.occupation_list.includes('MLTSSL')) {
          visaEligibility.push(
            { category: 'Subclass 189', details: 'Eligible' },
            { category: 'Subclass 190', details: 'Eligible' },
            { category: 'Subclass 491', details: 'Eligible' }
          );
        } else if (apiData.occupation_list.includes('STSOL')) {
          visaEligibility.push(
            { category: 'Subclass 190', details: 'Eligible' },
            { category: 'Subclass 491', details: 'Eligible' }
          );
        }
        pdf.addTable(
          [
            { header: 'Visa Subclass', dataKey: 'category' },
            { header: 'Status', dataKey: 'details' }
          ],
          visaEligibility
        );
      }

      // 3. Skills Assessment Section
      if (apiData?.skill_level) {
        pdf.addSectionTitle('Skills Assessment');
        pdf.addTable(
          [
            { header: 'Category', dataKey: 'category' },
            { header: 'Details', dataKey: 'details' }
          ],
          [
            { category: 'Skill Level', details: apiData.skill_level },
            { category: 'Assessing Authority', details: 'See official website' },
            { category: 'Processing Time', details: 'Contact authority for current processing times' }
          ]
        );
      }

      // 4. EOI Section
      pdf.addSectionTitle('Expression of Interest (EOI)');
      pdf.addTextBlock(
        'EOI Information',
        'Please check the EOI tab in the application for current invitation rounds and point scores.'
      );

      // 5. State Nomination Section
      pdf.addSectionTitle('State/Territory Nomination');
      pdf.addTextBlock(
        'Nomination Options',
        'State and territory nomination availability varies. Please check the State Nomination tab for detailed requirements and current opportunities.'
      );

      // 6. Official Links & Resources
      pdf.addSectionTitle('Official Resources');
      if (apiData?.occupation_link || oscaData?.link) {
        const links = [];
        if (apiData?.occupation_link) {
          links.push({ category: 'ANZSCO Reference', details: apiData.occupation_link });
        }
        if (oscaData?.link) {
          links.push({ category: 'OSCA Reference', details: oscaData.link });
        }
        pdf.addTable(
          [
            { header: 'Resource', dataKey: 'category' },
            { header: 'Link', dataKey: 'details' }
          ],
          links
        );
      }

      // 7. Disclaimer
      pdf.addTextBlock(
        'Important Notice',
        'This report is for reference only. Requirements and eligibility criteria may change. Always verify current information with official sources and seek professional advice for your specific circumstances.'
      );

      pdf.save();
      setPdfGenerating(false);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setPdfGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-blue-100">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        {/* Left side: Title & badges */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {occupation.occupation_name}
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-4">

            {/* ANZSCO Code */}
            {occupation.anzsco_code && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <Building2 className="w-4 h-4 mr-1" />
                <span>ANZSCO: {occupation.anzsco_code}</span>
              </div>
            )}

            {/* OSCA Code */}
            {occupation.osca_code && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                <Globe className="w-4 h-4 mr-1" />
                <span>OSCA: {occupation.osca_code}</span>
              </div>
            )}

            {/* Skill Level from AA or fallback */}
            {apiData?.skill_level && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Skill Level {apiData.skill_level}
              </span>
            )}

            {/* Occupation List (STSOL, MLTSSL, ROL, etc.) */}
            {apiData?.occupation_list && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                {apiData.occupation_list}
              </span>
            )}
          </div>
        </div>

        {/* Right side: PDF & CSV Buttons */}
        <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-start">
          <button
            onClick={generatePDF}
            disabled={pdfGenerating}
            className="inline-flex items-center px-4 py-2 border border-blue-200 rounded-lg shadow-sm
                     text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pdfGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading & Error */}
      {loading && (
        <div className="mt-4 text-sm text-gray-500">
          Loading occupation data...
        </div>
      )}
      {error && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* If AA has a link (occupation_link) */}
      {apiData?.occupation_link && (
        <div className="mt-4 p-4 bg-blue-50/50 backdrop-blur-sm rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 text-gray-800">
            <LinkIcon className="w-5 h-5" />
            <h3 className="font-medium">Occupation Link (AA)</h3>
          </div>
          <a
            href={apiData.occupation_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors text-sm mt-2"
          >
            View Official Link
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* OSCA block if we found data */}
      {oscaData && (
        <div className="mt-4 p-4 bg-blue-50/50 backdrop-blur-sm rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 text-gray-800">
            <Globe className="w-5 h-5" />
            <h3 className="font-medium">OSCA Details</h3>
          </div>
          <div className="mt-2 space-y-2 text-sm">
            <p>
              <span className="font-medium">Name:</span> {oscaData.osca_name}
            </p>
            {oscaData.skill_level && (
              <p>
                <span className="font-medium">Skill Level:</span> {oscaData.skill_level}
              </p>
            )}
            {oscaData.link && (
              <a
                href={oscaData.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
              >
                OSCA Link
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OccupationHeader;