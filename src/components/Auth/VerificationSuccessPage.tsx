"use client"

import type React from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle } from "lucide-react"

const VerificationSuccessPage: React.FC = () => {
  const navigate = useNavigate()

  const handleGoToLogin = () => {
    // Dispatch a custom event to open the login modal
    const event = new CustomEvent("showAuthModal", { detail: { showLogin: true } })
    window.dispatchEvent(event)

    // Navigate to home page where login modal will appear
    navigate("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Verified Successfully!</h1>

        <p className="text-gray-600 mb-6">
          Your email has been successfully verified. You can now log in to your account to continue.
        </p>

        <button
          onClick={handleGoToLogin}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Login
        </button>
      </div>
    </div>
  )
}

export default VerificationSuccessPage

