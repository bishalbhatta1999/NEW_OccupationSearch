import React, { FC } from 'react';
import { Briefcase, Code, Stethoscope, HardHat, GraduationCap } from 'lucide-react';

interface Industry {
  name: string;
  icon: React.ElementType;
  occupations: string[];
  color: string;
}

const industries: Industry[] = [
  {
    name: 'Information Technology',
    icon: Code,
    occupations: ['Software Engineer', 'Data Analyst', 'IT Support'],
    color: 'blue'
  },
  {
    name: 'Healthcare',
    icon: Stethoscope,
    occupations: ['Nurse', 'Doctor', 'Aged Care Worker'],
    color: 'green'
  },
  {
    name: 'Construction',
    icon: HardHat,
    occupations: ['Electrician', 'Plumber', 'Project Manager'],
    color: 'yellow'
  },
  {
    name: 'Education',
    icon: GraduationCap,
    occupations: ['Teacher', 'Academic Professional'],
    color: 'purple'
  }
];

const OccupationDirectory: FC = () => {
  return (
    <section className="py-20 px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Find Your Occupation
          </h2>
          <p className="text-xl text-gray-600">
            Browse by industry or search directly to access occupation details
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {industries.map((industry, index) => {
            const Icon = industry.icon;
            return (
              <div
                key={index}
                className="group p-6 bg-white rounded-xl border border-gray-200 shadow-sm 
                         hover:shadow-lg hover:border-blue-200 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-lg bg-${industry.color}-100 flex items-center justify-center mb-4
                              group-hover:bg-${industry.color}-200 transition-colors`}>
                  <Icon className={`w-6 h-6 text-${industry.color}-600`} />
                </div>
                <h3 className="text-xl font-semibold mb-4">{industry.name}</h3>
                <ul className="space-y-2">
                  {industry.occupations.map((occupation, i) => (
                    <li key={i} className="text-gray-600 hover:text-gray-900 transition-colors">
                      • {occupation}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default OccupationDirectory;