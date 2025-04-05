export type ApplicationType = 'Single' | 'Couple' | 'Family';
export type LocationType = 'Outside Australia' | 'In Australia';
export type TravelRegion = 'East/Southern Africa' | 'West Africa' | 'Outside Australia' | 'Within Australia';

export interface Child {
  dateOfBirth: Date;
  requiresSchooling: boolean;
}

export interface CalculatorFormData {
  applicationType: ApplicationType;
  locationType: LocationType;
  travelRegion: TravelRegion;
  children: Child[];
  totalAnnualFees: number;
  prepaidFees: number;
  visaExpiryDate?: Date;
  courseEndDate?: Date;
}

export interface ContactDetails {
  fullName: string;
  phone: string;
  email: string;
  streetAddress: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface VisaDuration {
  baseDuration: number;
  additionalMonths: number;
  totalDuration: number;
}

export interface TravelCostBreakdown {
  student: number;
  partner: number;
  children: number;
  total: number;
  isAfricanReturn: boolean;
}

export interface CostBreakdown {
  travelCosts: number;
  travelCostBreakdown: TravelCostBreakdown;
  courseFees: number;
  livingCosts: {
    student: number;
    partner: number;
    children: number;
    total: number;
  };
  schoolingCosts: number;
  total: number;
  visaDuration?: VisaDuration;
  travelRegion: string;
  locationType: string;
  totalAnnualFees: number;
  prepaidFees: number;
  numberOfChildren: number;
  schoolAgeChildren: number;
}