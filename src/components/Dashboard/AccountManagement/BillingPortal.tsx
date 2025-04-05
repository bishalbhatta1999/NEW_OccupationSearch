import React, { useState } from "react";
import { createCheckoutSession } from "../../../lib/subscription";
import { CreditCard, Package, AlertCircle, CheckCircle2 } from "lucide-react";
import { subscriptionPlans } from "../../../types/subscription";
import { useSaas } from "../../SaasProvider";

export default function BillingPortal() {
  const { currentPlan, usage } = useSaas();
  const [loading, setLoading] = useState(false);
  const [error, setError] = (useState < string) | (null > null);

  const handleSubscribe = async (priceId: string) => {
    setLoading(true);
    setError(null);

    try {
      await createCheckoutSession({
        priceId,
        successUrl: `${window.location.origin}/dashboard/account?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/dashboard/account`,
      });
    } catch (err) {
      console.error("Error creating checkout session:", err);
      setError("Failed to initiate checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Current Plan</h3>
              <p className="text-sm text-gray-600">
                {subscriptionPlans.find((p) => p.id === currentPlan)?.name ||
                  "Standard"}
              </p>
            </div>
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900">Usage This Month</p>
            <p className="text-gray-600">
              Searches: {usage.occupationSearches}
            </p>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subscriptionPlans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-200 
                     hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-100">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">{plan.name}</h3>
            </div>

            <div className="mb-4">
              <div className="text-3xl font-bold text-gray-900">
                ${plan.price}
                <span className="text-sm font-normal text-gray-500">/mo</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
            </div>

            <ul className="space-y-3 mb-6">
              {Object.entries(plan.features).map(([key, value]) => (
                <li
                  key={key}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>
                    {key === "occupationSearchLimit" &&
                      `${value === -1 ? "Unlimited" : value} searches`}
                    {key === "savedSearches" &&
                      `${value === -1 ? "Unlimited" : value} saved searches`}
                    {key === "teamMembers" &&
                      `${value === -1 ? "Unlimited" : value} team members`}
                    {key === "customAlerts" && value && "Custom alerts"}
                    {key === "batchProcessing" && value && "Batch processing"}
                    {key === "apiAccess" && value && "API access"}
                    {key === "prioritySupport" && value && "Priority support"}
                    {key === "customBranding" && value && "Custom branding"}
                    {key === "dataExports" && value && "Data exports"}
                    {key === "advancedAnalytics" &&
                      value &&
                      "Advanced analytics"}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading || currentPlan === plan.id}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {/* {currentPlan === plan.id ? 'Current Plan' : 'Subscribe'} */}
              Hello world
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
