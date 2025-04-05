import { initializeApp } from "firebase/app"
import {
  getAuth,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  type User,
} from "firebase/auth"
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getFunctions } from "firebase/functions"

// Your web app's Firebase configuration

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const functions = getFunctions(app)
const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()

/**
 * Set custom claims for a user based on their role and tenant.
 * This should be called after user creation/update.
 */
const setCustomClaims = async (user: User) => {
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid))
    if (!userDoc.exists()) return

    const userData = userDoc.data()
    const claims: Record<string, any> = {
      role: userData.role || "user",
    }

    // Add tenantId if user has one
    if (userData.tenantId) {
      claims.tenantId = userData.tenantId
    }

    // Force token refresh to get new claims
    try {
      await user.getIdToken(true)
    } catch (err) {
      console.warn("Error refreshing token:", err)
    }
  } catch (error) {
    console.error("Error setting custom claims:", error)
  }
}

/**
 * getUserClaims - Retrieves custom claims from the user's ID token.
 */
export const getUserClaims = async (user: User) => {
  try {
    const tokenResult = await user.getIdTokenResult(true)
    return tokenResult.claims
  } catch (error) {
    console.error("Error getting user claims:", error)
    return {}
  }
}

/**
 * isUserAdmin - Checks if a user has admin privileges by reading their Firestore document.
 * Note: For your security rules to work as written (using request.auth.token.admin),
 * you must set the custom claim "admin" on the user's token.
 */
export const isUserAdmin = async (user: User): Promise<boolean> => {
  if (!user || !user.email) return false
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid))
    if (!userDoc.exists()) return false
    const userData = userDoc.data()
    return userData.isAdmin === true
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

// Helper function to sign out
const signOutUser = () => signOut(auth)

/**
 * checkAdminStatus - Checks if the user (by uid) is marked as admin in Firestore.
 */
export const checkAdminStatus = async (uid: string): Promise<boolean> => {
  if (!uid) return false
  try {
    const userDoc = await getDoc(doc(db, "users", uid))
    return userDoc.exists() && userDoc.data().isAdmin === true
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

/**
 * signInWithGoogle - Signs in using Google and creates/updates the user document.
 */
export const signInWithGoogle = async () => {
  try {
    // Configure Google provider with custom parameters
    googleProvider.setCustomParameters({
      prompt: "select_account",
    })

    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user

    const userDocRef = doc(db, "users", user.uid)
    const userDoc = await getDoc(userDocRef)
    const isNewUser = !userDoc.exists()

    if (isNewUser) {
      // Create new user document
      await setDoc(userDocRef, {
        userId: `OS${Date.now().toString().slice(-6)}`,
        firstName: user.displayName?.split(" ")[0] || "",
        lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
        email: user.email || "",
        role: "user",
        permissions: ["read"],
        createdAt: new Date().toISOString(),
        emailVerified: true, // Google users are always verified
        lastSignInAt: new Date().toISOString(),
      })
    } else {
      // Update existing user document
      await updateDoc(userDocRef, {
        emailVerified: true,
        lastSignInAt: new Date().toISOString(),
      })
    }

    // Set custom claims
    try {
      await setCustomClaims(user)
    } catch (error) {
      console.warn("Error setting custom claims:", error)
      // Don't throw - this is non-critical
    }

    return user
  } catch (error) {
    console.error("Error signing in with Google:", error)
    // Re-throw specific errors we want to handle
    if (error.code === "auth/popup-blocked") {
      throw new Error("Popup was blocked. Please allow popups and try again.")
    }
    if (error.code === "auth/cancelled-popup-request") {
      throw new Error("Sign in was cancelled.")
    }
    if (error.code === "auth/api-key-not-valid") {
      throw new Error("Invalid API key. Please check your Firebase configuration.")
    }
    throw error
  }
}

/**
 * signInWithEmail - Signs in a user with email and password.
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    const user = result.user
    // Set custom claims
    await setCustomClaims(user)
    return user
  } catch (error) {
    console.error("Error signing in with email and password:", error)
    throw error
  }
}

// Helper function to check if a user is a super admin
const isSuperAdmin = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    const userData = userDoc.data()
    return userData?.role === "superAdmin"
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

export { app, auth, db, functions, storage, signOutUser, isSuperAdmin }



