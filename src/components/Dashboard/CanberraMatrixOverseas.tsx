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

// Sample points logic for overseas Canberra Matrix
const prevResidenceOptions: OptionCard[] = [
  { value: '5plus', label: 'More than five years', points: 20 },
  { value: '3to5', label: 'Three to five years', points: 15 },
  { value: '1to3', label: 'One to three years', points: 10 },
  { value: 'visit', label: 'Visited Canberra (one Year))', points: 5 },
  { value: 'none', label: 'Not applicable', points: 0 },
];

const nominatedOccOptions: OptionCard[] = [
  { value: 'onList', label: 'ON the ACT Critical Skills List', points: 20 },
  { value: 'notOnList', label: 'NOT on the list', points: 0 },
];

const englishOptions: OptionCard[] = [
  { value: 'superior', label: 'Superior', points: 15 },
  { value: 'proficient', label: 'Proficient', points: 10 },
  { value: 'competent', label: 'Competent', points: 0 },
];

const spouseEnglishOptions: OptionCard[] = [
  { value: 'superior', label: 'Superior/Proficient', points: 5 },
  { value: 'competent', label: 'Competent', points: 0 },
  { value: 'none', label: 'Not Applicable', points: 0 },
];

const jobOfferOptions: OptionCard[] = [
  { value: 'yes', label: 'Genuine ACT job offer', points: 20 },
  { value: 'no', label: 'Not applicable', points: 0 },
];

const relevantExpOptions: OptionCard[] = [
  { value: '8to10', label: 'Eight to 10 years', points: 20 },
  { value: '5to8', label: 'Five to Eight years', points: 10 },
  { value: '3to5', label: 'Three to Five years', points: 5 },
];

const spouseEmployOptions: OptionCard[] = [
  { value: 'criticalOcc', label: 'Working in ACT Critical Skills, valid assessment', points: 15 },
  { value: 'anzsco1to3', label: 'Working in ANZSCO skill 1-3 w/ assessment', points: 10 },
  { value: 'anyWithQual', label: 'Working in any occupation w/ relevant qual', points: 5 },
  { value: 'notapplicable', label: 'Not applicable', points: 0 },
];

const tertiaryOptions: OptionCard[] = [
  { value: 'phd', label: 'Doctoral degree (PhD)', points: 20 },
  { value: 'masters', label: "Master's Degree", points: 15 },
  { value: 'bachelor', label: 'Bachelor / trade certificate', points: 10 },
  { value: 'diploma', label: 'Diploma (18+ months)', points: 5 },
  { value: 'none', label: 'Not applicable', points: 0 },
];

const studyYearsOptions: OptionCard[] = [
  { value: '4', label: 'Four years or more', points: 20 },
  { value: '3', label: 'Three years', points: 15 },
  { value: '2', label: 'Two years', points: 10 },
  { value: '1', label: 'One year', points: 5 },
  { value: '0', label: 'Not applicable', points: 0 },
];

const familyTiesOptions: OptionCard[] = [
  { value: 'family', label: 'Aus citizen/PR spouse, child, parent in Canberra', points: 20 },
  { value: 'tempVisa', label: 'Temporary resident in Canberra', points: 5 },
  { value: 'notapplicable', label: 'Not applicable', points: 0 },
];

const assetsOptions: OptionCard[] = [
  { value: '250k', label: ' Minimum $250,000 cash investment in ACT residential or commercial property', points: 10 },
  { value: 'business2yrs', label: 'A minimum $100,000 business turnover in the last six months.', points: 10 },
  { value: 'notapplicable', label: 'Not applicable', points: 0 },
];

const CanberraMatrixOverseas: React.FC = () => {
  const [prevResidence, setPrevResidence] = useState('');
  const [nominatedOcc, setNominatedOcc] = useState('');
  const [english, setEnglish] = useState('');
  const [spouseEnglish, setSpouseEnglish] = useState('');
  const [jobOffer, setJobOffer] = useState('');
  const [workExp, setWorkExp] = useState('');
  const [spouseEmploy, setSpouseEmploy] = useState('');
  const [tertiary, setTertiary] = useState('');
  const [studyYears, setStudyYears] = useState('');
  const [familyTies, setFamilyTies] = useState('');
  const [assets, setAssets] = useState('');

  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    let points = 0;
    points += prevResidenceOptions.find(o => o.value === prevResidence)?.points ?? 0;
    points += nominatedOccOptions.find(o => o.value === nominatedOcc)?.points ?? 0;
    points += englishOptions.find(o => o.value === english)?.points ?? 0;
    points += spouseEnglishOptions.find(o => o.value === spouseEnglish)?.points ?? 0;
    points += jobOfferOptions.find(o => o.value === jobOffer)?.points ?? 0;
    points += relevantExpOptions.find(o => o.value === workExp)?.points ?? 0;
    points += spouseEmployOptions.find(o => o.value === spouseEmploy)?.points ?? 0;
    points += tertiaryOptions.find(o => o.value === tertiary)?.points ?? 0;
    points += studyYearsOptions.find(o => o.value === studyYears)?.points ?? 0;
    points += familyTiesOptions.find(o => o.value === familyTies)?.points ?? 0;
    points += assetsOptions.find(o => o.value === assets)?.points ?? 0;

    setTotalPoints(points);
  }, [
    prevResidence, nominatedOcc, english, spouseEnglish, jobOffer, workExp,
    spouseEmploy, tertiary, studyYears, familyTies, assets
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
              Canberra Matrix (Overseas Applicants)
            </h1>
            <p className="text-sm text-gray-600">
              Approximate points calculation for overseas ACT applicants.
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
        {renderQuestion('Previous ACT residence', prevResidence, setPrevResidence, prevResidenceOptions)}
        {renderQuestion('Nominated occupation', nominatedOcc, setNominatedOcc, nominatedOccOptions)}
        {renderQuestion('English proficiency', english, setEnglish, englishOptions)}
        {renderQuestion('Spouse/Partner English proficiency', spouseEnglish, setSpouseEnglish, spouseEnglishOptions)}
        {renderQuestion('ACT job offer', jobOffer, setJobOffer, jobOfferOptions)}
        </div>
        
        {/* Right Column */}
        <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl shadow-lg border border-blue-100 p-8 space-y-8">
        {renderQuestion('Relevant work experience', workExp, setWorkExp, relevantExpOptions)}
        {renderQuestion('Spouse/Partner employability', spouseEmploy, setSpouseEmploy, spouseEmployOptions)}
        {renderQuestion('Tertiary qualification', tertiary, setTertiary, tertiaryOptions)}
        {renderQuestion('Study at an ACT tertiary institution', studyYears, setStudyYears, studyYearsOptions)}
        {renderQuestion('Close family ties', familyTies, setFamilyTies, familyTiesOptions)}
        {renderQuestion('Assets in Canberra', assets, setAssets, assetsOptions)}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-3xl p-6 lg:p-8 mb-24">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="text-sm text-amber-700">
            This is an approximate matrix only. See{' '}
            <a
              href="https://www.act.gov.au/migration/skilled-migrants/canberra-matrix/check-your-canberra-matrix-score-overseas-applicants"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-800 hover:text-amber-900 underline"
            >
              official ACT info
            </a>{' '}
            for final details.
          </div>
        </div>
      </div>
    </div>
  );
};

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

export default CanberraMatrixOverseas;