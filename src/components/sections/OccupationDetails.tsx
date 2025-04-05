import React, { useState, useEffect } from 'react';
import {
  Building2,
  Briefcase,
  GraduationCap, 
  BookOpen,
  Layers,
  Award,
  Users,
  Star
} from 'lucide-react';
import ApiDataFetcher from '../ApiDataFetcher';
import Osca from './Osca';  // <-- Adjust path if needed

/** Optional OSCA data from the parent (same shape as OccupationHeader’s). */
interface IOscaData {
  osca_name?: string;
  link?: string;
  skill_level?: string;
}

interface OccupationDetailsProps {
  details: {
    unitGroup: string;
    description: string;
    skillLevel: string;
    tasksAndDuties: string;
    assessingAuthority: string;
    anzscoCode?: string;
    oscaCode?: string;
  };
  occupation: {
    anzsco_code: string;
    osca_code: string;
    occupation_name: string;
  };
  /**
   * We receive the OSCA data but do NOT display it
   * in the UI. This is purely for your internal logic or usage.
   */
  oscaData?: IOscaData | null;
}

const OccupationDetails: React.FC<OccupationDetailsProps> = ({
  details,
  occupation,
  oscaData, // not displayed, only received
}) => {
  // Track codes for ANZSCO (4 digits) and OSCA (6 digits)
  const [anzscoCode, setAnzscoCode] = useState<string | null>(null);
  const [oscaCode, setOscaCode] = useState<string | null>(null);

  // Which API (ANZSCO or OSCA) is active in the UI toggles?
  const [activeApi, setActiveApi] = useState<'anzsco' | 'osca'>('anzsco');

  useEffect(() => {
    // For ANZSCO: keep up to 4 digits
    const anzsco = occupation?.anzsco_code?.replace(/\D/g, '').slice(0, 4) || null;
    setAnzscoCode(anzsco);

    // For OSCA: keep up to 6 digits
    const osca = occupation?.osca_code?.replace(/\D/g, '').slice(0, 6) || null;
    setOscaCode(osca);

    // Default to OSCA view if an OSCA code is present
    if (osca) {
      setActiveApi('osca');
    }
  }, [occupation]);

  // If details.skillLevel is empty, undefined, or "Not available", we show "N/A"
  const rawSkillLevel = details.skillLevel?.trim() || '';
  const displayedSkillLevel = rawSkillLevel && rawSkillLevel !== 'Not available'
    ? rawSkillLevel
    : 'N/A';

  return (
    <section id="details" className="space-y-6 animate-fadeIn">
      {/* Header Card: "Occupation Details" */}
      <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl shadow-lg p-8 border border-blue-100 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full opacity-5 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-200 rounded-full opacity-5 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Occupation Details</h2>
            <p className="text-sm text-gray-600">Comprehensive information about this occupation</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-8">
          {/* Unit Group */}
          <div className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-200 
                       shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Unit Group</h3>
            </div>
            <p className="text-gray-700">
              {details.unitGroup || 'N/A'}
            </p>
          </div>

          {/* Skill Level */}
          <div className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-200 
                       shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                <GraduationCap className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Skill Level</h3>
            </div>
            {/* Show skill level as a pill or fallback */}
            <div>
              <span
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: displayedSkillLevel === 'N/A' ? '#f2f2f2' : '#d1fae5',
                  color: displayedSkillLevel === 'N/A' ? '#999' : '#047857',
                }}
              >
                <Star className="w-4 h-4 mr-2" />
                {displayedSkillLevel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* API Data Card: ANZSCO vs. OSCA */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
        {/* Buttons to toggle */}
        <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 border-b border-blue-100">
          <div className="flex gap-4">
          <button
            onClick={() => setActiveApi('anzsco')}
            className={`px-4 py-2 text-sm rounded-md font-medium border transition-colors
              ${
                activeApi === 'anzsco'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-lg transform -translate-y-0.5'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-blue-200'
              }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
            ANZSCO
            </div>
          </button>

          <button
            onClick={() => setActiveApi('osca')}
            className={`px-4 py-2 text-sm rounded-md font-medium border transition-colors
              ${
                activeApi === 'osca'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-lg transform -translate-y-0.5'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-blue-200'
              }`}
            disabled={!oscaCode}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
            OSCA
            {!oscaCode && <span className="ml-2 text-xs">(No code available)</span>}
            </div>
          </button>
          </div>
        </div>

        {/* Conditionally show data */}
        <div className="p-6">
          {activeApi === 'anzsco' && anzscoCode && <ApiDataFetcher id={anzscoCode} />}
          {activeApi === 'osca' && oscaCode && <Osca code={oscaCode} />}

          {/* Fallback if no codes found */}
          {activeApi === 'anzsco' && !anzscoCode && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <Award className="w-5 h-5 text-amber-600" />
              <p className="text-amber-700">No ANZSCO code found for this occupation.</p>
            </div>
          )}
          {activeApi === 'osca' && !oscaCode && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <Users className="w-5 h-5 text-amber-600" />
              <p className="text-amber-700">No OSCA code found for this occupation.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default OccupationDetails;