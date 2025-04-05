import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

interface Occupation {
  id: string;               // Adjusted to string, since Firebase IDs may be strings
  occupation_name: string;
  anzsco_code: string;
  skill_level?: string;
  specialisations?: string;
  alternative_title?: string;
}

const OccupationSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [selectedOccupation, setSelectedOccupation] = useState<Occupation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimeout = useRef<number | null>(null);

  /**
   * Fetch from Firebase.
   * Expecting data in this shape (an array of objects), e.g.:
   * [
   *   {
   *     "id": "111111",
   *     "OccupationName ": "Chief Executive or Managing Director",
   *     "Anzscocode": "111111"
   *   },
   *   ...
   * ]
   */
  const fetchOccupations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://occupation-search.firebaseio.com/anzsco/.json",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch (Status: ${response.status})`);
      }

      const data = await response.json();
      console.log("🚀 Firebase API Response:", data);

      if (!Array.isArray(data)) {
        throw new Error("❌ Invalid response format: Expected an array.");
      }

      // Map each item to our Occupation interface
      const mappedOccupations: Occupation[] = data.map((item: any) => ({
        id: String(item.id || ""),
        occupation_name: String(item["OccupationName "] || "").trim(),
        anzsco_code: String(item["Anzscocode"] || "").trim(),
        // skill_level, specialisations, etc. might not exist in Firebase,
        // so we leave them undefined.
      }));

      setOccupations(mappedOccupations);
    } catch (err) {
      console.error("❌ API Fetch Error:", err);
      setError(`Error: ${(err as Error).message}`);
      setOccupations([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Debounced input changes.
   */
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimeout.current) {
      window.clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = window.setTimeout(() => {
      fetchOccupations();
    }, 300);
  };

  /**
   * Cleanup any pending timeout on unmount.
   */
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        window.clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  /**
   * When user selects from the dropdown, store the occupation and clear the list.
   */
  const handleSelect = (occupation: Occupation) => {
    setQuery(occupation.occupation_name);
    setSelectedOccupation(occupation);
    setOccupations([]);
  };

  return (
    <div className="relative">
      {/* Search Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search for an occupation..."
          className="block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
        />
      </div>

      {/* Error */}
      {error && <p className="text-red-600 mt-2">{error}</p>}

      {/* Loading */}
      {loading && (
        <div className="mt-2 p-4 bg-gray-100 text-gray-600 rounded-lg shadow">
          Loading occupations...
        </div>
      )}

      {/* Results Dropdown */}
      {occupations.length > 0 && !loading && (
        <div className="absolute mt-2 w-full bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
          {occupations.map((occupation) => (
            <div
              key={occupation.id}
              onClick={() => handleSelect(occupation)}
              className="p-3 hover:bg-indigo-100 cursor-pointer"
            >
              <strong>{occupation.occupation_name}</strong>
              <p className="text-sm text-gray-500">
                ANZSCO Code: {occupation.anzsco_code}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Selected Occupation Details */}
      {selectedOccupation && (
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6 border">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {selectedOccupation.occupation_name}
          </h2>
          <div className="grid gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                ANZSCO Code
              </h3>
              <p className="mt-1 text-gray-900">
                {selectedOccupation.anzsco_code}
              </p>
            </div>
            {selectedOccupation.skill_level && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Skill Level
                </h3>
                <p className="mt-1 text-gray-900">
                  {selectedOccupation.skill_level}
                </p>
              </div>
            )}
            {selectedOccupation.specialisations && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Specialisations
                </h3>
                <p className="mt-1 text-gray-900">
                  {selectedOccupation.specialisations}
                </p>
              </div>
            )}
            {selectedOccupation.alternative_title && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Alternative Titles
                </h3>
                <p className="mt-1 text-gray-900">
                  {selectedOccupation.alternative_title}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OccupationSearch;