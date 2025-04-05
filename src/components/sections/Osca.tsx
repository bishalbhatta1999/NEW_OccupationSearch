import React, { useEffect, useState } from 'react';
import {
  ExternalLink,
  ClipboardList,
  List,
  FileText,
  GraduationCap,
  Globe,
  Users,
} from 'lucide-react';

/** The shape of each OSCA record in your Firebase. */
interface IOscaData {
  "Alternative Titles": string[];
  "Description": string;
  "Main Tasks": string[];
  "OSCA Code": string;
  "OSCA Link": string;
  "Occupation Name": string;
  "Skill Level": string;
}

interface OscaProps {
  /** The OSCA code (e.g. "111131") you want to fetch from the Firebase database. */
  code: string;
}

const Osca: React.FC<OscaProps> = ({ code }) => {
  const [data, setData] = useState<IOscaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate OSCA code to exactly 6 digits
  const cleanOscaCode = (rawCode: string): string => {
    const digits = rawCode.replace(/\D/g, '');
    return digits.slice(0, 6);
  };

  useEffect(() => {
    const fetchOscaData = async () => {
      try {
        if (!code) {
          throw new Error('No OSCA code provided');
        }

        const cleanCode = cleanOscaCode(code);
        if (cleanCode.length !== 6) {
          throw new Error('Invalid OSCA code format - must be 6 digits');
        }

        setLoading(true);
        setError(null);

        // Fetch all OSCA data
        const resp = await fetch('https://occupation-search.firebaseio.com/osca/.json');
        if (!resp.ok) {
          throw new Error(`Failed to fetch OSCA data (status: ${resp.status})`);
        }

        const allData = await resp.json();
        if (!allData || typeof allData !== 'object') {
          throw new Error('Invalid OSCA data format');
        }

        // Convert to array & find record matching OSCA Code
        const entries = Object.values(allData) as IOscaData[];
        const found = entries.find(item => item['OSCA Code'] === cleanCode);

        if (!found) {
          throw new Error(`No data found for OSCA code: ${cleanCode}`);
        }

        setData(found);
      } catch (err: any) {
        setError(err.message || 'Error fetching OSCA data');
      } finally {
        setLoading(false);
      }
    };

    fetchOscaData();
  }, [code]);

  // Loading state
  if (loading) {
    return (
      <div className="api-content">
        <p><b>Loading:</b> Fetching OSCA Data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="api-content">
        <p><b>Error:</b> {error}</p>
      </div>
    );
  }

  // No data found
  if (!data) {
    return null;
  }

  // Check if there are any alternative titles
  const hasAltTitles = data["Alternative Titles"]?.length > 0;

  return (
    <div className="api-content" style={{ background: 'white' }}>
      <div className="space-y-8">
        {/* Header Section: Name + top-right "View on ABS" button */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {data['Occupation Name']}
          </h2>
          {data['OSCA Link'] && (
            <a
              href={data['OSCA Link']}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white-600 text-white 
                         rounded-lg hover:bg-blue-500 transition-all duration-200 
                         shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Globe className="w-4 h-4" />
              View on ABS
            </a>
          )}
        </div>

        {/* 
          If no Alternative Titles => single wide card for OSCA details
          Else => 2-column layout: left card for OSCA details, right card for alt titles
        */}
        {!hasAltTitles ? (
          /* Single wide card */
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-200 
                         transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">OSCA Details</h3>
                <p className="text-sm text-gray-600">Code: {data['OSCA Code']}</p>
              </div>
            </div>

            {/* Skill Level */}
            {data["Skill Level"] && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <GraduationCap className="w-4 h-4" />
                <span className="font-medium">Skill Level {data["Skill Level"]}</span>
              </div>
            )}

            {/* Description */}
            {data["Description"] && (
              <p className="mt-4 text-gray-700">{data["Description"]}</p>
            )}
          </div>
        ) : (
          /* Two-column layout: left for OSCA details, right for alt titles */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: OSCA Details */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-200 
                            transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-100">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">OSCA Details</h3>
                  <p className="text-sm text-gray-600">Code: {data['OSCA Code']}</p>
                </div>
              </div>

              {/* Skill Level */}
              {data["Skill Level"] && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg">
                  <GraduationCap className="w-4 h-4" />
                  <span className="font-medium">Skill Level {data["Skill Level"]}</span>
                </div>
              )}

              {/* Description */}
              {data["Description"] && (
                <p className="mt-4 text-gray-700">{data["Description"]}</p>
              )}
            </div>

            {/* Right: Alternative Titles */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-200 
                            transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Alternative Titles</h3>
              </div>
              <ul className="space-y-2">
                {data["Alternative Titles"].map((title, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Main Tasks Card */}
        {data["Main Tasks"]?.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-green-200 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-green-100">
                <List className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Main Tasks</h3>
            </div>
            <ul className="space-y-2">
              {data["Main Tasks"].map((task, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                  <p>{task}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Official Sources Card */}
        <div className="bg-white rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-100">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Official Sources</h4>
              <p className="text-sm text-gray-600">Australian Bureau of Statistics</p>
            </div>
          </div>
          {data["OSCA Link"] && (
            <a
              href={data["OSCA Link"]}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg 
                         border border-blue-200 hover:bg-blue-100 transition-all duration-300"
            >
              <ExternalLink className="w-4 h-4" />
              View detailed information on the ABS website
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default Osca;