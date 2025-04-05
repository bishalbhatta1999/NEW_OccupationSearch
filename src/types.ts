declare global {
  interface Window {
    selectedOccupation?: Occupation;
  }
}

export interface Occupation {
  occupation_id: string;
  occupation_name: string;
  anzsco_code: string;
  osca_code: string;
  osca_code: string;
  skill_level: string;
  specialisations: string;
  alternative_title: string;
}

export interface SectionContent {
  details: {
    unitGroup: string;
    description: string;
    skillLevel: string;
    tasksAndDuties: string;
    assessingAuthority: string;
  };
  assessment: any;
  nomination: string;
  eoi: string;
  visa: string;
}