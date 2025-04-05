// Firebase Database Types
export interface FirebaseDatabase {
  anzsco_cache: {
    occupations: {
      occupationName: string;
      anzscoCode: string;
      directLink: string;
    }[];
    details: Record<string, {
      title: string;
      unitGroup: string;
      skillLevel: string;
      tasks: string[];
      source: string;
      link: string;
    }>;
  };
  ai_queries: {
    id: string;
    query: string;
    occupation_name: string;
    section: string;
    response: string;
    created_at: string;
    accessed_at: string;
    source: string;
  }[];
}