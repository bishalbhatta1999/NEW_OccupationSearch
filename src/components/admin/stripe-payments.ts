"use client"
import type { FirebaseApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { addDoc, collection, getDocs, getFirestore, onSnapshot } from "firebase/firestore"
import { getFunctions, httpsCallable } from "firebase/functions"

// Update the getCheckoutUrl function to ensure it redirects back to the dashboard
// Around line 15, modify the function:

export const getCheckoutUrl = async (app: FirebaseApp, priceId: string): Promise<string> => {
  const auth = getAuth(app)
  const userId = auth.currentUser?.uid
  if (!userId) throw new Error("User is not authenticated")

  const db = getFirestore(app)
  const checkoutSessionRef = collection(db, "customers", userId, "checkout_sessions")

  // Calculate trial end date (14 days from now)
  const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

  // Add trial_period_days to the checkout session
  const docRef = await addDoc(checkoutSessionRef, {
    price: priceId,
    success_url: window.location.origin + "/dashboard",
    cancel_url: window.location.origin + "/select-plan",
    trial_period_days: 14, // Set 14-day trial period
    allow_promotion_codes: true,
    metadata: {
      trialPeriod: true,
      trialStartDate: new Date().toISOString(),
      trialEndDate: trialEndDate.toISOString(),
    },
    // This ensures the subscription starts immediately but billing begins after trial
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        trialPeriod: true,
        trialStartDate: new Date().toISOString(),
        trialEndDate: trialEndDate.toISOString(),
      },
    },
  })

  console.log("Created checkout session with trial period:", docRef.id)

  // Also update the user's localStorage with trial information
  const planKey = `selectedPlan_${userId}`
  const storedPlan = localStorage.getItem(planKey)

  if (storedPlan) {
    try {
      const plan = JSON.parse(storedPlan)
      plan.trialPeriod = true
      plan.trialStartDate = new Date().toISOString()
      plan.trialEndDate = trialEndDate.toISOString()
      localStorage.setItem(planKey, JSON.stringify(plan))
    } catch (error) {
      console.error("Error updating plan in localStorage:", error)
    }
  }

  return new Promise<string>((resolve, reject) => {
    const unsubscribe = onSnapshot(docRef, (snap) => {
      const { error, url } = snap.data() as {
        error?: { message: string }
        url?: string
      }
      if (error) {
        unsubscribe()
        reject(new Error(`An error occurred: ${error.message}`))
      }
      if (url) {
        console.log("Stripe Checkout URL:", url)
        unsubscribe()
        resolve(url)
      }
    })
  })
}

const cancelPreviousSubscription = async (app: FirebaseApp, userId: string) => {
  const db = getFirestore(app)
  const subsRef = collection(db, "customers", userId, "subscriptions")
  const subsSnap = await getDocs(subsRef)

  subsSnap.forEach(async (doc) => {
    const sub = doc.data()
    if (sub.status === "trialing" || sub.status === "active") {
      // You can add more logic to detect the lower tier by metadata or price
      const functions = getFunctions(app, "us-central1")
      const cancelFn = httpsCallable(functions, "ext-firestore-stripe-payments-cancelSubscription")
      await cancelFn({ subscriptionId: doc.id })
      console.log("Canceled old subscription:", doc.id)
    }
  })
}

export const watchSubscriptions = (app: FirebaseApp, userId: string) => {
  const db = getFirestore(app)
  const subsRef = collection(db, "customers", userId, "subscriptions")

  const unsubscribe = onSnapshot(subsRef, (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === "added") {
        const newSub = change.doc.data()
        if (newSub.status === "active") {
          console.log("New active subscription detected. Canceling previous ones...")
          await cancelPreviousSubscription(app, userId)
          unsubscribe() // Clean up the listener
        }
      }
    })
  })
}

export const getPaidCheckoutUrl = async (app: FirebaseApp, priceId: string): Promise<string> => {
  const auth = getAuth(app)
  const userId = auth.currentUser?.uid
  if (!userId) throw new Error("User is not authenticated")

  const db = getFirestore(app)
  const checkoutSessionRef = collection(db, "customers", userId, "checkout_sessions")

  // No trial, no trial metadata here
  const docRef = await addDoc(checkoutSessionRef, {
    price: priceId,
    success_url: window.location.origin + "/",
    cancel_url: window.location.origin + "/account",
    allow_promotion_codes: true,
    metadata: {
      upgrade: true,
    },
    subscription_data: {
      metadata: {
        upgrade: true,
      },
    },
  })

  console.log("Created paid checkout session:", docRef.id)

  return new Promise<string>((resolve, reject) => {
    const unsubscribe = onSnapshot(docRef, (snap) => {
      const { error, url } = snap.data() as {
        error?: { message: string }
        url?: string
      }
      if (error) {
        unsubscribe()
        reject(new Error(`An error occurred: ${error.message}`))
      }
      if (url) {
        console.log("Stripe Paid Checkout URL:", url)
        unsubscribe()
        resolve(url)
      }
    })
  })
}

export const getPortalUrl = async (app: FirebaseApp): Promise<string> => {
  const auth = getAuth(app)
  const user = auth.currentUser

  let dataWithUrl: any
  try {
    const functions = getFunctions(app, "us-central1")
    const functionRef = httpsCallable(functions, "ext-firestore-stripe-payments-createPortalLink")
    const { data } = await functionRef({
      customerId: user?.uid,
      returnUrl: window.location.origin,
    })

    // Add a type to the data
    dataWithUrl = data as { url: string }
    console.log("Reroute to Stripe portal: ", dataWithUrl.url)
  } catch (error) {
    console.error(error)
  }

  return new Promise<string>((resolve, reject) => {
    if (dataWithUrl.url) {
      resolve(dataWithUrl.url)
    } else {
      reject(new Error("No url returned"))
    }
  })
}

