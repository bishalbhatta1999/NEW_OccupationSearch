import React, { useEffect } from 'react';

export interface ApiError {
  message: string;
  status?: number;
}

/** One doc -> one AuthorityItem in your final array. */
export interface AuthorityItem {
  shortCode: string;         
  fullName: string;          
  fees: string[];              
  feesLink: string;
  processingTime: string;
  modeOfApplication: string;
  link: string;              
  guidelineLink: string;
  checklistLink: string;
  requirements?: string[];
}

/** You can also store global requirements if you wish. */
export interface SkillApiResponse {
  authorities: AuthorityItem[];
  requirements: string[];
}

interface SkillApiFetcherProps {
  occupationCode: string;   
  onDataFetched: (data: SkillApiResponse) => void;
  onError: (error: ApiError) => void;
}

/** Map short codes to a more user‐friendly name. */
const AUTHORITY_NAME_MAP: Record<string, string> = {
  CAANZ:     "Chartered Accountants Australia and New Zealand",
  CPAA:      "CPA Australia Ltd",
  IPA:       "Institute of Public Accountants Ltd",
  VETASSESS: "Vocational Education and Training Assessment Services"
};

const SkillApiFetcher: React.FC<SkillApiFetcherProps> = ({
  occupationCode,
  onDataFetched,
  onError
}) => {

  useEffect(() => {
    const fetchData = async () => {
      if (!occupationCode) return;

      const cleanCode = occupationCode.replace(/\D/g, '');
      if (cleanCode.length < 4) {
        onError({ message: 'Invalid ANZSCO code format (need >= 4 digits)', status: 400 });
        return;
      }

      let retryCount = 0;
      const maxRetries = 3;

      try {
        while (retryCount < maxRetries) {
          try {
            console.log(`[SkillApiFetcher] Attempt #${retryCount + 1} for code ${cleanCode}`);

            // Replace with your real DB or Firestore or API endpoint
            const response = await fetch('https://skills012.firebaseio.com/.json');
            if (!response.ok) {
              throw new Error(`Failed to fetch data (Status: ${response.status})`);
            }

            const data = await response.json();
            if (!data || !Array.isArray(data)) {
              throw new Error('No data found or data is not an array');
            }

            // Filter docs that match this code
            const matchedDocs = data.filter((doc: any) => doc.anzscoCode === cleanCode);
            if (matchedDocs.length === 0) {
              throw new Error(`No data found for ANZSCO ${cleanCode}`);
            }
            console.log("[SkillApiFetcher] Found these docs:", matchedDocs);

            // Convert each doc into one AuthorityItem
            const authorities: AuthorityItem[] = matchedDocs.map((doc: any) => {
              const short = doc["Assessing Authority"] || doc["AssessingAuthority"] || "Unknown";
              const fullName = AUTHORITY_NAME_MAP[short] || short;

              // The doc’s contact details
              const c = doc["Contact Details"] || doc.ContactDetails || {};

              // e.g. "AUD 545 Onshore, AUD 495 Offshore"
              let feesStr = c["Applicable Fees"] || "";
              // Make it an array of bullet points
              let feesArray: string[] = [];
              if (feesStr.trim()) {
                feesArray = feesStr.split(',').map((f: string) => f.trim());
              }
              // Fallback
              if (!feesArray.length) {
                feesArray = ["Contact authority for current fees"];
              }

              // Extract "Click Here (https://...)" => actual link
              const feesLink       = extractUrl(c["Fees Link"])      || "#";
              const guidelineLink  = extractUrl(c["Guideline"])      || "#";
              const checklistLink  = extractUrl(c["Check List"])     || "#";
              const modeOfApp      = c["Mode Of Application"]        || "";
              const processingTime = c["Processing Time"]            || "";

              // Use guidelineLink as the official site link if available
              const officialLink = guidelineLink !== "#" ? guidelineLink : "#";

              // Possibly parse doc["Requirements"] if it’s an array
              let reqs: string[] = [];
              if (doc["Requirements"]) {
                if (Array.isArray(doc["Requirements"])) {
                  reqs = doc["Requirements"];
                } else if (typeof doc["Requirements"] === "string") {
                  reqs = [doc["Requirements"]];
                }
              }

              return {
                shortCode: short,
                fullName,
                fees: feesArray,
                feesLink,
                processingTime,
                modeOfApplication: modeOfApp,
                link: officialLink,
                guidelineLink,
                checklistLink,
                requirements: reqs
              };
            });

            const finalData: SkillApiResponse = {
              authorities,
              requirements: [
                // any global requirements
                'Valid Skills Assessment',
                'English Language Proficiency'
              ]
            };

            onDataFetched(finalData);
            return;
          } catch (err) {
            retryCount++;
            if (retryCount === maxRetries) {
              throw err;
            }
            await new Promise((res) => setTimeout(res, retryCount * 1000));
          }
        }
      } catch (err: any) {
        onError({
          message: err.message || 'Failed to fetch occupation data',
          status: 500
        });
      }
    };

    fetchData();
  }, [occupationCode, onDataFetched, onError]);

  // Helper to parse text like "Click Here (https://some.link)"
  function extractUrl(text: string): string {
    if (!text || !text.trim()) return '#';
    const match = text.match(/\((.*?)\)/);
    return match ? match[1] : '#';
  }

  return null;
};

export default SkillApiFetcher;