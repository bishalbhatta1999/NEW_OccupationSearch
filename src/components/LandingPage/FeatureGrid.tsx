import React, { FC } from 'react';
import { Search, FileCheck, Award, Globe, Clock, Database, Book, Users, Briefcase, GraduationCap } from 'lucide-react';

interface Feature {
  title: string;
  description: string;
  icon: React.ElementType;
}

const features: Feature[] = [
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
  {
    title: 'Industry Insights',
    description: 'Stay updated with the latest trends in technology, healthcare, and more.',
    icon: Book
  },
  {
    title: 'Success Stories',
    description: 'Learn from skilled migrants who successfully moved to Australia.',
    icon: Users
  },
  {
    title: 'Career Guidance',
    description: 'Get expert advice on career pathways and opportunities.',
    icon: Briefcase
  },
  {
    title: 'Educational Resources',
    description: 'Access guides, webinars, and training materials.',
    icon: GraduationCap
  }
];

const FeatureGrid: FC = () => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div
            key={index}
            className="group p-6 bg-white rounded-xl border border-gray-200 shadow-sm 
                     hover:shadow-lg hover:border-blue-200 transition-all duration-300
                     hover:translate-y-[-2px]"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4
                          group-hover:bg-blue-200 transition-colors">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600 leading-relaxed">{feature.description}</p>
          </div>
        );
      })}
    </div>
  );
};

export default FeatureGrid