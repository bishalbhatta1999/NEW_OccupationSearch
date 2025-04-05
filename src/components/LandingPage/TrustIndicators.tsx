import React, { FC } from 'react';
import { Users, Star, Globe, Award, Shield, CheckCircle } from 'lucide-react';

interface TrustIndicator {
  icon: React.ElementType;
  count: string;
  label: string;
  color: string;
}

const indicators: TrustIndicator[] = [
  {
    icon: Users,
    count: '10,000+',
    label: 'Active Users',
    color: 'blue'
  },
  {
    icon: Star,
    count: '4.9/5',
    label: 'User Rating',
    color: 'yellow'
  },
  {
    icon: Globe,
    count: '190+',
    label: 'Countries Served',
    color: 'green'
  },
  {
    icon: Award,
    count: '95%',
    label: 'Success Rate',
    color: 'purple'
  },
  {
    icon: Shield,
    count: '100%',
    label: 'Data Security',
    color: 'red'
  },
  {
    icon: CheckCircle,
    count: '24/7',
    label: 'Support',
    color: 'indigo'
  }
];

const TrustIndicators: FC = () => {
  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Trusted by Thousands of Professionals
        </h2>
        <p className="text-xl text-gray-600">
          Join our growing community of successful migrants
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
        {indicators.map((indicator, index) => {
          const Icon = indicator.icon;
          return (
            <div
              key={index}
              className="flex flex-col items-center p-6 bg-white rounded-xl border border-gray-200
                       hover:border-blue-200 hover:shadow-lg transition-all duration-300"
            >
              <div className={`p-3 rounded-lg bg-${indicator.color}-100 mb-4`}>
                <Icon className={`w-6 h-6 text-${indicator.color}-600`} />
              </div>
              <span className="text-2xl font-bold text-gray-900 mb-1">{indicator.count}</span>
              <span className="text-sm text-gray-600">{indicator.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrustIndicators;