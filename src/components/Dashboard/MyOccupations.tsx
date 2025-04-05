import React, { useState, useEffect, useRef } from 'react';
import { Briefcase } from 'lucide-react';
import { fetchAnzscoData, searchOccupations as searchOccupationsService } from '../../services/anzscoService';
import OccupationSearch from '../OccupationSearch';
import OccupationHeader from '../OccupationHeader';
import { ApiResponse, OscaResponse, OccupationApiPayload } from '../OccupationHeader'; // <--- Import the types
import NavigationTabs from '../NavigationTabs';
import VisaEligibility from '../sections/VisaEligibility';
import OccupationDetails from '../sections/OccupationDetails';
import SkillAssessment from '../sections/SkillAssessment';
import StateNomination from '../sections/StateNomination';
import EOIDashboard from '../EOIDashboard';

interface Occupation {
  occupation_id: number;
  occupation_name: string;
  anzsco_code: string;
  osca_code?: string; 
  [key: string]: any;
}

interface SectionContent {
  details?: {
    unitGroup: string;
    description: string;
    skillLevel: string;
    tasksAndDuties: string;
    assessingAuthority: string;
    anzscoCode?: string;
  };
  assessment?: any;
  nomination?: any;
  eoi?: any;
  visa?: any;
}

const MyOccupations: React.FC = () => {
  const [query, setQuery] = useState('');
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [selectedOccupation, setSelectedOccupation] = useState<Occupation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('visa');
  const [loadingSections, setLoadingSections] = useState<Record<string, boolean>>({});
  const [eoiData, setEoiData] = useState<any>(null);
  const debounceTimeout = useRef<number | null>(null);

  const [sectionContent, setSectionContent] = useState<SectionContent>({
    details: {
      unitGroup: '',
      description: '',
      skillLevel: '',
      tasksAndDuties: '',
      assessingAuthority: '',
    },
    assessment: '',
    nomination: '',
    eoi: '',
    visa: '',
  });

  // --- NEW: store the global occupation_list from AA and OSCA data so we can pass them to other components. ---
  const [occupationList, setOccupationList] = useState<string | undefined>(undefined);
  const [oscaData, setOscaData] = useState<OscaResponse | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimeout.current) {
      window.clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = window.setTimeout(() => {
      searchOccupationsService(value, setOccupations, setLoading, setError);
    }, 300);
  };

  // Clear the search field, results, and selected occupation
  const handleClear = () => {
    setQuery('');
    setOccupations([]);
    setSelectedOccupation(null);
    setError(null);
  };

  // When user selects an occupation from the list
  const handleSelectOccupation = (occupation: Occupation) => {
    setSelectedOccupation(occupation);
    (window as any).selectedOccupation = occupation;
    setQuery(occupation.occupation_name);
    setOccupations([]);
    setSectionContent({});
    setActiveSection('visa');

    // Reset these each time we pick a new occupation
    setOccupationList(undefined);
    setOscaData(null);

    loadSectionContent('visa', occupation);
  };

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        window.clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Callback from OccupationHeader whenever data is loaded
  const handleApiDataLoaded = (payload: OccupationApiPayload) => {
    // e.g. { aaData: {...}, oscaData: {...} }
    setOccupationList(payload.aaData.occupation_list);
    setOscaData(payload.oscaData);
  };

  // Loading ANZSCO sections (similar to your existing logic)
  const loadSectionContent = async (section: string, occ?: Occupation) => {
    // If no occupation is selected or content is already loaded
    if (!selectedOccupation && !occ) return;
    const currentOcc = occ || selectedOccupation;
    if (!currentOcc) return;

    if (section !== 'eoi' && sectionContent[section as keyof SectionContent]) {
      setActiveSection(section);
      return;
    }

    setLoadingSections((prev) => ({ ...prev, [section]: true }));
    setActiveSection(section);
    window.selectedOccupation = currentOcc;

    try {
      const anzscoCode = currentOcc.anzsco_code?.toString().slice(0, 4);
      if (!anzscoCode) {
        throw new Error('Invalid ANZSCO code');
      }

      const data = await fetchAnzscoData();
      const absData = data?.details?.[anzscoCode];

      if (section === 'details') {
        setSectionContent((prev) => ({
          ...prev,
          details: {
            unitGroup: `${anzscoCode}${
              absData?.unitGroup ? ` - ${absData.unitGroup}` : ''
            }`,
            description: absData?.title || 'No description available',
            skillLevel: absData?.skillLevel || 'Not available',
            tasksAndDuties: Array.isArray(absData?.tasks)
              ? absData.tasks.join('\n')
              : 'No tasks available',
            assessingAuthority: 'See official website',
            anzscoCode: anzscoCode,
          },
        }));
      } else {
        const staticContent = {
          assessment: absData?.link
            ? {
                authority: {
                  name: 'See official website',
                  url: absData.link,
                },
                processingTime: 'Contact authority',
                applicationMode: 'Online Application',
                fee: 'Contact authority',
              }
            : 'Assessment information not available',
          nomination: 'Contact state authorities for nomination details',
          visa: 'Contact Department of Home Affairs',
        };

        setSectionContent((prev) => ({
          ...prev,
          [section]:
            section === 'eoi'
              ? null
              : staticContent[section as keyof typeof staticContent] ||
                'Information not available',
        }));
      }
    } catch (err) {
      console.error(`Error loading ${section} content:`, err);
      setSectionContent((prev) => ({
        ...prev,
        [section]: 'Failed to load information. Please try again later.',
      }));
    } finally {
      setLoadingSections((prev) => ({ ...prev, [section]: false }));
    }
  };

  // Called when user clicks on a navigation tab
  const handleSectionClick = (section: string) => {
    setActiveSection(section);
    loadSectionContent(section);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-100">
          <Briefcase className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Occupations</h2>
          <p className="text-sm text-gray-600">Search and manage your occupation details</p>
        </div>
      </div>

      {/* Search Section */}
      <OccupationSearch
        query={query}
        loading={loading}
        error={error}
        occupations={occupations}
        onClear={handleClear}
        onSearch={handleSearch}
        onSelect={handleSelectOccupation}
      />

      {/* Selected Occupation Details */}
      {selectedOccupation && (
        <div className="mt-8 space-y-6 animate-fadeIn">
          {/* 
              Pass the callback so OccupationHeader can inform us 
              about AA data (occupation_list) and OSCA data 
           */}
          <OccupationHeader
            occupation={selectedOccupation}
            onApiDataLoaded={handleApiDataLoaded}
          />

          <NavigationTabs
            activeSection={activeSection}
            loadingSections={loadingSections}
            onSectionClick={handleSectionClick}
          />

          <div className="space-y-6 animate-slideDown">
            {activeSection === 'visa' && (
              <VisaEligibility
                content={sectionContent.visa}
                occupationCode={selectedOccupation.anzsco_code}
              />
            )}

            {activeSection === 'details' && sectionContent.details && (
              <OccupationDetails
                details={sectionContent.details}
                occupation={selectedOccupation}

                // NEW: pass the OSCA data from OccupationHeader
                // so OccupationDetails can also use it if desired.
                oscaData={oscaData}
              />
            )}

            {activeSection === 'assessment' && sectionContent.assessment && (
              <SkillAssessment
                content={sectionContent.assessment}
                occupationCode={selectedOccupation.anzsco_code}
                occupation={selectedOccupation}
              />
            )}

            {activeSection === 'nomination' && sectionContent.nomination && (
              <StateNomination
                content={sectionContent.nomination}
                occupationCode={selectedOccupation.anzsco_code}
                occupation={selectedOccupation}

                // pass the occupation list from the parent
                occupationList={occupationList}
              />
            )}

            {activeSection === 'eoi' && <EOIDashboard />}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOccupations;