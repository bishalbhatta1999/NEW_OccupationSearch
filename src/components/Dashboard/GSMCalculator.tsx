import React, { useState, useEffect } from 'react';
import ProspectFormModal from './Form/ProspectFormModal';
import {
  GraduationCap,
  Users,
  Mail,
  Download,
  Award,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Star,
  TrendingUp,
  Import as Passport,
  GraduationCap as EducationIcon,
  Globe,
  Languages,
  UserCheck,
  Briefcase,
} from 'lucide-react';

interface OptionCard {
  value: string;
  label: string;
  points: number;
  description?: string;
}

interface PointsCalculatorProps {}

interface ProspectFormData {
  name: string;
  email: string;
  phone: string;
  notes: string[];
}

const PointsCalculator: React.FC<PointsCalculatorProps> = () => {
  // Form state
  const [visaSubclass, setVisaSubclass] = useState('');
  const [isCalculating, setIsCalculating] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formAction, setFormAction] = useState<'pdf' | 'email'>('pdf');
  const [ageRange, setAgeRange] = useState('');
  const [qualification, setQualification] = useState('');
  const [hasAustQual, setHasAustQual] = useState(''); // "yes"/"no"
  const [regionalStudy, setRegionalStudy] = useState('no'); // "yes"/"no"
  const [specialistEdu, setSpecialistEdu] = useState('no'); // "yes"/"no"
  const [overseasExp, setOverseasExp] = useState('');
  const [ausExp, setAusExp] = useState('');
  const [englishLevel, setEnglishLevel] = useState('');
  const [partnerSkill, setPartnerSkill] = useState('');
  const [hasNaati, setHasNaati] = useState('');
  const [hasProfYear, setHasProfYear] = useState('');

  // Points total
  const [totalPoints, setTotalPoints] = useState(0);

  // Reusable rendering for question sections
  const renderOptions = (
    title: string,
    description: string,
    icon: React.ElementType,
    value: string,
    onChange: (val: string) => void,
    options: OptionCard[]
  ) => {
    const Icon = icon;
    const selectedOption = options.find((opt) => opt.value === value);
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
          {/* Show the selected option's points or 0 if none */}
          <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {selectedOption ? `${selectedOption.points} Points` : '0 Points'}
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {options.map((option) => {
            const selected = value === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onChange(option.value)}
                className={`group relative p-6 rounded-2xl transition-all duration-300 
                           transform hover:scale-[1.02] hover:-translate-y-1
                           ${
                             selected
                               ? 'bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg border border-blue-200'
                               : 'bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-blue-300 hover:shadow-lg'
                           }`}
              >
                {/* Selection Indicator */}
                {selected && (
                  <div
                    className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full 
                                flex items-center justify-center shadow-lg animate-scaleIn"
                  >
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                )}

                {/* Points Badge */}
                <div
                  className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-sm font-medium
                               transition-all duration-300 shadow-sm
                               ${
                                 selected
                                   ? 'bg-blue-600 text-white'
                                   : 'bg-gray-100/80 backdrop-blur-sm text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                               }`}
                >
                  {option.points} Points
                </div>

                {/* Content */}
                <div className="mt-4 space-y-4">
                  <div className="font-medium text-lg text-gray-900">
                    {option.label}
                  </div>
                  {option.description && (
                    <p className="text-sm text-gray-600/90 leading-relaxed">
                      {option.description}
                    </p>
                  )}
                </div>

                {/* Bottom Border Indicator */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transition-all duration-300
                               ${
                                 selected
                                   ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                   : 'bg-transparent group-hover:bg-blue-100/50'
                               }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Recalculate points whenever fields change
  useEffect(() => {
    setIsCalculating(true);
    calculatePoints();
    const timer = setTimeout(() => setIsCalculating(false), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    visaSubclass,
    ageRange,
    qualification,
    hasAustQual,
    regionalStudy,
    specialistEdu,
    overseasExp,
    ausExp,
    englishLevel,
    partnerSkill,
    hasNaati,
    hasProfYear,
  ]);

  const calculatePoints = () => {
    let points = 0;

    // 1) Visa Subclass
    switch (visaSubclass) {
      case '189':
        points += 0;
        break;
      case '190':
        points += 5;
        break;
      case '491':
        points += 15;
        break;
    }

    // 2) Age
    switch (ageRange) {
      case '18-24':
        points += 25;
        break;
      case '25-32':
        points += 30;
        break;
      case '33-39':
        points += 25;
        break;
      case '40-44':
        points += 15;
        break;
    }

    // 3) Qualifications
    switch (qualification) {
      case 'qa1':
        points += 20;
        break;
      case 'qa2':
        points += 15;
        break;
      case 'qa3':
        points += 10;
        break;
      case 'qa4':
        points += 0;
        break;
    }

    // 4) Australian Educational Qualification
    if (hasAustQual === 'yes') {
      points += 5;
      if (regionalStudy === 'yes') {
        points += 5;
      }
      if (specialistEdu === 'yes') {
        points += 10;
      }
    }

    // 5) Work Experience - Outside Australia
    switch (overseasExp) {
      case '8':
        points += 15;
        break;
      case '5':
        points += 10;
        break;
      case '3':
        points += 5;
        break;
      default:
        points += 0;
    }

    // 6) Work Experience - Within Australia
    switch (ausExp) {
      case '8':
        points += 20;
        break;
      case '5':
        points += 10;
        break;
      case '3':
      case '1':
        points += 5;
        break;
      default:
        points += 0;
    }

    // 7) English Language Ability
    switch (englishLevel) {
      case 'ce':
        points += 0;
        break;
      case 'pe':
        points += 10;
        break;
      case 'se':
        points += 20;
        break;
    }

    // 8) Partner Skills
    switch (partnerSkill) {
      case 'SkildCoupleNew':
        points += 10;
        break;
      case 'NormalCouple':
        points += 5;
        break;
      case 'single':
        points += 10;
        break;
    }

    // 9) Accredited Community Language
    if (hasNaati === 'yes') {
      points += 5;
    }

    // 10) Professional Year
    if (hasProfYear === 'yes') {
      points += 5;
    }

    setTotalPoints(points);
  };

  // When the user fills out the modal form and clicks submit
  const handleFormSubmit = async (formData: ProspectFormData) => {
    if (formAction === 'pdf') {
      // Handle PDF generation + download
      try {
        console.log('Generating PDF with data:', formData);
        // In a real app, you'd generate or download the PDF here.
        alert('PDF will be generated and downloaded soon!');
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
      }
    } else {
      // Handle sending results via email
      try {
        console.log('Sending email to:', formData.email);
        // In a real app, you'd call an API or service to send the email
        alert(`Results will be sent to ${formData.email} soon!`);
      } catch (error) {
        console.error('Error sending email:', error);
        alert('Failed to send email. Please try again.');
      }
    }
    setShowFormModal(false);
  };

  return (
    <div className="relative space-y-8 w-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-3xl shadow-lg border border-blue-100 p-8 lg:p-10 relative overflow-hidden">
        {/*
          The decorative background must NOT intercept clicks, 
          so add pointer-events-none and a negative z-index.
        */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none -z-10"></div>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
            <Calculator className={`w-6 h-6  ${isCalculating ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GSM Points Calculator</h1>
            <p className="text-sm text-gray-600">
              Calculate your eligibility points for various skilled visas
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={() => {
              setFormAction('pdf');
              setShowFormModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={() => {
              setFormAction('email');
              setShowFormModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Email Results
          </button>
        </div>

        {/* Points Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Circular Progress */}
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
                {isCalculating ? '...' : totalPoints}
              </span>
              <span className="block text-sm text-gray-500">Points</span>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-6 flex flex-col justify-center items-center shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp
                className={`w-6 h-6 ${
                  isCalculating
                    ? 'text-gray-400'
                    : totalPoints >= 65
                    ? 'text-green-600'
                    : 'text-amber-600'
                }`}
              />
              <h3 className="text-lg font-semibold text-gray-900">Status</h3>
            </div>
            {isCalculating ? (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                <span className="font-medium">Calculating...</span>
              </div>
            ) : totalPoints >= 65 ? (
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

      {/* Modal */}
      {showFormModal && (
        <ProspectFormModal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          onSubmit={handleFormSubmit}
          title={formAction === 'pdf' ? 'Download PDF Report' : 'Email Results'}
        />
      )}

      {/* Calculator Form */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-blue-100 p-8 space-y-8 transition-opacity duration-300">
        <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl shadow-lg border border-blue-100 p-8 space-y-8">
          {renderOptions('Visa Subclass', '', Passport, visaSubclass, setVisaSubclass, [
            {
              value: '189',
              label: 'Skilled Independent Visa Subclass 189',
              points: 0,
            },
            {
              value: '190',
              label: 'Skilled Nominated Visa Subclass 190',
              points: 5,
            },
            {
              value: '491',
              label: 'Skilled Work Regional Visa Subclass 491',
              points: 15,
            },
          ])}
          <hr className="border-gray-200" />

          {/* Age */}
          {renderOptions(
            'Age',
            '',
            Users,
            ageRange,
            setAgeRange,
            [
              { value: '18-24', label: '18 to 24', points: 25 },
              { value: '25-32', label: '25 to 32', points: 30 },
              { value: '33-39', label: '33 to 39', points: 25 },
              { value: '40-44', label: '40 to 44', points: 15 },
            ]
          )}
          <hr className="border-gray-200" />

          {/* Qualifications */}
          {renderOptions(
            'Qualifications',
            'What is your highest Qualification?',
            GraduationCap,
            qualification,
            setQualification,
            [
              { value: 'qa1', label: 'A Doctorate Degree (PhD)', points: 20 },
              { value: 'qa2', label: 'A Bachelor Degree', points: 15 },
              { value: 'qa3', label: 'A Diploma / Trade Qualification', points: 10 },
              { value: 'qa4', label: 'No Recognised Qualifications', points: 0 },
            ]
          )}
          <hr className="border-gray-200" />

          {/* Australian Educational Qualification */}
          {(() => {
            const selectedPoints = hasAustQual === 'yes' ? 5 : 0;
            return (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <EducationIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Australian Educational Qualification
                      </h3>
                      <p className="text-sm text-gray-600">
                        Have you completed at least 2 years CRICOS-registered study?
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {selectedPoints} Points
                  </div>
                </div>

                {/* Yes/No Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setHasAustQual('yes');
                      // Reset sub-questions
                      setRegionalStudy('no');
                      setSpecialistEdu('no');
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      hasAustQual === 'yes'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Yes</span>
                      {hasAustQual === 'yes' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setHasAustQual('no');
                      setRegionalStudy('no');
                      setSpecialistEdu('no');
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      hasAustQual === 'no'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">No</span>
                      {hasAustQual === 'no' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                  </button>
                </div>

                {/* If user selected 'Yes' => show sub questions */}
                {hasAustQual === 'yes' && (
                  <div className="space-y-6 mt-4">
                    {/* Sub-question: Regional Study */}
                    {(() => {
                      const subPoints = regionalStudy === 'yes' ? 5 : 0;
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-100">
                                <Globe className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  Regional Study
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Did you live and study in a 'regional and low population
                                  growth metropolitan area' of Australia?
                                </p>
                              </div>
                            </div>
                            <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                              {subPoints} Points
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={() => setRegionalStudy('yes')}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                regionalStudy === 'yes'
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-blue-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">Yes</span>
                                {regionalStudy === 'yes' ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                )}
                              </div>
                            </button>
                            <button
                              onClick={() => setRegionalStudy('no')}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                regionalStudy === 'no'
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-blue-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">No</span>
                                {regionalStudy === 'no' ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                )}
                              </div>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Sub-question: Specialist Education */}
                    {(() => {
                      const subPoints = specialistEdu === 'yes' ? 10 : 0;
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-100">
                                <Award className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  Specialist Education Qualification
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Masters by research or PhD from an Australian institution
                                  (2 academic years in a relevant field)
                                </p>
                              </div>
                            </div>
                            <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                              {subPoints} Points
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={() => setSpecialistEdu('yes')}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                specialistEdu === 'yes'
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-blue-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">Yes</span>
                                {specialistEdu === 'yes' ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                )}
                              </div>
                            </button>
                            <button
                              onClick={() => setSpecialistEdu('no')}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                specialistEdu === 'no'
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-blue-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">No</span>
                                {specialistEdu === 'no' ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                )}
                              </div>
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })()}
          <hr className="border-gray-200" />

          {/* 5) Work Experience - Outside Australia */}
          {renderOptions(
            'Work Experience - Outside Australia',
            '',
            Briefcase,
            overseasExp,
            setOverseasExp,
            [
              { value: '8', label: '8 Years or More', points: 15 },
              { value: '5', label: '5 Years or More', points: 10 },
              { value: '3', label: '3 Years or More', points: 5 },
              { value: '0', label: 'Less than 3 years / No Experience', points: 0 },
            ]
          )}
          <hr className="border-gray-200" />

          {/* 6) Work Experience - Within Australia */}
          {renderOptions(
            'Work Experience - Within Australia',
            '',
            Globe,
            ausExp,
            setAusExp,
            [
              { value: '8', label: '8 Years or More', points: 20 },
              { value: '5', label: '5 Years or More', points: 10 },
              { value: '3', label: '3 Years or More', points: 5 },
              { value: '1', label: '1 Year or More', points: 5 },
              { value: '0', label: 'No Experience', points: 0 },
            ]
          )}
          <hr className="border-gray-200" />

          {/* 7) English Language Ability */}
          {renderOptions(
            'English Language Ability',
            '',
            Languages,
            englishLevel,
            setEnglishLevel,
            [
              { value: 'se', label: 'Superior English', points: 20 },
              { value: 'pe', label: 'Proficient English', points: 10 },
              { value: 'ce', label: 'Competent English', points: 0 },
            ]
          )}
          <hr className="border-gray-200" />

          {/* 8) Partner Skills Points */}
          {renderOptions(
            'Partner Skills Point',
            '',
            UserCheck,
            partnerSkill,
            setPartnerSkill,
            [
              { value: 'SkildCoupleNew', label: 'Spouse meets age/English/skill', points: 10 },
              { value: 'NormalCouple', label: 'Spouse with competent English', points: 5 },
              { value: 'single', label: 'You are single or partner is Aus citizen/PR', points: 10 },
              { value: 'notapplicable', label: 'Not Applicable', points: 0 },
            ]
          )}
          <hr className="border-gray-200" />

          {/* 9) Accredited Community Language */}
          {(() => {
            const selectedPoints = hasNaati === 'yes' ? 5 : 0;
            return (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Globe className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Accredited Community Language
                      </h3>
                      <p className="text-sm text-gray-600">
                        NAATI accreditation at the paraprofessional level or above
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {selectedPoints} Points
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setHasNaati('yes')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      hasNaati === 'yes'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Yes</span>
                      {hasNaati === 'yes' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => setHasNaati('no')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      hasNaati === 'no'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">No</span>
                      {hasNaati === 'no' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            );
          })()}
          <hr className="border-gray-200" />

          {/* 10) Professional Year Program */}
          {(() => {
            const selectedPoints = hasProfYear === 'yes' ? 5 : 0;
            return (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Professional Year Program in Australia
                      </h3>
                      <p className="text-sm text-gray-600">Completed in the past 48 months</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {selectedPoints} Points
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setHasProfYear('yes')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      hasProfYear === 'yes'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Yes</span>
                      {hasProfYear === 'yes' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => setHasProfYear('no')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      hasProfYear === 'no'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">No</span>
                      {hasProfYear === 'no' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-3xl p-6 lg:p-8 mb-24">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="text-sm text-amber-700">
            This is an indicative points calculation only. The{' '}
            <a
              href="https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/points-table"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-800 hover:text-amber-900 underline"
            >
              Department of Home Affairs
            </a>{' '}
            makes the final determination of points claims.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsCalculator;