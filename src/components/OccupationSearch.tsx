import React, { useState, useEffect, useRef } from 'react';
import { Search, GraduationCap, Building2, BookOpen, X, AlertCircle } from 'lucide-react';
import { type Occupation } from '../types';
import { fetchPythonApiData } from '../services/anzscoService';

interface OccupationSearchProps {
  // Props for controlling search functionality externally:
  query: string;
  loading: boolean;
  error: string | null;
  occupations: Occupation[];
  selectedOccupation?: Occupation | null;

  // Event callbacks:
  onClear: () => void;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect: (occupation: Occupation) => void;
}

/**
 * The shape of data we store after calling fetchPythonApiData
 */
interface PythonApiData {
  description: string;
  skillLevel: string;
  tasks: string[];
  title: string;
}

const OccupationSearch: React.FC<OccupationSearchProps> = ({
  query,
  loading,
  error,
  onClear,
  occupations,
  onSearch,
  onSelect,
  selectedOccupation: propSelectedOccupation,
}) => {
  // Cache for additional data from the remote API
  const [apiDataMap, setApiDataMap] = useState<{ [key: string]: PythonApiData }>({});
  // Track loading states for specific ANZSCO codes
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
  // Refs for scrolling and focusing
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Track whether input is focused for styling
  const [isFocused, setIsFocused] = useState(false);

  /**
   * Generate a unique key for each occupation
   */
  const getUniqueKey = (occupation: Occupation, index: number): string => {
    // Combine multiple identifiers to ensure uniqueness
    const identifiers = [
      occupation.occupation_id,
      occupation.anzsco_code,
      occupation.osca_code,
      index
    ].filter(Boolean);
    
    if (identifiers.length > 0) {
      return `occ-${identifiers.join('-')}`;
    }
    
    // Fallback to a truly unique key using index and timestamp
    return `occ-${index}-${Date.now()}`;
  };

  /**
   * Fetch additional occupation data on hover
   */
  const fetchApiData = async (anzscoCode: string) => {
    const key = `code_${anzscoCode}`;

    // Skip if we already have data or are loading
    if (apiDataMap[key] || loadingStates[key]) {
      return;
    }

    try {
      setLoadingStates((prev) => ({ ...prev, [key]: true }));

      const data = await fetchPythonApiData(anzscoCode);
      if (data) {
        // Create a new serializable object for the cache
        const cleanedData = {
          description: typeof data.description === 'string' ? data.description : '',
          skillLevel: typeof data.skill_level === 'string' ? data.skill_level : '',
          tasks: Array.isArray(data.tasks) ? [...data.tasks] : [],
          title: typeof data.title === 'string' ? data.title : ''
        };

        setApiDataMap((prev) => ({
          ...prev,
          [key]: cleanedData
        }));
      }
    } catch (err) {
      // Suppress console error to avoid noise
      // console.error('Error fetching API data:', err);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [key]: false }));
    }
  };

  /**
   * Select an occupation from the list
   */
  const handleSelect = (occupation: Occupation) => {
    onSelect(occupation);
  };

  /**
   * Clear the search & maintain focus
   */
  const handleClearSelection = () => {
    onClear();
    // Keep focus in the input so the user can type again immediately
    searchInputRef.current?.focus();
  };

  /**
   * Auto-scroll to results once occupations become available
   */
  useEffect(() => {
    if (occupations.length > 0 && resultsContainerRef.current && searchInputRef.current) {
      const inputRect = searchInputRef.current.getBoundingClientRect();
      const scrollTo = window.scrollY + inputRect.bottom + 10;
      window.scrollTo({
        top: scrollTo,
        behavior: 'smooth',
      });
    }
  }, [occupations]);

  return (
    <div>
      {/* Search bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Clear button – only visible when there's text */}
        {query && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                handleClearSelection();
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200
                         focus:outline-none focus:ring-2 focus:ring-primary/50
                         active:scale-95"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
            </button>
          </div>
        )}

        <input
          type="text"
          ref={searchInputRef}
          value={query}
          onChange={onSearch}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search occupation (e.g., Software Engineer, Teacher)..."
          className={`block w-full pl-10 ${query ? 'pr-12' : 'pr-4'} py-4 sm:py-6 
                     border-2 border-input rounded-2xl
                     text-foreground placeholder-muted-foreground 
                     bg-white/80 backdrop-blur-sm
                     focus:ring-2 focus:ring-primary focus:border-primary
                     shadow-lg shadow-blue-500/5
                     transition-all duration-200 ease-in-out text-base sm:text-lg
                     hover:shadow-blue-500/10
                     ${isFocused ? 'ring-2 ring-primary border-primary' : ''}`}
        />
      </div>

      {/* Currently selected occupation */}
      {propSelectedOccupation && (
        <div className="mt-4 bg-blue-50/50 backdrop-blur-sm p-4 rounded-xl border border-blue-200
                      flex items-center justify-between animate-fadeIn">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Selected Occupation
              </h2>
            </div>
            <p className="mt-1 text-sm text-gray-600 ml-7">
              {propSelectedOccupation.occupation_name}{' '}
              <span className="text-gray-500">
                (ANZSCO: {propSelectedOccupation.anzsco_code})
              </span>
            </p>
          </div>
          <button
            onClick={handleClearSelection}
            className="p-2 rounded-lg hover:bg-blue-100/50 text-blue-600
                     transition-colors group focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Clear selection"
          >
            <X className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* Error message from the parent if something went wrong with the main search */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-xl 
                      flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Occupations list */}
      {occupations.length > 0 && !loading && (
        <div className="mt-4 bg-white/80 backdrop-blur-sm border border-gray-200 
                      rounded-2xl overflow-hidden shadow-lg animate-fadeIn">
          <div ref={resultsContainerRef} className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {occupations.map((occupation, index) => {
              const uniqueKey = getUniqueKey(occupation, index);

              // 2) Build a key for Python API lookups
              const pythonLookupKey = `code_${occupation.anzsco_code}`;
              const apiData = apiDataMap[pythonLookupKey];
              const isLoading = loadingStates[pythonLookupKey];

              return (
                <div
                  key={uniqueKey}
                  onClick={() => handleSelect(occupation)}
                  onMouseEnter={() => fetchApiData(occupation.anzsco_code)}
                  className="p-6 hover:bg-blue-50/50 cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4 flex-grow">
                      <h3 className="text-lg font-medium text-foreground">
                        {occupation.occupation_name}
                      </h3>
                      <div className="mt-1 flex items-center text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4 mr-1" />
                        <div className="flex items-center gap-3">
                          <span>ANZSCO: {occupation.anzsco_code}</span>
                          {occupation.osca_code && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-indigo-600 font-medium">OSCA: {occupation.osca_code}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Additional data from "Python" (Firebase) API */}
                      {isLoading ? (
                        <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                          Loading additional data...
                        </div>
                      ) : apiData ? (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-foreground/80">
                            <BookOpen className="h-4 w-4" />
                            <span>{apiData.description}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <strong>Skill Level:</strong> {apiData.skillLevel}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OccupationSearch;