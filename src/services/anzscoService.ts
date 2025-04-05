import axios from 'axios';

/** Firebase endpoints */
const FIREBASE_OCCUPATION_API =
  'https://occupation-search.firebaseio.com/anzsco/.json';

const FIREBASE_DETAILS_API =
  'https://occupation-search.firebaseio.com/anzsco.json';

/** 
 * Interfaces 
 */
export interface AnzscoOccupation {
  occupationName: string;
  anzscoCode: string;
  directLink: string;
}

export interface AnzscoDetails {
  title: string;
  unitGroup: string;
  skillLevel: string;
  tasks: string[];
  source: string;
  link: string;
}

/**
 * The shape we return from `searchOccupations`.
 * We keep the `recordset` array structure so that any existing code 
 * using `AnzscoApiResponse` continues to work.
 */
export interface AnzscoApiResponse {
  recordset: Array<{
    id: string;
    name: string;
    skill_level: string;
    alternative_title: string;
    specialisations: string;
  }>;
}

/** 
 * The Python API response shape 
 */
export interface PythonApiResponse {
  title: string;
  description: string;
  skill_level: string;
  tasks: string[];
  source: string;
}

/**
 * Shared search function used by both main search and dashboard
 */
export async function searchOccupations(
  query: string,
  setOccupations: (occs: Occupation[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
) {
  if (query.length < 2) {
    setOccupations([]);
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const response = await fetch("https://occupation-search.firebaseio.com/anzsco/.json", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch occupations (Status: ${response.status})`);
    }

    const data = await response.json();

    // Ensure we have data and convert to array if needed
    if (!data) {
      throw new Error('No data returned from API');
    }

    // Convert object to array if needed
    const occupationsArray = Array.isArray(data) ? data : Object.values(data);
    
    if (!occupationsArray || !occupationsArray.length) {
      throw new Error('No occupations found');
    }
    
    const searchLower = query.toLowerCase();
    const filteredList = occupationsArray.filter((occ: any) => 
      (occ?.["Occupation Name"]?.toLowerCase()?.includes(searchLower) ||
       occ?.["Anzsco Code"]?.toString()?.includes(searchLower) ||
       occ?.["OSCA Code"]?.toString()?.includes(searchLower))
    );
    
    const mappedOccupations = filteredList.map(occ => ({
      occupation_id: occ?.["Anzsco Code"]?.toString() || occ?.id?.toString() || '',
      occupation_name: occ?.["Occupation Name"] || occ?.name || '',
      anzsco_code: occ?.["Anzsco Code"]?.toString() || occ?.anzscocode?.toString() || '',
      osca_code: occ?.["OSCA Code"]?.toString() || occ?.osca_code?.toString() || '',
      skill_level: occ?.["Skill Level"]?.toString() || occ?.skill_level?.toString() || '',
      specialisations: occ?.["Specialisations"]?.toString() || occ?.specialisations?.toString() || '',
      alternative_title: occ?.["Alternative Title"]?.toString() || occ?.alternative_title?.toString() || ''
    }));

    setOccupations(mappedOccupations);
  } catch (err) {
    setError(`Error: ${(err as Error).message}`);
    setOccupations([]);
  } finally {
    setLoading(false);
  }
}

/**
 * Removes non-digits from the code and slices to the first 4 digits.
 * Throws if no digits are found.
 */
export function getFourDigitAnzscoCode(anzscoCode: string): string {
  const cleaned = String(anzscoCode).replace(/\D/g, '');
  if (!cleaned) {
    throw new Error('Invalid ANZSCO code: no digits found.');
  }
  return cleaned.slice(0, 4);
}

/**
 * Stub if you need to fetch broader ANZSCO data (not used here).
 */
export async function fetchAnzscoData(): Promise<{
  occupations: AnzscoOccupation[];
  details: Record<string, AnzscoDetails>;
}> {
  return {
    occupations: [],
    details: {},
  };
}

/**
 * Fetch data directly from your Firebase "anzsco_details/{code}.json".
 * We *used* to call PythonAnywhere, but now we point to Firebase. 
 */
export async function fetchPythonApiData(
  anzscoCode: string
): Promise<PythonApiResponse | null> {
  // Clean the code to 4 digits
  const fourDigitCode = getFourDigitAnzscoCode(anzscoCode);

  try {
    const response = await axios.get(FIREBASE_DETAILS_API, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (!response.data) {
      throw new Error('No data returned from Firebase');
    }

    // Convert to array if needed
    const items = Array.isArray(response.data) 
      ? response.data 
      : Object.values(response.data);

    // Find matching occupation
    const match = items.find((item: any) => {
      return item?.OCode?.toString() === fourDigitCode;
    });

    if (!match) {
      return null;
    }

    // Map to expected format
    const cleanData: PythonApiResponse = {
      title: match.OName || '',
      description: match.Description || '',
      skill_level: match.SLevel?.toString() || '',
      tasks: Array.isArray(match.Tasks) ? match.Tasks : [],
      source: 'Australian Bureau of Statistics',
    };

    return cleanData;
  } catch (error: any) {
    console.error('fetchPythonApiData Error:', error);
    return null;
  }
}

/**
 * Optional fallback if the API fails or you want a default placeholder.
 */
export const fallbackData: PythonApiResponse = {
  title: 'Software Engineer',
  description: 'Designs, develops and maintains software applications and systems.',
  skill_level: 'Skill Level 1',
  tasks: [
    'Analyzing user requirements and designing software solutions',
    'Writing and testing code for applications',
    'Maintaining and modifying existing software systems',
    'Documenting software specifications and technical details',
    'Collaborating with other developers and stakeholders',
  ],
  source: 'Australian Bureau of Statistics',
};