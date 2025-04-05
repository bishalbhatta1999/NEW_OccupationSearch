"use client"

import type React from "react"
import { AlertCircle, Clock } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useSubscriptionFeatures } from "../hooks/useSubscriptionFeatures"

type TrialBannerProps = {}

// Update the TrialBanner component to only show during trial period
export const TrialBanner: React.FC<TrialBannerProps> = () => {
  const navigate = useNavigate()
  const { isTrialPeriod, trialDaysRemaining } = useSubscriptionFeatures()

  // Don't show the banner if not in trial period
  if (!isTrialPeriod || trialDaysRemaining === null) return null

  // Determine urgency level
  const isUrgent = trialDaysRemaining <= 3
  const isWarning = trialDaysRemaining <= 7

  // Set styles based on urgency
  const bgColor = isUrgent ? "bg-red-50" : isWarning ? "bg-amber-50" : "bg-blue-50"
  const borderColor = isUrgent ? "border-red-200" : isWarning ? "border-amber-200" : "border-blue-200"
  const textColor = isUrgent ? "text-red-800" : isWarning ? "text-amber-800" : "text-blue-800"
  const buttonBg = isUrgent
    ? "bg-red-600 hover:bg-red-700"
    : isWarning
      ? "bg-amber-600 hover:bg-amber-700"
      : "bg-blue-600 hover:bg-blue-700"

  return (
    <div className={`${bgColor} ${borderColor} border-l-4 p-4 mb-4 rounded-md`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {isUrgent ? (
            <AlertCircle
              className={`h-5 w-5 ${isUrgent ? "text-red-600" : isWarning ? "text-amber-600" : "text-blue-600"}`}
            />
          ) : (
            <Clock
              className={`h-5 w-5 ${isUrgent ? "text-red-600" : isWarning ? "text-amber-600" : "text-blue-600"}`}
            />
          )}
        </div>
        <div className="ml-3 flex-1 md:flex md:justify-between">
          <p className={`text-sm ${textColor}`}>
            {isUrgent ? (
              <strong>
                Your trial expires in {trialDaysRemaining} {trialDaysRemaining === 1 ? "day" : "days"}! Upgrade now to
                avoid service interruption.
              </strong>
            ) : isWarning ? (
              <span>
                Your trial will expire in {trialDaysRemaining} days. Consider upgrading to continue using all features.
              </span>
            ) : (
              <span>You're currently in a trial period with {trialDaysRemaining} days remaining.</span>
            )}
          </p>
          <div className="mt-3 md:mt-0 md:ml-6">
            <button
              onClick={() => navigate("/dashboard/account")}
              className={`whitespace-nowrap rounded-md ${buttonBg} px-3 py-2 text-sm font-medium text-white shadow-sm`}
            >
              {isUrgent ? "Upgrade Now" : "View Plans"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrialBanner

