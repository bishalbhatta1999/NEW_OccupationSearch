import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Calculator,
  Star,
  TrendingUp,
} from 'lucide-react';

interface OptionCard {
  value: string;
  label: string;
  points: number;
  description?: string;
}

// Example point logic: Adjust to official Canberra guidelines
const lengthOfResidenceOptions: OptionCard[] = [
  { value: '5yearsPlus', label: 'Five years plus', points: 25 },
  { value: '4to5', label: 'Four to five years', points: 20 },
  { value: '3to4', label: 'Three to four years', points: 15 },
  { value: '2to3', label: 'Two to three years', points: 10 },
  { value: '1to2', label: 'One to two years', points: 5 },
  { value: 'less1', label: 'Less than one year', points: 0 },
];

const englishOptions: OptionCard[] = [
  { value: 'superior', label: 'Superior', points: 15 },
  { value: 'proficient', label: 'Proficient', points: 10 },
  { value: 'competent', label: 'Competent', points: 0 },
];

const spouseEnglishOptions: OptionCard[] = [
  { value: 'superior', label: 'Superior/Proficient', points: 5 },
  { value: 'competent', label: 'Competent', points: 0 },
  { value: 'notApplicable', label: 'Not Applicable', points: 0 },
];

const nominatedOccOptions: OptionCard[] = [
  { value: 'onList', label: 'Your occupation is ON the ACT Critical Skills List', points: 20 },
  { value: 'notOnList', label: 'NOT on the ACT Critical Skills List', points: 0 },
];

const smallBusinessOptions: OptionCard[] = [
  { value: 'owner12', label: 'Your business has actively traded in Canberra for at least twelve months from the date you established or purchased the business. The business has a minimum turnover of at least $200,000 for the last twelve months business activity', points: 20 },
  { value: 'owner6', label: 'Your business has actively traded in Canberra for at least six months from the date you established or purchased the business. The business has a minimum annual turnover of at least $100,000 for the last six months business activity', points: 10 },
  { value: 'none', label: 'No applicable', points: 0 },
];

const lengthOfEmploymentOptions: OptionCard[] = [
  { value: '12', label: 'Employed 12 months plus', points: 10 },
  { value: '6', label: 'Employed 6-12 months', points: 5 },
  { value: '0', label: 'Not applicable', points: 0 },
];

const skillLevelOptions: OptionCard[] = [
  { value: 'sameOcc', label: "You are working in your nominated occupation which is on the current ACT Critical Skills List. Your occupation must be recorded as \"related to the nominated occupation\" on your SkillSelect EOI", points: 20 },
  { value: '482', label: "You are the primary holder of a subclass 457 / 482 visa and you are working for the ACT employer who sponsored your visa. Your occupation must be recorded as \"related to the nominated occupation\" on your SkillSelect EOI", points: 15 },
  { value: 'otherCritical', label: 'You are working in an occupation that is on the current ACT Critical Skills List; but it is not your nominated occupation', points: 10 },
  { value: 'anzsco1to3', label: 'You are working in an occupation that has an ANZSCO skill level 1 to 3', points: 5 },
  { value: 'none', label: 'Not applicable', points: 0 },
];

const spouseEmploymentOptions: OptionCard[] = [
  { value: 'spouseCritical', label: 'They are working in an occupation on the ACT Critical Skills List. They must have a skill assessment, dated within the last 3 years, that is relevant to their current employment. Their taxable income must be no less than $26 per hour (excluding casual loading).', points: 15 },
  { value: 'skillAssess', label: 'They have a skill assessment, dated within the last 3 years, that is relevant to their current ACT employment. Their gross income must be no less than $26 per hour (excluding casual loading).', points: 10 },
  { value: 'anyJob', label: 'Spouse working in any occupation, at any skill level, in Canberra.', points: 5 },
  { value: 'spouseEmployable', label: 'They do not meet the 3 months employment criterion, but have a tertiary qualification and competent English.', points: 5 },
  { value: 'notApplicable', label: 'Not applicable', points: 0 },
];

const tertiaryQualOptions: OptionCard[] = [
  { value: 'phd', label: 'Doctoral degree (PhD)', points: 20 },
  { value: 'masters', label: 'Masters degree' , points: 15 },
  { value: 'bachelor', label: 'Bachelors / trade cert', points: 10 },
  { value: 'diploma', label: 'Diploma qualification', points: 5 },
  { value: 'none', label: 'Not applicable', points: 0 },
];

const studyYearsOptions: OptionCard[] = [
  { value: '4plus', label: 'Four years + CRICOS study', points: 20 },
  { value: '3', label: 'Three years of CRICOS study', points: 15 },
  { value: '2', label: 'Two years of CRICOS study', points: 10 },
  { value: '1', label: 'One year of CRICOS study', points: 5 },
  { value: 'none', label: 'Not applicable', points: 0 },
];

const closeFamilyOptions: OptionCard[] = [
  { value: 'family', label: 'Close family (Spouse/partner, child.) in Canberra 2+ years', points: 20 },
  { value: 'Parent', label: 'Parent, grandparent, brother, sister, aunt or uncle.', points: 10 },
  { value: 'none', label: 'Not applicable', points: 0 },
];

const assetsOptions: OptionCard[] = [
  { value: '250k', label: 'Minimum $250,000 cash investment in ACT residential or commercial property', points: 5 },
  { value: 'none', label: 'Not applicable', points: 0 },
];

