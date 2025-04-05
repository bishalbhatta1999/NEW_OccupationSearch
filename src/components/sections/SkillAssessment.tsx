import React, { useState, useCallback } from 'react';
import {
  Building2,
  Clock,
  Award,
  ExternalLink,
  FileCheck,
  GraduationCap,
  Globe,
  DollarSign,
  AlertCircle,
  Users,
  ListOrdered
} from 'lucide-react';
import SkillApiFetcher, { SkillApiResponse, AuthorityItem } from '../SkillApiFetcher';

interface ApiError {
  message: string;
  status?: number;
}

interface SkillAssessmentProps {
  content?: any;
  occupationCode: string;
}

/**
 * Main component that fetches + displays skill assessment data.
 */
const SkillAssessment: React.FC<SkillAssessmentProps> = ({
  content,
  occupationCode
}) => {
  const [apiData, setApiData] = useState<SkillApiResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  // Active UI states:
  const [activeTab, setActiveTab] = useState<'overview' | 'process'>('overview');
  const [activeAuthority, setActiveAuthority] = useState<AuthorityItem | null>(null);

  const handleDataFetched = useCallback((data: SkillApiResponse) => {
    setApiData(data);
    setError(null);

    // If we have multiple authorities, pick the first as active
    if (data.authorities.length > 0) {
      setActiveAuthority(data.authorities[0]);
    }
  }, []);

  const handleError = useCallback((err: ApiError) => {
    setError(err);
    setApiData(null);
  }, []);

  if (error) {
    return (
      <section className="bg-white rounded-xl shadow-lg border border-blue-100 p-8">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error.message}. Please try again later.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
      {/* The (invisible) fetcher that calls the API */}
      <SkillApiFetcher
        occupationCode={occupationCode}
        onDataFetched={handleDataFetched}
        onError={handleError}
      />

      {/* Loading indicator while data is not yet fetched */}
      {!apiData && !error && (
        <div className="p-8 text-sm text-gray-600">
          Loading Skill Assessment data...
        </div>
      )}

      {/* Once data is loaded, display it */}
      {apiData && (
        <>
          {/* Header */}
          <div className="relative p-8 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 border-b border-blue-100 overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full opacity-5 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-200 rounded-full opacity-5 translate-y-1/2 -translate-x-1/2"></div>
            
            {/* Header Content */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-100">
                <div className="relative">
                  <Award className="w-6 h-6 text-blue-600 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">Skills Assessment</h3>
                <p className="text-sm text-gray-600">Requirements and process information</p>
              </div>
              
              {/* Official Links - Top Right */}
              {activeAuthority?.link && activeAuthority.link !== '#' && (
                <a
                  href={activeAuthority.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg
                           text-blue-600 hover:text-blue-700 border border-blue-200
                           hover:border-blue-300 transition-all duration-200 group shadow-sm"
                >
                  <Globe className="w-4 h-4" />
                  Official Website
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </a>
              )}
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
              <span>Skills Assessment</span>
              <span className="text-gray-400">/</span>
              <span className="text-blue-600 font-medium">{activeAuthority?.fullName || 'Select Authority'}</span>
            </div>

            {/* Authority Selection Pills */}
            {apiData.authorities.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-8">
                {apiData.authorities.map((auth, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveAuthority(auth)}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl border transition-all duration-300
                      ${auth === activeAuthority
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-lg transform hover:shadow-xl hover:-translate-y-1'
                        : 'border-blue-200 bg-white/80 backdrop-blur-sm text-blue-600 hover:bg-blue-50/80 hover:border-blue-300 hover:shadow-md'
                      }`}
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">{auth.fullName}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="inline-flex p-1 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-sm">
              {[
                { id: 'overview', label: 'Overview', icon: GraduationCap },
                { id: 'process', label: 'Process', icon: Clock }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as typeof activeTab)}
                  className={`flex items-center gap-2 px-8 py-3 rounded-lg transition-all duration-300 ${
                    activeTab === id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform -translate-y-0.5'
                      : 'text-gray-600 hover:bg-white/50 hover:shadow'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Section */}
          {activeAuthority && (
            <div className="p-8 animate-fadeIn">
              {activeTab === 'overview' && <OverviewTab authority={activeAuthority} />}
              {activeTab === 'process' && <ProcessTab authority={activeAuthority} />}
            </div>
          )}
        </>
      )}
    </section>
  );
};

const OverviewTab: React.FC<{ authority: AuthorityItem }> = ({ authority }) => {
  return (
    <div className="space-y-6">
      {/* Authority Card */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col space-y-4">
          {/* Authority Info */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Assessing Authority</h4>
              <p className="text-sm text-blue-600 font-medium">
                {authority.fullName} ({authority.shortCode})
              </p>
            </div>
          </div>

          {/* Fees Section */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Assessment Fees</h4>
              {authority.modeOfApplication && (
                <p className="text-sm text-green-600 mb-2">
                  Mode of Application: <b>{authority.modeOfApplication}</b>
                </p>
              )}

              {Array.isArray(authority.fees) && authority.fees.length > 0 ? (
                <div className="space-y-2">
                  {authority.fees.map((fee, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-700">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span>{fee}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700">Contact authority for current fees</p>
              )}

              {authority.feesLink && authority.feesLink !== '#' && (
                <a
                  href={authority.feesLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white rounded-lg 
                           text-green-600 hover:text-green-700 border border-green-200 
                           hover:border-green-300 transition-all duration-200"
                >
                  <DollarSign className="w-4 h-4" />
                  View Fee Schedule
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Requirements Section */}
          {authority.requirements && authority.requirements.length > 0 && (
            <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
              <div className="p-2 rounded-lg bg-purple-100">
                <FileCheck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
                <ul className="space-y-2">
                  {authority.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-700">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Official Website Link */}
          <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
            <div className="p-2 rounded-lg bg-blue-100">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Official Site</h4>
              {authority.link && authority.link !== '#' ? (
                <a
                  href={authority.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg
                         text-blue-600 hover:text-blue-700 border border-blue-200
                         hover:border-blue-300 transition-all duration-200 group"
                >
                  Visit Assessing Authority
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              ) : (
                <p className="text-gray-700">No official link provided.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Processing Timeline Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-xl border border-blue-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-blue-100/50 backdrop-blur-sm">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Assessment Timeline</h4>
            <p className="text-sm text-gray-600">Current processing details and timeline</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Processing Time */}
          <div className="relative bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 p-6 overflow-hidden">
            {/* Decorative progress bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 animate-progressBar" style={{ width: '75%' }}></div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Processing Time</span>
              </div>
              <span className="px-4 py-2 bg-blue-100/50 text-blue-700 rounded-lg text-sm font-medium animate-pulse">
                {authority.processingTime || 'Not specified'}
              </span>
            </div>
            
            {/* Processing stages */}
            <div className="mt-6 grid grid-cols-4 gap-4">
              {['Submitted', 'In Review', 'Assessment', 'Complete'].map((stage, idx) => (
                <div key={idx} className={`text-center ${idx <= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 
                                ${idx <= 2 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    {idx + 1}
                  </div>
                  <span className="text-sm font-medium">{stage}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Application Steps */}
          {authority.modeOfApplication && (
            <div className="mt-8 space-y-6">
              <h5 className="font-medium text-gray-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                Application Process
              </h5>
              <div className="relative space-y-6 pl-8 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-40px)] before:w-0.5 before:bg-blue-200">
                {[1, 2, 3, 4].map((step, idx) => (
                  <div
                    key={idx}
                    className="relative bg-white rounded-xl p-6 border border-blue-100 hover:border-blue-200 
                             transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1"
                  >
                    <div className="absolute -left-10 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center 
                                text-blue-600 font-medium border-2 border-white shadow-md">
                      {step}
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {step === 1 && `Review the official guidelines and checklists from ${authority.fullName}.`}
                      {step === 2 && `Gather your documents and ensure they align with the stated requirements.`}
                      {step === 3 && `Submit an application (${authority.modeOfApplication}). Fees may apply.`}
                      {step === 4 && `Await the outcome. Approx. time: ${authority.processingTime}.`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** The "Process" tab – show a more detailed timeline or instructions. */
const ProcessTab: React.FC<{ authority: AuthorityItem }> = ({ authority }) => {
  // Example 4-step process referencing some authority fields:
  const steps = [
    {
      title: 'Check Official Guidelines',
      description: `Read the official guidelines from ${authority.fullName}.`,
      link: authority.guidelineLink
    },
    {
      title: 'Gather Documents',
      description: 'Compile all required documents per the authority checklist.',
      link: authority.checklistLink
    },
    {
      title: 'Submit Application',
      description: `Complete the form (${authority.modeOfApplication || 'Online'}) and pay any required fees.`,
      link: authority.feesLink
    },
    {
      title: 'Wait for Outcome',
      description: `Processing typically takes ${authority.processingTime || 'an unknown duration'}.`,
      link: ''
    }
  ];

  return (
    <div className="space-y-8">
      {/* Example timeline or step‐by‐step layout */}
      <div className="bg-gradient-to-br from-white to-blue-50/30 p-8 border border-blue-100 rounded-xl space-y-8">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-blue-600" />
          Detailed Process Steps
        </h4>

        <ol className="relative space-y-8 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-40px)] before:w-0.5 before:bg-blue-200">
          {steps.map((step, idx) => (
            <li key={idx} className="relative pl-10">
              <div className="absolute left-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium border-2 border-white shadow-md">
                {idx + 1}
              </div>
              <div className="bg-white p-6 rounded-xl border border-blue-100 hover:border-blue-200 transition-all duration-300 shadow-sm hover:shadow-md">
                <h5 className="font-semibold text-gray-900 mb-2">{step.title}</h5>
                <p className="text-gray-700 mb-3">{step.description}</p>
                {step.link && step.link !== '#' && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    View Details
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
      
      {/* Additional Resources */}
      <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <p className="text-sm text-amber-700">
            Processing times and requirements may vary. Always verify current information on the{' '}
            <a
              href={authority.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-800 hover:text-amber-900 underline"
            >
              official website
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default SkillAssessment;