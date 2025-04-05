"use client"

import type React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"

interface PlanUpgradeBannerProps {
  currentPlan?: string
  requiredPlan: string
}

const PlanUpgradeBanner: React.FC<PlanUpgradeBannerProps> = ({ currentPlan = "Standard", requiredPlan }) => {
  const navigate = useNavigate()

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Upgrade to {requiredPlan} to unlock this feature</h3>
          <p className="text-gray-600">
            You're currently on the {currentPlan} plan. Upgrade to access all premium features.
          </p>
        </div>
        <button
          onClick={() => navigate("/select-plan")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          Upgrade Now
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default PlanUpgradeBanner

