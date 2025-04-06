"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "../../lib/firebase"
import { onAuthStateChanged, sendEmailVerification } from "firebase/auth"
import { Loader2, Mail, CheckCircle, RefreshCw, AlertCircle } from "lucide-react"

const VerificationPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [resendDisabled, setResendDisabled] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setLoading(false)

      if (!currentUser) {
        // No user is signed in, redirect to home
        navigate("/")
        return
      }

      setUser(currentUser)

      // If user is already verified, redirect to login
      if (currentUser.emailVerified) {
        // Sign out the user so they can log in again
        auth.signOut().then(() => {
          // Dispatch event to show login modal
          const event = new CustomEvent("showAuthModal", { detail: { showLogin: true } })
          window.dispatchEvent(event)
          navigate("/")
        })
      }
    })

    return () => unsubscribe()
  }, [navigate])

  // Handle countdown for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false)
    }
  }, [countdown, resendDisabled])

  const handleResendVerification = async () => {
    if (!user || resendDisabled) return

    setResendDisabled(true)
    setCountdown(60) // 60 second cooldown
    setResendSuccess(false)
    setError(null)

    try {
      // Configure verification email settings with redirect to verification success page
      const actionSettings = {
        url: `${window.location.origin}/verification-success`,
        handleCodeInApp: false,
      }

      // Send verification email through Firebase Auth
      await sendEmailVerification(user, actionSettings)

      setResendSuccess(true)
    } catch (err) {
      console.error("Error resending verification:", err)
      setError("Failed to resend verification email. Please try again later.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verify Your Email</h1>
          <p className="mt-2 text-gray-600">
            We've sent a verification email to <span className="font-medium">{user?.email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {resendSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Verification email resent successfully!</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Next steps:</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the verification link in the email</li>
              <li>After verification, you'll be directed to log in</li>
              <li>After logging in, you'll be able to select a plan</li>
            </ol>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleResendVerification}
              disabled={resendDisabled}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {resendDisabled ? (
                <>Resend in {countdown}s</>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Resend verification email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerificationPage

