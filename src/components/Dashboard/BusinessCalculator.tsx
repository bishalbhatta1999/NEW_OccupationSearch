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

// Approximate official points logic for the Business Innovation & Investment Program
// You can adjust these values if your references differ.
const ageOptions: OptionCard[] = [
  { value: '18-24', label: '18 to 24', points: 20 },
  { value: '25-32', label: '25 to 32', points: 30 },
  { value: '33-39', label: '33 to 39', points: 25 },
  { value: '40-44', label: '40 to 44', points: 20 },
  { value: '45-54', label: '45 to 54', points: 15 },
  { value: '55plus', label: '55 and older', points: 0 },
];

const englishOptions: OptionCard[] = [
  { value: 'functional', label: 'Functional English', points: 0 },
  { value: 'vocational', label: 'Vocational English', points: 5 },
  { value: 'proficient', label: 'Proficient English', points: 10 },
];

const qualificationOptions: OptionCard[] = [
  { value: 'none', label: 'No recognized qualification', points: 0 },
  { value: 'tradeOrBachelor', label: 'Trade cert or bachelor (any field)', points: 5 },
  { value: 'businessBachelor', label: 'Bachelor in business/science/tech', points: 10 },
];

const financialAssetsOptions: OptionCard[] = [
  { value: 'less1.25', label: 'Less than AUD 1,250,000', points: 0 },
  { value: '1.25', label: 'Not less than AUD 1,250,000', points: 5 },
  { value: '1.75', label: 'Not less than AUD 1,750,000', points: 15 },
  { value: '2.25', label: 'Not less than AUD 2,250,000', points: 25 },
  { value: '2.75', label: 'Not less than AUD 2,750,000', points: 35 },
];

const businessTurnoverOptions: OptionCard[] = [
  { value: 'less750', label: 'Less than AUD 750,000', points: 0 },
  { value: '750', label: 'Not less than AUD 750,000', points: 5 },
  { value: '1.25', label: 'Not Less than AUD 1,250,000', points: 15 },
  { value: '1.75', label: 'Not less than AUD 1,750,000', points: 25 },
  { value: '2.25', label: 'Not less than 2,250,000', points: 35 },
];

const businessInnovationOptions: OptionCard[] = [
  { value: '7years', label: '7 years or more within preceding 8 years', points: 15 },
  { value: '4years', label: '4 years or more within preceding 5 years', points: 10 },
  { value: '0', label: 'Less than 4 years', points: 0 },
];

const investorStreamOptions: OptionCard[] = [
  { 
    value: 'header', 
    label: 'If you are invited to apply for the visa on or after 1 July 2021, immediately before the time of invitation to apply for the visa you:', 
    points: 0,
    description: 'Select the option that best matches your situation'
  },
  { value: '7years', label: 'Held eligible investments of at least AUD 250,000 not less than 7 years', points: 15 },
  { value: '4years', label: 'Held eligible investments of at least AUD 250,000 not less than 4 years', points: 10 },
  { value: '0', label: 'Held eligible investments of at least AUD 250,000 Less than 4 years', points: 0 },
];

const businessInnovationQualOptions: OptionCard[] = [
  { value: 'patent', label: 'Patents or designs registered at least one year prior and actively utilized in the core operations of the primary business.', points: 15 },
  { value: 'trademark', label: 'Trademarks registered at least one year prior and actively utilized in the core operations of the primary business.', points: 10 },
  { value: 'jointVenture', label: 'Ownership and active participation in the management of one or more primary businesses under a formal joint venture agreement established at least one year prior.', points: 5 },
  { value: 'export', label: 'Ownership interest in a primary business generating at least 50% of its annual revenue from export activities.', points: 15 },
  { value: 'highGrowth', label: 'Ownership interest in a primary business established within the past five years that: Achieved an average annual growth rate in turnover exceeding 20% over three consecutive fiscal years; and Employed 10 or more full-time equivalent employees in at least one of those fiscal years.', points: 10 },
  { value: 'grant', label: 'Ownership interest in a primary business that received:A grant of at least AUD 10,000 from a government body in your home country for early-stage business startup, product commercialization, business development, or expansion; or Venture capital funding of at least AUD 100,000 within the past four years for early-stage business startup, product commercialization, business development, or expansion.', points: 10 },
  { value: 'none', label: 'None of the above', points: 0 },
];

const specialEndorsementOptions: OptionCard[] = [
  { value: 'yes', label: 'Yes', points: 10 },
  { value: 'no', label: 'No', points: 0 },
];

