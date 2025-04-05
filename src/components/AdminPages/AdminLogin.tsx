"use client"

import type React from "react"
import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "../../lib/firebase"
import { useNavigate } from "react-router-dom"
import { AlertCircle, Loader2, Lock } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Attempt to sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      // Check if the user is a super admin
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))
      const userData = userDoc.data()

      if (!userData || userData.role !== "superAdmin") {
        // Sign out if not a super admin
        await auth.signOut()
        setError("Access denied. Only super admins can access this portal.")
        console.log("not valid")
        setLoading(false)
        return
      }

      console.log("Admin login successful, redirecting to dashboard")
      // Redirect to admin dashboard
      navigate("/admin/dashboard", { replace: true })
    } catch (err: any) {
      console.error("Admin login error:", err)
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid admin credentials. Please try again.")
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.")
      } else {
        setError("An error occurred during login. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Portal</h2>
            <p className="text-gray-600 mt-1">Sign in to access the SaaS admin dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">This portal is restricted to authorized administrators only.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin

 