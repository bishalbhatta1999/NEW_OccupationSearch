// This utility handles checking and managing trial status

// Add this import at the top of the file:
import { db } from "../lib/firebase"
import { doc, getDoc } from "firebase/firestore"

/**
 * Get the selected plan from localStorage for a specific user
 * @param userId The user ID to get the plan for
 * @returns The plan object or null if not found
 */
export function getPlanFromLocalStorage(userId: string) {
  try {
    const planKey = `selectedPlan_${userId}`
    const storedPlan = localStorage.getItem(planKey)

    if (!storedPlan) {
      return null
    }

    return JSON.parse(storedPlan)
  } catch (error) {
    console.error("Error getting plan from localStorage:", error)
    return null
  }
}

// Add a new function to get plan from Firestore:
/**
 * Get the selected plan from Firestore for a specific user
 * @param userId The user ID to get the plan for
 * @returns The plan object or null if not found
 */
export async function getPlanFromFirestore(userId: string) {
  try {
    if (!userId) return null

    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) return null

    const userData = userDoc.data()
    if (!userData.subscription) return null

    return userData.subscription
  } catch (error) {
    console.error("Error getting plan from Firestore:", error)
    return null
  }
}

// Modify the isTrialExpired function to check Firestore first:
/**
 * Check if a user's trial has expired
 * @param userId The user ID to check
 * @returns True if trial has expired, false otherwise
 */
export async function isTrialExpiredAsync(userId: string): Promise<boolean> {
  // First check Firestore
  const firestorePlan = await getPlanFromFirestore(userId)

  if (firestorePlan) {
    // If it's not a trial period, it can't be expired
    if (!firestorePlan.trialPeriod) {
      return false
    }

    // Check if trial end date exists and is valid
    if (!firestorePlan.trialEndDate) {
      return true // No end date means expired
    }

    const trialEndDate = new Date(firestorePlan.trialEndDate)
    const now = new Date()

    // Return true if trial has expired
    return now > trialEndDate
  }

  // Fall back to localStorage if no Firestore data
  const localPlan = getPlanFromLocalStorage(userId)

  if (!localPlan) {
    return true // No plan means no active trial
  }

  // If it's not a trial period, it can't be expired
  if (!localPlan.trialPeriod) {
    return false
  }

  // Check if trial end date exists and is valid
  if (!localPlan.trialEndDate) {
    return true // No end date means expired
  }

  const trialEndDate = new Date(localPlan.trialEndDate)
  const now = new Date()

  // Return true if trial has expired
  return now > trialEndDate
}

// Keep the synchronous version for backward compatibility
export function isTrialExpired(userId: string): boolean {
  const localPlan = getPlanFromLocalStorage(userId)

  if (!localPlan) {
    return true // No plan means no active trial
  }

  // If it's not a trial period, it can't be expired
  if (!localPlan.trialPeriod) {
    return false
  }

  // Check if trial end date exists and is valid
  if (!localPlan.trialEndDate) {
    return true // No end date means expired
  }

  const trialEndDate = new Date(localPlan.trialEndDate)
  const now = new Date()

  // Return true if trial has expired
  return now > trialEndDate
}

/**
 * Get the number of days remaining in the trial
 * @param userId The user ID to check
 * @returns Number of days remaining or null if not in trial
 */
export function getTrialDaysRemaining(plan: any): number | null {
  if (!plan || !plan.trialPeriod) {
    return null
  }

  // If we have a trialEndDate from Stripe, use that
  if (plan.trialEndDate) {
    const trialEndDate = new Date(plan.trialEndDate)
    const now = new Date()

    // If trial has expired, return 0
    if (now > trialEndDate) {
      return 0
    }

    // Calculate days remaining
    const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, daysRemaining)
  }

  // If we can't determine days remaining but know it's a trial, return a default
  return 14
}

// Update the isInTrialPeriod function to check Firestore first
export async function isInTrialPeriodAsync(userId: string): Promise<boolean> {
  // First check Firestore
  const firestorePlan = await getPlanFromFirestore(userId)

  if (firestorePlan) {
    // If it's not marked as a trial period, return false
    if (!firestorePlan.trialPeriod) {
      return false
    }

    // If status is "active" (not "trialing"), it's not in trial
    if (firestorePlan.status === "active") {
      return false
    }

    // Check if trial end date exists and is valid
    if (!firestorePlan.trialEndDate) {
      return false // No end date means not in trial
    }

    const trialEndDate = new Date(firestorePlan.trialEndDate)
    const now = new Date()

    // Return true if trial is still active
    return now < trialEndDate
  }

  // Fall back to localStorage
  return isInTrialPeriod(userId)
}

// Update the synchronous version to also check for status
export function isInTrialPeriod(userId: string): boolean {
  const plan = getPlanFromLocalStorage(userId)

  if (!plan) {
    return false
  }

  // If it's not marked as a trial period, return false
  if (!plan.trialPeriod) {
    return false
  }

  // If status is "active" (not "trialing"), it's not in trial
  if (plan.status === "active") {
    return false
  }

  // Check if trial end date exists and is valid
  if (!plan.trialEndDate) {
    return false // No end date means not in trial
  }

  const trialEndDate = new Date(plan.trialEndDate)
  const now = new Date()

  // Return true if trial is still active
  return now < trialEndDate
}

/**
 * Get the theme colors based on subscription status
 * @param userId The user ID to check
 * @returns Object with theme color classes
 */
export function getThemeColors(userId: string) {
  const plan = getPlanFromLocalStorage(userId)

  // Default theme (no subscription)
  let theme = {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-200",
    button: "bg-blue-600 hover:bg-blue-700",
    highlight: "bg-blue-100",
    highlightText: "text-blue-800",
    tableHeader: "bg-gray-50",
    tableHighlight: "bg-gray-100 text-gray-800",
  }

  if (plan) {
    const planName = plan.name?.toLowerCase() || ""

    if (plan.trialPeriod) {
      // Trial theme (orange/amber)
      theme = {
        bg: "bg-amber-50",
        text: "text-amber-800",
        border: "border-amber-300",
        button: "bg-amber-600 hover:bg-amber-700",
        highlight: "bg-amber-100",
        highlightText: "text-amber-800",
        tableHeader: "bg-amber-50",
        tableHighlight: "bg-amber-100 text-amber-800",
      }
    } else if (planName.includes("premium")) {
      // Premium theme (green)
      theme = {
        bg: "bg-green-50",
        text: "text-green-800",
        border: "border-green-300",
        button: "bg-green-600 hover:bg-green-700",
        highlight: "bg-green-100",
        highlightText: "text-green-800",
        tableHeader: "bg-green-50",
        tableHighlight: "bg-green-100 text-green-800",
      }
    } else if (planName.includes("enterprise")) {
      // Enterprise theme (purple)
      theme = {
        bg: "bg-purple-50",
        text: "text-purple-800",
        border: "border-purple-300",
        button: "bg-purple-600 hover:bg-purple-700",
        highlight: "bg-purple-100",
        highlightText: "text-purple-800",
        tableHeader: "bg-purple-50",
        tableHighlight: "bg-purple-100 text-purple-800",
      }
    } else if (planName.includes("standard")) {
      // Standard theme (blue)
      theme = {
        bg: "bg-blue-50",
        text: "text-blue-800",
        border: "border-blue-300",
        button: "bg-blue-600 hover:bg-blue-700",
        highlight: "bg-blue-100",
        highlightText: "text-blue-800",
        tableHeader: "bg-blue-50",
        tableHighlight: "bg-blue-100 text-blue-800",
      }
    }
  }

  return theme
}

