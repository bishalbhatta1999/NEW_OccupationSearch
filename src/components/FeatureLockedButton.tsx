"use client"

import type React from "react"
import { useState } from "react"
import { Lock } from "lucide-react"

interface FeatureLockedButtonProps {
  onClick: () => void
  isEnabled: boolean
  requiredPlan: string
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
  currentPlan?: string
}

const FeatureLockedButton: React.FC<FeatureLockedButtonProps> = ({
  onClick,
  isEnabled,
  requiredPlan,
  children,
  className = "",
  icon,
  currentPlan,
}) => {
  const [showTooltip, setShowTooltip] = useState(false)

  if (isEnabled) {
    return (
      <button onClick={onClick} className={className}>
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    )
  }

  return (
    <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <button className={`${className} opacity-60 cursor-not-allowed`} disabled>
        {icon && <span className="mr-2">{icon}</span>}
        <span className="flex items-center gap-2">
          {children}
          <Lock className="w-4 h-4" />
        </span>
      </button>

      {showTooltip && (
        <div className="absolute z-50 w-64 p-2 mt-2 text-sm text-white bg-gray-800 rounded-md shadow-lg">
          <p>This feature requires {requiredPlan} plan or higher</p>
          <p className="text-xs mt-1 text-gray-300">Your current plan: {currentPlan || "Free"}</p>
        </div>
      )}
    </div>
  )
}

export default FeatureLockedButton

