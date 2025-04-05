import React from 'react';
import { Search, FileCheck, Award, Globe, Clock, Database } from 'lucide-react';

const features = [
  {
    title: 'Accurate ANZSCO Search',
    description: 'Find your exact occupation code with our smart search system.',
    icon: Search
  },
  {
    title: 'Visa Eligibility',
    description: 'Check your eligibility for various Australian visas.',
    icon: FileCheck
  },
  {
    title: 'Skills Assessment',
    description: 'Get detailed information about skills assessment requirements.',
    icon: Award
  },
  {
    title: 'State Nominations',
    description: 'Explore state and territory nomination opportunities.',
    icon: Globe
  },
  {
    title: 'Real-time EOI Data',
    description: 'Access current Expression of Interest round information.',
    icon: Clock
  },
  {
    title: 'Comprehensive Database',
    description: 'Access detailed occupation descriptions and requirements.',
    icon: Database
  },
];

const FeatureGrid = () => {
  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div
            key={index}
            className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300
                       hover:translate-y-[-2px]"
          >
            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
              <Icon className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600 leading-relaxed">{feature.description}</p>
          </div>
        );
      })}
    </div>
  );
};

export default FeatureGrid;