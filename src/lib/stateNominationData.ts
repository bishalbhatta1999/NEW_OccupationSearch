import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth, isSuperAdmin } from './firebase';

// Keep all the interfaces...

interface EnglishTestRequirements {
  listening: string | number;
  reading: string | number;
  writing: string | number;
  speaking: string | number;
  overall: string | number;
}

interface StateNominationData {
  stateName: string;
  basicEligibility: string[];
  englishRequirements: {
    IELTS: EnglishTestRequirements;
    OET: EnglishTestRequirements;
    TOEFL: EnglishTestRequirements;
    PTE: EnglishTestRequirements;
    CAE: EnglishTestRequirements;
  };
  additionalDetails: {
    processingFee: string;
    processingTime: string;
    applicationProcess: string;
    employmentStats: {
      softwareEngineers: string;
      overallOccupations: string;
    };
    eoiSubmissions: string;
  };
  referenceUrl: string;
  lastUpdated: string;
}

export const stateNominationData: StateNominationData[] = [
  {
    stateName: "New South Wales",
    basicEligibility: [
      "Must be under 45 years of age",
      "Must have a valid skills assessment for nominated occupation",
      "Must have Competent English or higher",
      "Must be currently living in NSW or offshore",
      "Must have minimum 3 years work experience in nominated occupation",
      "Must meet the minimum points score of 65 points",
      "Must meet occupation-specific requirements if applicable"
    ],
    englishRequirements: {
      IELTS: { listening: 6.0, reading: 6.0, writing: 6.0, speaking: 6.0, overall: 6.0 },
      OET: { listening: "B", reading: "B", writing: "B", speaking: "B", overall: "B" },
      TOEFL: { listening: 12, reading: 13, writing: 21, speaking: 18, overall: 60 },
      PTE: { listening: 50, reading: 50, writing: 50, speaking: 50, overall: 50 },
      CAE: { listening: 169, reading: 169, writing: 169, speaking: 169, overall: 169 }
    },
    additionalDetails: {
      processingFee: "AUD 330",
      processingTime: "6-8 weeks",
      applicationProcess: "Online application through NSW portal",
      employmentStats: {
        softwareEngineers: "41.7%",
        overallOccupations: "31.6%"
      },
      eoiSubmissions: "3,688"
    },
    referenceUrl: "https://www.nsw.gov.au/topics/visas-and-migration",
    lastUpdated: "2024-03-15"
  },
  {
    stateName: "Victoria",
    basicEligibility: [
      "Must be under 45 years of age",
      "Must have a valid skills assessment for nominated occupation",
      "Must have Competent English or higher",
      "Must have minimum 3 years work experience",
      "Must meet the minimum points score of 65 points",
      "Must demonstrate commitment to living and working in Victoria",
      "Must meet occupation-specific requirements if applicable"
    ],
    englishRequirements: {
      IELTS: { listening: 6.0, reading: 6.0, writing: 6.0, speaking: 6.0, overall: 6.0 },
      OET: { listening: "B", reading: "B", writing: "B", speaking: "B", overall: "B" },
      TOEFL: { listening: 12, reading: 13, writing: 21, speaking: 18, overall: 60 },
      PTE: { listening: 50, reading: 50, writing: 50, speaking: 50, overall: 50 },
      CAE: { listening: 169, reading: 169, writing: 169, speaking: 169, overall: 169 }
    },
    additionalDetails: {
      processingFee: "AUD 330",
      processingTime: "8-12 weeks",
      applicationProcess: "Online application through Live in Melbourne portal",
      employmentStats: {
        softwareEngineers: "38.5%",
        overallOccupations: "29.8%"
      },
      eoiSubmissions: "2,945"
    },
    referenceUrl: "https://liveinmelbourne.vic.gov.au/",
    lastUpdated: "2024-03-15"
  },
  {
    stateName: "Queensland",
    basicEligibility: [
      "Must be under 45 years of age",
      "Must have a valid skills assessment for nominated occupation",
      "Must have Competent English or higher",
      "Must have minimum 2 years post-qualification work experience",
      "Must meet the minimum points score of 65 points",
      "Must demonstrate commitment to Queensland",
      "Must meet any occupation-specific requirements"
    ],
    englishRequirements: {
      IELTS: { listening: 6.0, reading: 6.0, writing: 6.0, speaking: 6.0, overall: 6.0 },
      OET: { listening: "B", reading: "B", writing: "B", speaking: "B", overall: "B" },
      TOEFL: { listening: 12, reading: 13, writing: 21, speaking: 18, overall: 60 },
      PTE: { listening: 50, reading: 50, writing: 50, speaking: 50, overall: 50 },
      CAE: { listening: 169, reading: 169, writing: 169, speaking: 169, overall: 169 }
    },
    additionalDetails: {
      processingFee: "AUD 330",
      processingTime: "4-6 weeks",
      applicationProcess: "Online application through BSMQ portal",
      employmentStats: {
        softwareEngineers: "35.2%",
        overallOccupations: "27.4%"
      },
      eoiSubmissions: "2,156"
    },
    referenceUrl: "https://migration.qld.gov.au/",
    lastUpdated: "2024-03-15"
  },
  {
    stateName: "South Australia",
    basicEligibility: [
      "Must be under 45 years of age",
      "Must have a valid skills assessment for nominated occupation",
      "Must have Competent English or higher",
      "Must meet the minimum points score of 65 points",
      "Must meet occupation-specific work experience requirements",
      "Must demonstrate commitment to South Australia",
      "Must meet any additional occupation-specific requirements"
    ],
    englishRequirements: {
      IELTS: { listening: 6.0, reading: 6.0, writing: 6.0, speaking: 6.0, overall: 6.0 },
      OET: { listening: "B", reading: "B", writing: "B", speaking: "B", overall: "B" },
      TOEFL: { listening: 12, reading: 13, writing: 21, speaking: 18, overall: 60 },
      PTE: { listening: 50, reading: 50, writing: 50, speaking: 50, overall: 50 },
      CAE: { listening: 169, reading: 169, writing: 169, speaking: 169, overall: 169 }
    },
    additionalDetails: {
      processingFee: "AUD 330",
      processingTime: "4-8 weeks",
      applicationProcess: "Online application through Immigration SA portal",
      employmentStats: {
        softwareEngineers: "32.8%",
        overallOccupations: "25.9%"
      },
      eoiSubmissions: "1,876"
    },
    referenceUrl: "https://migration.sa.gov.au/",
    lastUpdated: "2024-03-15"
  },
  {
    stateName: "Western Australia",
    basicEligibility: [
      "Must be under 45 years of age",
      "Must have a valid skills assessment for nominated occupation",
      "Must have Competent English or higher",
      "Must meet the minimum points score of 65 points",
      "Must demonstrate commitment to Western Australia",
      "Must meet occupation-specific requirements",
      "Must have relevant work experience"
    ],
    englishRequirements: {
      IELTS: { listening: 6.0, reading: 6.0, writing: 6.0, speaking: 6.0, overall: 6.0 },
      OET: { listening: "B", reading: "B", writing: "B", speaking: "B", overall: "B" },
      TOEFL: { listening: 12, reading: 13, writing: 21, speaking: 18, overall: 60 },
      PTE: { listening: 50, reading: 50, writing: 50, speaking: 50, overall: 50 },
      CAE: { listening: 169, reading: 169, writing: 169, speaking: 169, overall: 169 }
    },
    additionalDetails: {
      processingFee: "AUD 330",
      processingTime: "6-8 weeks",
      applicationProcess: "Online application through WA Migration portal",
      employmentStats: {
        softwareEngineers: "30.5%",
        overallOccupations: "24.2%"
      },
      eoiSubmissions: "1,654"
    },
    referenceUrl: "https://migration.wa.gov.au/",
    lastUpdated: "2024-03-15"
  },
  {
    stateName: "Tasmania",
    basicEligibility: [
      "Must be under 45 years of age",
      "Must have a valid skills assessment for nominated occupation",
      "Must have Competent English or higher",
      "Must meet the minimum points score of 65 points",
      "Must demonstrate commitment to Tasmania",
      "Must meet occupation-specific requirements",
      "Must have relevant work experience or study in Tasmania"
    ],
    englishRequirements: {
      IELTS: { listening: 6.0, reading: 6.0, writing: 6.0, speaking: 6.0, overall: 6.0 },
      OET: { listening: "B", reading: "B", writing: "B", speaking: "B", overall: "B" },
      TOEFL: { listening: 12, reading: 13, writing: 21, speaking: 18, overall: 60 },
      PTE: { listening: 50, reading: 50, writing: 50, speaking: 50, overall: 50 },
      CAE: { listening: 169, reading: 169, writing: 169, speaking: 169, overall: 169 }
    },
    additionalDetails: {
      processingFee: "AUD 330",
      processingTime: "4-6 weeks",
      applicationProcess: "Online application through Migration Tasmania portal",
      employmentStats: {
        softwareEngineers: "28.4%",
        overallOccupations: "22.7%"
      },
      eoiSubmissions: "985"
    },
    referenceUrl: "https://www.migration.tas.gov.au/",
    lastUpdated: "2024-03-15"
  },
  {
    stateName: "Northern Territory",
    basicEligibility: [
      "Must be under 45 years of age",
      "Must have a valid skills assessment for nominated occupation",
      "Must have Competent English or higher",
      "Must meet the minimum points score of 65 points",
      "Must demonstrate commitment to the Northern Territory",
      "Must meet occupation-specific requirements",
      "Must have relevant work experience or study in NT"
    ],
    englishRequirements: {
      IELTS: { listening: 6.0, reading: 6.0, writing: 6.0, speaking: 6.0, overall: 6.0 },
      OET: { listening: "B", reading: "B", writing: "B", speaking: "B", overall: "B" },
      TOEFL: { listening: 12, reading: 13, writing: 21, speaking: 18, overall: 60 },
      PTE: { listening: 50, reading: 50, writing: 50, speaking: 50, overall: 50 },
      CAE: { listening: 169, reading: 169, writing: 169, speaking: 169, overall: 169 }
    },
    additionalDetails: {
      processingFee: "AUD 330",
      processingTime: "4-6 weeks",
      applicationProcess: "Online application through NT Migration portal",
      employmentStats: {
        softwareEngineers: "26.3%",
        overallOccupations: "21.5%"
      },
      eoiSubmissions: "754"
    },
    referenceUrl: "https://theterritory.com.au/migrate",
    lastUpdated: "2024-03-15"
  },
  {
    stateName: "Australian Capital Territory",
    basicEligibility: [
      "Must be under 45 years of age",
      "Must have a valid skills assessment for nominated occupation",
      "Must have Competent English or higher",
      "Must meet the minimum points score of 65 points",
      "Must demonstrate commitment to the ACT",
      "Must meet occupation-specific requirements",
      "Must have relevant work experience or study in ACT"
    ],
    englishRequirements: {
      IELTS: { listening: 6.0, reading: 6.0, writing: 6.0, speaking: 6.0, overall: 6.0 },
      OET: { listening: "B", reading: "B", writing: "B", speaking: "B", overall: "B" },
      TOEFL: { listening: 12, reading: 13, writing: 21, speaking: 18, overall: 60 },
      PTE: { listening: 50, reading: 50, writing: 50, speaking: 50, overall: 50 },
      CAE: { listening: 169, reading: 169, writing: 169, speaking: 169, overall: 169 }
    },
    additionalDetails: {
      processingFee: "AUD 330",
      processingTime: "4-6 weeks",
      applicationProcess: "Online application through ACT Migration portal",
      employmentStats: {
        softwareEngineers: "33.7%",
        overallOccupations: "26.8%"
      },
      eoiSubmissions: "892"
    },
    referenceUrl: "https://www.act.gov.au/migration",
    lastUpdated: "2024-03-15"
  }
];

