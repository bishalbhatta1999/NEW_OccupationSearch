import React from 'react';
import { CreditCard, Star, ArrowUpCircle, CheckCircle2 } from 'lucide-react';
import { subscriptionPlans, type SubscriptionTier } from '../../../types/subscription';
import { updateSubscription } from '../../../lib/subscription';

interface SubscriptionCardProps {
  currentPlan: SubscriptionTier;
  onPlanChange: (plan: SubscriptionTier) => void;
  tenantId: string;
}

export default function SubscriptionCard({ currentPlan, onPlanChange, tenantId }: SubscriptionCardProps) {
  const handleUpgrade = async (plan: SubscriptionTier) => {
    try {
      await updateSubscription(tenantId, plan);
      onPlanChange(plan);
    } catch (error) {
      console.error('Error upgrading plan:', error);
    }
  };

  const currentPlanDetails = subscriptionPlans.find(p => p.id === currentPlan);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Star className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Subscription Plan</h3>
            <p className="text-sm text-gray-600">Manage your subscription and features</p>
          </div>
        </div>
      </div>

      {/* Current Plan */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              {currentPlanDetails?.name || 'Free'} Plan
            </h4>
            <p className="text-sm text-gray-600">
              {currentPlanDetails?.description || 'Basic access for individual users'}
            </p>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            ${currentPlanDetails?.price || 0}
            <span className="text-sm text-gray-500">/mo</span>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-4">Available Plans</h4>
        <div className="grid gap-4">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                currentPlan === plan.id
                  ? 'bg-blue-50 border-blue-200'
                  : 'border-gray-200 hover:border-blue-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h5 className="font-semibold text-gray-900">{plan.name}</h5>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    ${plan.price}
                    <span className="text-sm text-gray-500">/mo</span>
                  </div>
                  {currentPlan === plan.id ? (
                    <span className="inline-flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      Current Plan
                    </span>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      Upgrade
                    </button>
                  )}
                </div>
              </div>

              {/* Feature List */}
              <div className="space-y-2">
                {Object.entries(plan.features).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>
                      {key === 'occupationSearchLimit' && `${value === -1 ? 'Unlimited' : value} searches`}
                      {key === 'savedSearches' && `${value === -1 ? 'Unlimited' : value} saved searches`}
                      {key === 'teamMembers' && `${value === -1 ? 'Unlimited' : value} team members`}
                      {key === 'customAlerts' && value && 'Custom alerts'}
                      {key === 'batchProcessing' && value && 'Batch processing'}
                      {key === 'apiAccess' && value && 'API access'}
                      {key === 'prioritySupport' && value && 'Priority support'}
                      {key === 'customBranding' && value && 'Custom branding'}
                      {key === 'dataExports' && value && 'Data exports'}
                      {key === 'advancedAnalytics' && value && 'Advanced analytics'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <div>
              <h4 className="font-medium text-gray-900">Payment Method</h4>
              <p className="text-sm text-gray-600">Visa ending in 4242</p>
            </div>
          </div>
          <button className="text-blue-600 hover:text-blue-700">
            Update
          </button>
        </div>
      </div>
    </div>
  );
}