const CanberraMatrixResidents: React.FC = () => {
  const [actResidence, setActResidence] = useState('');
  const [english, setEnglish] = useState('');
  const [spouseEnglish, setSpouseEnglish] = useState('');
  const [nominatedOcc, setNominatedOcc] = useState('');
  const [smallBusiness, setSmallBusiness] = useState('');
  const [lengthEmployment, setLengthEmployment] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [spouseEmployment, setSpouseEmployment] = useState('');
  const [tertiary, setTertiary] = useState('');
  const [studyYears, setStudyYears] = useState('');
  const [familyTies, setFamilyTies] = useState('');
  const [assets, setAssets] = useState('');

  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    let points = 0;
    points += lengthOfResidenceOptions.find(o => o.value === actResidence)?.points ?? 0;
    points += englishOptions.find(o => o.value === english)?.points ?? 0;
    points += spouseEnglishOptions.find(o => o.value === spouseEnglish)?.points ?? 0;
    points += nominatedOccOptions.find(o => o.value === nominatedOcc)?.points ?? 0;
    points += smallBusinessOptions.find(o => o.value === smallBusiness)?.points ?? 0;
    points += lengthOfEmploymentOptions.find(o => o.value === lengthEmployment)?.points ?? 0;
    points += skillLevelOptions.find(o => o.value === skillLevel)?.points ?? 0;
    points += spouseEmploymentOptions.find(o => o.value === spouseEmployment)?.points ?? 0;
    points += tertiaryQualOptions.find(o => o.value === tertiary)?.points ?? 0;
    points += studyYearsOptions.find(o => o.value === studyYears)?.points ?? 0;
    points += closeFamilyOptions.find(o => o.value === familyTies)?.points ?? 0;
    points += assetsOptions.find(o => o.value === assets)?.points ?? 0;

    setTotalPoints(points);
  }, [
    actResidence, english, spouseEnglish, nominatedOcc,
    smallBusiness, lengthEmployment, skillLevel, spouseEmployment,
    tertiary, studyYears, familyTies, assets
  ]);

  return (
    <div className="relative space-y-8 w-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-3xl shadow-lg border border-blue-100 p-8 lg:p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Canberra Matrix (Residents)
            </h1>
            <p className="text-sm text-gray-600">
              Approximate points calculation for ACT Residents.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Total Points */}
          <div className="relative w-40 h-40 mx-auto md:mx-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                className="text-gray-200"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="60"
                cx="80"
                cy="80"
              />
              <circle
                className="text-blue-600 transition-all duration-1000"
                strokeWidth="8"
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="60"
                cx="80"
                cy="80"
                strokeDasharray={`${(totalPoints / 100) * 440} 440`}
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <span className="text-3xl font-bold text-blue-600">
                {totalPoints}
              </span>
              <span className="block text-sm text-gray-500">Points</span>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-6 flex flex-col justify-center items-center shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Status</h3>
            </div>
            {totalPoints >= 65 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Potentially enough points</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Might need more points</span>
              </div>
            )}
          </div>
          
          {/* Required Points */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-6 flex flex-col justify-center items-center shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Required</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900">65</div>
            <span className="text-sm text-gray-500">Minimum Points</span>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-blue-100 p-8 space-y-8">
        {/* Left Column */}
        <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl shadow-lg border border-blue-100 p-8 space-y-8">
        {renderQuestion('Length of current ACT residence', actResidence, setActResidence, lengthOfResidenceOptions)}
        {renderQuestion('English proficiency', english, setEnglish, englishOptions)}
        {renderQuestion('Spouse/Partner English proficiency', spouseEnglish, setSpouseEnglish, spouseEnglishOptions)}
        {renderQuestion('Nominated occupation', nominatedOcc, setNominatedOcc, nominatedOccOptions)}
        {renderQuestion('Small Business Owner', smallBusiness, setSmallBusiness, smallBusinessOptions)}
        {renderQuestion('Length of ACT employment', lengthEmployment, setLengthEmployment, lengthOfEmploymentOptions)}
        </div>
        
        {/* Right Column */}
        <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl shadow-lg border border-blue-100 p-8 space-y-8">
        {renderQuestion('ACT employment - skill level', skillLevel, setSkillLevel, skillLevelOptions)}
        {renderQuestion('Spouse/Partner employment', spouseEmployment, setSpouseEmployment, spouseEmploymentOptions)}
        {renderQuestion('Tertiary qualification', tertiary, setTertiary, tertiaryQualOptions)}
        {renderQuestion('Years of study at an ACT tertiary institution', studyYears, setStudyYears, studyYearsOptions)}
        {renderQuestion('Close family ties in Canberra', familyTies, setFamilyTies, closeFamilyOptions)}
        {renderQuestion('Assets in Canberra', assets, setAssets, assetsOptions)}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-3xl p-6 lg:p-8 mb-24">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="text-sm text-amber-700">
            This is an indicative matrix only. Please see{' '}
            <a
              href="https://www.act.gov.au/migration/skilled-migrants/canberra-matrix/check-your-canberra-matrix-score-canberra-residents"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-800 hover:text-amber-900 underline"
            >
              official ACT guidelines
            </a>{' '}
            for final details.
          </div>
        </div>
      </div>
    </div>
  );
};

/** Minimal reusable question block */
function renderQuestion(
  title: string,
  value: string,
  onChange: (val: string) => void,
  options: OptionCard[]
) {
  const selectedOption = options.find(o => o.value === value);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          {selectedOption ? `${selectedOption.points} Points` : '0 Points'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map(opt => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-200
                ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900">{opt.label}</div>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${selected ? 'text-green-600' : 'text-blue-600'}`}>
                    {opt.points} pts
                  </span>
                  {selected ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CanberraMatrixResidents;