import React, { useState } from 'react';
import { Check, CreditCard, ArrowRight } from 'lucide-react'; 
import { subscriptionPlans } from '@/types/subscription'; // Import subscription plans

interface PricingPageProps {
  onSignInClick: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onSignInClick }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Helper function to calculate adjusted price for yearly billing
  const getAdjustedPrice = (basePrice: number) => {
    return billingCycle === 'annual' ? (basePrice * 10).toFixed(2) : basePrice.toFixed(2);
  };

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Page Header */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-6">
            Find the Right Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Flexible pricing that grows with your occupation search needs. All plans include a 15-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="mt-12 inline-flex items-center p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                billingCycle === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Billed Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                billingCycle === 'annual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Billed Annually
              <span className="ml-2 text-sm text-green-600 font-medium">2 Months FREE</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border ${
                plan.id === 'enterprise' ? 'border-blue-200 shadow-xl scale-105' : 'border-gray-200 shadow-lg'
              }`}
            >
              {plan.id === 'enterprise' && (
                <div className="absolute -top-5 left-0 right-0 mx-auto w-fit px-4 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-full">
                  Recommended
                </div>
              )}

              <div className="p-6"> {/* Reduced padding here */}
                {/* Plan Header */}
                <div className="text-center mb-6"> {/* Reduced margin here */}
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline justify-center gap-2"> {/* Reduced margin here */}
                    <span className="text-4xl font-bold">A${getAdjustedPrice(plan.price)}</span>
                    <span className="text-gray-500">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                </div>

                {/* Features List */}
                <div className="space-y-3"> {/* Reduced spacing here */}
                  <p className="text-sm font-semibold text-gray-900">Key Features</p>
                  <ul className="space-y-3 max-h-48 overflow-y-auto"> {/* Added scrollable container */}
                    {Object.entries(plan.features).map(([feature, value]) => {
                      if (!value || value === 0) return null;
                      return (
                        <li key={feature} className="flex items-start gap-3 text-sm">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-600">{feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  className="mt-6 w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:-translate-y-0.5"
                    onClick={onSignInClick}
                >
                  <CreditCard className="w-5 h-5" />
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
