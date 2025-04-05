import { db } from "../lib/firebase"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"

interface SubscriptionResult {
  isActive: boolean
  plan: string
  error: string | null
}

export async function checkUserSubscription(userId: string): Promise<SubscriptionResult> {
  try {
    // Default result - standard plan and active
    const defaultResult: SubscriptionResult = {
      isActive: true,
      plan: "standard",
      error: null,
    }

    // Get user document
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      return {
        ...defaultResult,
        error: "User not found",
      }
    }

    const userData = userDoc.data()
    const companyId = userData.companyId

    // If no company ID, return default
    if (!companyId) {
      return defaultResult
    }

    // Get company document
    const companyDoc = await getDoc(doc(db, "companies", companyId))
    if (!companyDoc.exists()) {
      return defaultResult
    }

    const companyData = companyDoc.data()

    // Check if company has a subscription
    if (companyData.subscriptionId) {
      const customerId = companyData.customerId
      if (!customerId) {
        return defaultResult
      }

      // Get subscription document
      const subscriptionsRef = collection(db, "customers", customerId, "subscriptions")
      const subscriptionsQuery = query(subscriptionsRef, where("status", "==", "active"))
      const subscriptionsSnapshot = await getDocs(subscriptionsQuery)

      if (subscriptionsSnapshot.empty) {
        // No active subscription found, use default
        return defaultResult
      }

      // Get the first active subscription
      const subscription = subscriptionsSnapshot.docs[0].data()
      const planId = subscription.items?.[0]?.plan?.id

      // Map plan ID to plan name
      let planName = "standard" // Default to standard
      if (planId) {
        if (planId.includes("basic")) {
          planName = "basic"
        } else if (planId.includes("premium")) {
          planName = "premium"
        } else if (planId.includes("enterprise")) {
          planName = "enterprise"
        }
      }

      return {
        isActive: true,
        plan: planName,
        error: null,
      }
    }

    // If no subscription ID, return default
    return defaultResult
  } catch (error) {
    console.error("Error checking subscription:", error)
    return {
      isActive: true, // Default to active
      plan: "standard", // Default to standard
      error: `Error checking subscription: ${(error as Error).message}`,
    }
  }
}