export async function uploadStateNominationData(occupationCode: string) {
  if (!occupationCode) {
    console.log('No occupation code provided for state requirements upload');
    return;
  }

  const stateReqRef = collection(db, 'stateRequirements');
  
  // Check if we're authenticated first
  if (!auth.currentUser) {
    console.log('User must be authenticated to upload state requirements');
    return;
  }

  // Check if user has admin privileges
  const isAdmin = await isSuperAdmin(auth.currentUser.uid);
  if (!isAdmin) {
    console.log('User must have admin privileges to upload state requirements');
    return;
  }

  for (const state of stateNominationData) {
    try {
      // Check if state already exists
      const q = query(
        stateReqRef, 
        where("stateName", "==", state.stateName),
        where("anzscocode", "==", occupationCode)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Add new state data
        await addDoc(stateReqRef, {
          stateName: state.stateName,
          anzscocode: occupationCode,
          requirements: state.basicEligibility,
          englishRequirements: state.englishRequirements,
          additionalDetails: state.additionalDetails,
          referenceUrl: state.referenceUrl,
          lastUpdated: new Date().toISOString()
        });
        console.log(`Added data for ${state.stateName}`);
      } else {
        console.log(`Data for ${state.stateName} already exists`);
      }
    } catch (error) {
      console.error(`Error uploading data for ${state.stateName}:`, error);
    }
  }
}