"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { getPlanFromLocalStorage, isInTrialPeriod, getTrialDaysRemaining } from "../utils/trial-status"

// Define the return type for the hook
interface SubscriptionFeatures {
  featureAccess: {
    visaCalculator: boolean
    prospects: boolean
    documentChecklist: boolean
    widgetIntegration: boolean
    apiAccess: boolean
    reports: boolean
  }
  currentPlan: string
  isTrialPeriod: boolean
  trialDaysRemaining: number | null
}

export function useSubscriptionFeatures(): SubscriptionFeatures {
  const [currentPlan, setCurrentPlan] = useState("free")
  const [isTrialPeriod, setIsTrialPeriod] = useState(false)
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null)

  // Feature access state
  const [featureAccess, setFeatureAccess] = useState({
    visaCalculator: false,
    prospects: false,
    documentChecklist: true,
    widgetIntegration: false,
    apiAccess: false,
    reports: true,
  })

  useEffect(() => {
    async function fetchSubscriptionData() {
      if (!auth.currentUser) return

      // Get user ID
      const userId = auth.currentUser.uid

      try {
        // First check Firestore for subscription data
        const userDocRef = doc(db, "users", userId)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const data = userDoc.data()

          // Check if user has subscription data
          if (data.subscription) {
            const subscriptionData = data.subscription

            // Get plan name and normalize it to lowercase for consistent comparison
            const planName = (subscriptionData.plan || "free").toLowerCase()

            console.log("Detected plan from Firestore:", planName) // Debug log

            // Set current plan with proper capitalization for display
            setCurrentPlan(planName.charAt(0).toUpperCase() + planName.slice(1))

            // Check if this is an active paid subscription (not a trial)
            const isPaidSubscription = subscriptionData.status === "active" && !subscriptionData.trialPeriod

            // Set trial status - only true if explicitly in trial and not expired
            const inTrial =
              !isPaidSubscription &&
              (subscriptionData.status === "trialing" ||
                (subscriptionData.trialPeriod === true &&
                  subscriptionData.trialEndDate &&
                  new Date(subscriptionData.trialEndDate) > new Date()))

            setIsTrialPeriod(inTrial)

            // Calculate trial days remaining if in trial
            if (inTrial && subscriptionData.trialEndDate) {
              const endDate = new Date(subscriptionData.trialEndDate)
              const today = new Date()
              const diffTime = endDate.getTime() - today.getTime()
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
              setTrialDaysRemaining(diffDays > 0 ? diffDays : 0)
            } else {
              setTrialDaysRemaining(null)
            }

            // Set feature access based on plan name
            const planNameLower = planName.toLowerCase()

            // Base features available to all plans
            const baseFeatures = {
              visaCalculator: false,
              prospects: false,
              documentChecklist: true,
              widgetIntegration: false,
              apiAccess: false,
              reports: true,
            }

            // Standard plan features
            if (planNameLower === "standard" || planNameLower === "premium" || planNameLower === "enterprise") {
              baseFeatures.widgetIntegration = true
            }

            // Premium plan features
            if (planNameLower === "premium" || planNameLower === "enterprise") {
              baseFeatures.visaCalculator = true
            }

            // Enterprise plan features
            if (planNameLower === "enterprise") {
              baseFeatures.prospects = true
              baseFeatures.apiAccess = true
            }

            console.log("Feature access set:", baseFeatures) // Debug log
            setFeatureAccess(baseFeatures)
            return
          }
        }

        // Fallback to localStorage if no Firestore data
        const plan = getPlanFromLocalStorage(userId)

        if (plan) {
          // Set current plan
          const planName = plan.name.toLowerCase()
          console.log("Detected plan from localStorage:", planName) // Debug log
          setCurrentPlan(planName.charAt(0).toUpperCase() + planName.slice(1))

          // Set trial status using utility functions
          const inTrial = isInTrialPeriod(userId)
          setIsTrialPeriod(inTrial)

          // Set trial days remaining
          const daysRemaining = getTrialDaysRemaining(userId)
          setTrialDaysRemaining(daysRemaining)

          // Base features available to all plans
          const baseFeatures = {
            visaCalculator: false,
            prospects: false,
            documentChecklist: true,
            widgetIntegration: false,
            apiAccess: false,
            reports: true,
          }

          // Standard plan features
          if (planName === "standard" || planName === "premium" || planName === "enterprise") {
            baseFeatures.widgetIntegration = true
          }

          // Premium plan features
          if (planName === "premium" || planName === "enterprise") {
            baseFeatures.visaCalculator = true
          }

          // Enterprise plan features
          if (planName === "enterprise") {
            baseFeatures.prospects = true
            baseFeatures.apiAccess = true
          }

          console.log("Feature access set from localStorage:", baseFeatures) // Debug log
          setFeatureAccess(baseFeatures)
        } else {
          // Set default free plan if no plan is found
          setCurrentPlan("Free")
          setIsTrialPeriod(false)
          setTrialDaysRemaining(null)

          // Set basic features for free plan
          setFeatureAccess({
            visaCalculator: false,
            prospects: false,
            documentChecklist: true,
            widgetIntegration: false,
            apiAccess: false,
            reports: true,
          })
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error)
        // Set defaults in case of error
        setCurrentPlan("Free")
        setFeatureAccess({
          visaCalculator: false,
          prospects: false,
          documentChecklist: true,
          widgetIntegration: false,
          apiAccess: false,
          reports: true,
        })
      }
    }

    // Force a re-fetch every time the component mounts
    fetchSubscriptionData()

    // Also set up a timer to re-fetch every 5 seconds
    const intervalId = setInterval(fetchSubscriptionData, 5000)

    // Clear the interval when the component unmounts
    return () => clearInterval(intervalId)
  }, [auth.currentUser?.uid])

  return { featureAccess, currentPlan, isTrialPeriod, trialDaysRemaining }
}

