import { auth } from "../lib/firebase"
import { getPlanFromLocalStorage, isInTrialPeriod, getTrialDaysRemaining } from "./trial-status"

/**
 * Debug function to log trial status information
 * Call this function from any component to see the current trial status
 */
export function debugTrialStatus() {
  if (!auth.currentUser) {
    console.log("Debug Trial Status: No user logged in")
    return
  }

  const userId = auth.currentUser.uid
  const plan = getPlanFromLocalStorage(userId)
  const inTrial = isInTrialPeriod(userId)
  const daysRemaining = getTrialDaysRemaining(userId)

  console.log("=== TRIAL STATUS DEBUG ===")
  console.log("User ID:", userId)
  console.log("Plan:", plan)
  console.log("In Trial Period:", inTrial)
  console.log("Days Remaining:", daysRemaining)

  if (plan?.trialEndDate) {
    console.log("Trial End Date:", new Date(plan.trialEndDate).toLocaleString())
    console.log("Current Date:", new Date().toLocaleString())
    console.log("Time Remaining (ms):", new Date(plan.trialEndDate).getTime() - Date.now())
  }

  console.log("=========================")
}

