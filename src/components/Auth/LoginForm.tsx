"use client"

import type React from "react"
import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "../../lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { AlertCircle, Loader2, X } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface LoginFormProps {
  onClose: () => void
  onSuccess: () => void
  initialEmail?: string
}

const LoginForm: React.FC<LoginFormProps> = ({ onClose, onSuccess, initialEmail = "" }) => {
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Check if email is verified
      if (!user.emailVerified) {
        throw new Error("Please verify your email before logging in. Check your inbox for a verification link.")
      }

      // Check if user has selected a plan
      const userDoc = await getDoc(doc(db, "users", user.uid))
      const userData = userDoc.data()

      // Call onSuccess to close modals
      onSuccess()

      // Redirect based on user status
      if (userData?.hasPlan) {
        // User has a plan, redirect to dashboard
        navigate("/dashboard")
      } else {
        // User doesn't have a plan, redirect to plan selection
        navigate("/select-plan")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError(err instanceof Error ? err.message : "Failed to log in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto p-6">
      {/* Close button (X) */}
      <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full">
        <X className="w-5 h-5 text-gray-500" />
      </button>

      <h2 className="text-2xl font-bold mb-4 text-gray-900">Log In</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border rounded-lg px-3 py-2"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border rounded-lg px-3 py-2"
          />
        </div>

        {/* Forgot Password */}
        <div className="text-right">
          <button
            type="button"
            onClick={() => {
              /* Handle forgot password */
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Forgot Password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log In"
          )}
        </button>
      </form>
    </div>
  )
}

export default LoginForm

