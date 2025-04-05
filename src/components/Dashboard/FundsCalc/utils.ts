import { CalculatorFormData, CostBreakdown, VisaDuration } from '../../../types/calculator';

const MONTHLY_LIVING_COST = {
  STUDENT: 29710 / 12,
  PARTNER: 10394 / 12,
  CHILD: 4449 / 12,
};

const TRAVEL_COSTS = {
  'East/Southern Africa': 2500,
  'West Africa': 3000,
  'Outside Australia': 2000,
  'Within Australia': 1000,
};

const AFRICA_RETURN_COST = 1500;
const SCHOOLING_COST_PER_CHILD = 13502;

interface TravelCostBreakdown {
  student: number;
  partner: number;
  children: number;
  total: number;
  isAfricanReturn: boolean;
}

const calculateTravelCostsPerApplicant = (
  locationType: string,
  travelRegion: string,
  hasPartner: boolean,
  numberOfChildren: number
): TravelCostBreakdown => {
  const isInAustralia = locationType === 'In Australia';
  const isAfricanRegion = travelRegion.includes('Africa');
  const baseCostPerPerson = isInAustralia ? TRAVEL_COSTS['Within Australia'] : TRAVEL_COSTS[travelRegion];
  const africanReturnCost = isInAustralia && isAfricanRegion ? AFRICA_RETURN_COST : 0;

  const studentCost = baseCostPerPerson + africanReturnCost;
  const partnerCost = hasPartner ? (baseCostPerPerson + africanReturnCost) : 0;
  const childrenCost = numberOfChildren * (baseCostPerPerson + africanReturnCost);

  return {
    student: studentCost,
    partner: partnerCost,
    children: childrenCost,
    total: studentCost + partnerCost + childrenCost,
    isAfricanReturn: isInAustralia && isAfricanRegion
  };
};

const calculateAdditionalMonths = (courseEndDate: Date): number => {
  const month = courseEndDate.getMonth(); // 0-11 (Jan-Dec)
  const day = courseEndDate.getDate();

  // November 16-30: Add 4 months to reach March 15
  if (month === 10 && day > 15) {
    return 4;
  }
  // December: Add 3 months to reach March 15
  else if (month === 11) {
    return 3;
  }
  // January 1-19: Add 2 months to reach March 15
  else if (month === 0 && day < 20) {
    return 2;
  }
  // January 20-November 15: Add 2 months (default)
  else if ((month === 0 && day >= 20) || (month >= 1 && month <= 10) || (month === 10 && day <= 15)) {
    return 2;
  }

  return 2; // Default case
};

export const calculateVisaDuration = (
  courseEndDate: Date,
  visaExpiryDate: Date
): VisaDuration => {
  // Calculate base duration (months between visa expiry and course end)
  const yearDiff = courseEndDate.getFullYear() - visaExpiryDate.getFullYear();
  const monthDiff = courseEndDate.getMonth() - visaExpiryDate.getMonth();
  let baseDuration = yearDiff * 12 + monthDiff;

  // Adjust for days in the month
  const dayDiff = courseEndDate.getDate() - visaExpiryDate.getDate();
  if (dayDiff > 20) {
    baseDuration += 1;
  }

  // Calculate additional months based on course end date
  const additionalMonths = calculateAdditionalMonths(courseEndDate);
  const totalDuration = Math.min(baseDuration + additionalMonths, 12);

  return {
    baseDuration,
    additionalMonths,
    totalDuration
  };
};

export const calculateTotalCosts = (data: CalculatorFormData): CostBreakdown => {
  // Calculate number of applicants
  const numberOfChildren = data.children.length;
  const hasPartner = data.applicationType !== 'Single';

  // Calculate travel costs with detailed breakdown
  const travelCostBreakdown = calculateTravelCostsPerApplicant(
    data.locationType,
    data.travelRegion,
    hasPartner,
    numberOfChildren
  );

  // Calculate course fees
  const courseFees = data.totalAnnualFees - data.prepaidFees;

  // Calculate visa duration
  let visaDuration = {
    baseDuration: 12,
    additionalMonths: 0,
    totalDuration: 12
  };
  
  if (data.locationType === 'In Australia' && data.visaExpiryDate && data.courseEndDate) {
    visaDuration = calculateVisaDuration(data.courseEndDate, data.visaExpiryDate);
  }

  // Calculate living costs based on application type and duration
  const livingCosts = {
    student: MONTHLY_LIVING_COST.STUDENT * visaDuration.totalDuration,
    partner: hasPartner ? MONTHLY_LIVING_COST.PARTNER * visaDuration.totalDuration : 0,
    children: numberOfChildren * MONTHLY_LIVING_COST.CHILD * visaDuration.totalDuration,
    total: 0
  };
  livingCosts.total = livingCosts.student + livingCosts.partner + livingCosts.children;

  // Calculate schooling costs
  const schoolAgeChildren = data.children.filter(child => {
    const age = calculateAge(child.dateOfBirth);
    return age >= 5;
  }).length;

  const schoolingCosts = schoolAgeChildren * SCHOOLING_COST_PER_CHILD;

  return {
    travelCosts: travelCostBreakdown.total,
    travelCostBreakdown,
    courseFees,
    livingCosts,
    schoolingCosts,
    total: travelCostBreakdown.total + courseFees + livingCosts.total + schoolingCosts,
    visaDuration,
    travelRegion: data.travelRegion,
    totalAnnualFees: data.totalAnnualFees,
    prepaidFees: data.prepaidFees,
    numberOfChildren,
    schoolAgeChildren,
    locationType: data.locationType
  };
};

const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};