const BusinessCalculator: React.FC = () => {
  const [age, setAge] = useState('');
  const [english, setEnglish] = useState('');
  const [qualification, setQualification] = useState('');
  const [financialAssets, setFinancialAssets] = useState('');
  const [businessTurnover, setBusinessTurnover] = useState('');
  const [businessInnovation, setBusinessInnovation] = useState('');
  const [investorStream, setInvestorStream] = useState('');
  const [innovationQual, setInnovationQual] = useState('');
  const [specialEndorsement, setSpecialEndorsement] = useState('');

  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    calculatePoints();
  }, [age, english, qualification, financialAssets, businessTurnover, businessInnovation, investorStream, innovationQual, specialEndorsement]);

  const calculatePoints = () => {
    let points = 0;

    // Age
    points += ageOptions.find(opt => opt.value === age)?.points ?? 0;

    // English
    points += englishOptions.find(opt => opt.value === english)?.points ?? 0;

    // Qualification
    points += qualificationOptions.find(opt => opt.value === qualification)?.points ?? 0;

    // Financial Assets
    points += financialAssetsOptions.find(opt => opt.value === financialAssets)?.points ?? 0;

    // Business Turnover
    points += businessTurnoverOptions.find(opt => opt.value === businessTurnover)?.points ?? 0;

    // Business Innovation
    points += businessInnovationOptions.find(opt => opt.value === businessInnovation)?.points ?? 0;

    // Investor Stream
    points += investorStreamOptions.find(opt => opt.value === investorStream)?.points ?? 0;

    // Business Innovation Qualifications
    points += businessInnovationQualOptions.find(opt => opt.value === innovationQual)?.points ?? 0;

    // Special Endorsement
    points += specialEndorsementOptions.find(opt => opt.value === specialEndorsement)?.points ?? 0;

    setTotalPoints(points);
  };

  // Reusable rendering
  const renderOptions = (
    title: string,
    value: string,
    onChange: (val: string) => void,
    options: OptionCard[],
    showHeader: boolean = false
  ) => {
    const selectedOption = options.find(opt => opt.value === value);
    const displayOptions = showHeader ? options.filter(opt => opt.value !== 'header') : options;
    const headerOption = showHeader ? options.find(opt => opt.value === 'header') : null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {selectedOption ? `${selectedOption.points} Points` : '0 Points'}
          </div>
        </div>

        {headerOption && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
            <p className="text-sm text-blue-800 font-medium">{headerOption.label}</p>
            {headerOption.description && (
              <p className="text-sm text-blue-600 mt-1">{headerOption.description}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayOptions.map(opt => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200
                  ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">{opt.label}</span>
                    {opt.description && (
                      <p className="text-sm text-gray-600 mt-1">{opt.description}</p>
                    )}
                  </div>
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
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Business Visa Calculator</h1>
            <p className="text-sm text-gray-600">
              Calculate your eligibility points for the Business Innovation and Investment visa.
            </p>
          </div>
        </div>

        {/* Points Summary */}
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
                <span className="font-medium">Eligible</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Need more points</span>
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

      {/* Calculator Form */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-blue-100 p-8 space-y-8">
        {/* Left Column */}
        <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl shadow-lg border border-blue-100 p-8 space-y-8">
        {renderOptions('Age', age, setAge, ageOptions)}
        {renderOptions('English Language Ability', english, setEnglish, englishOptions)}
        {renderOptions('Educational Qualification', qualification, setQualification, qualificationOptions)}
        {renderOptions('Financial Assets', financialAssets, setFinancialAssets, financialAssetsOptions)}
        {renderOptions('Business Turnover', businessTurnover, setBusinessTurnover, businessTurnoverOptions)}
        </div>
        
        {/* Right Column */}
        <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl shadow-lg border border-blue-100 p-8 space-y-8">
        {renderOptions('Business Innovation Stream Only', businessInnovation, setBusinessInnovation, businessInnovationOptions)}
        {renderOptions('Investor Stream Only', investorStream, setInvestorStream, investorStreamOptions, true)}
        {renderOptions('Business Innovation Qualifications', innovationQual, setInnovationQual, businessInnovationQualOptions)}
        {renderOptions('Special Endorsement', specialEndorsement, setSpecialEndorsement, specialEndorsementOptions)}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-3xl p-6 lg:p-8 mb-24">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            This is an indicative points calculation only. For official information, please refer to the{' '}
            <a
              href="https://www.legislation.gov.au/Series/F1996B03551"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-800 hover:text-amber-900 underline"
            >
              Department of Home Affairs website
            </a>{' '}
            for the latest requirements and point allocations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessCalculator;