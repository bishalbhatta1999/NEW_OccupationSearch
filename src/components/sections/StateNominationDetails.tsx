import React from 'react';
import { FileCheck, Globe, Calendar } from 'lucide-react';

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

interface StateNominationDetailsProps {
  data: StateNominationData;
}

const StateNominationDetails: React.FC<StateNominationDetailsProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Basic Eligibility */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-600" />
          Basic Eligibility
        </h4>
        <ul className="space-y-2">
          {data.basicEligibility.map((requirement, index) => (
            <li key={index} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
              </div>
              <span className="text-gray-600">{requirement}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* English Requirements Table */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">English Test Requirements</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listening</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reading</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Writing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Speaking</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overall</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(data.englishRequirements).map(([test, scores]) => (
                <tr key={test} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{test}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scores.listening}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scores.reading}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scores.writing}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scores.speaking}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scores.overall}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Processing Details</h4>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Fee:</span> {data.additionalDetails.processingFee}
            </p>
            <p className="text-sm">
              <span className="font-medium">Processing Time:</span> {data.additionalDetails.processingTime}
            </p>
            <p className="text-sm">
              <span className="font-medium">Application Process:</span> {data.additionalDetails.applicationProcess}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Statistics</h4>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Software Engineers:</span> {data.additionalDetails.employmentStats.softwareEngineers}
            </p>
            <p className="text-sm">
              <span className="font-medium">Overall Occupations:</span> {data.additionalDetails.employmentStats.overallOccupations}
            </p>
            <p className="text-sm">
              <span className="font-medium">EOI Submissions:</span> {data.additionalDetails.eoiSubmissions}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Last Updated: {data.lastUpdated}</span>
        </div>
        <a
          href={data.referenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <Globe className="w-4 h-4" />
          <span className="text-sm">Official Website</span>
        </a>
      </div>
    </div>
  );
};

export default StateNominationDetails;