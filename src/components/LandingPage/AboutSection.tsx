import React, { FC } from 'react';
import { Target, Users, Award } from 'lucide-react';

interface Value {
  title: string;
  desc: string;
}

const values: Value[] = [
  { title: 'Accuracy', desc: 'Providing precise and verified information' },
  { title: 'Transparency', desc: 'Clear and honest communication' },
  { title: 'Innovation', desc: 'Continuously improving our services' },
  { title: 'Support', desc: 'Dedicated assistance throughout your journey' }
];

const AboutSection: FC = () => {
  return (
    <section className="py-20 px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            About Occupation Search Australia
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We are committed to providing the most reliable and accurate occupation search tool
            for Australian immigration aspirants.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
            <p className="text-gray-600">
              To empower individuals with accurate and up-to-date occupational information,
              making Australian immigration processes easier and more accessible.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Our Team</h3>
            <p className="text-gray-600">
              A dedicated team of career advisors, industry experts, and tech professionals
              committed to supporting your journey.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Our Partners</h3>
            <p className="text-gray-600">
              Collaborating with leading educational institutions, industry bodies, and
              government organizations.
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Values</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">{value.title}</h4>
                <p className="text-gray-600">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;