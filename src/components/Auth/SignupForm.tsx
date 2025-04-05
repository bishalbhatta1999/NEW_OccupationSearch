"use client"

import type React from "react"
import { useState } from "react"
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth"
import { doc, setDoc, collection, getDocs, addDoc, query, where } from "firebase/firestore"
import { auth, db } from "../../lib/firebase"
import { AlertCircle, Loader2, X } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface SignupFormProps {
  onClose: () => void
  onSuccess: () => void
}

const SignupForm: React.FC<SignupFormProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    companyRegisteredName: "",
    businessName: "",
    companyDomain: "",
    adminEmail: "",
    password: "",
    confirmPassword: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Check if this is the superadmin email
  const isSuperAdmin = (userEmail: string) => {
    return userEmail === "admin4545@gmail.com"
  }

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const {
        firstName,
        lastName,
        phone,
        email,
        companyRegisteredName,
        businessName,
        companyDomain,
        adminEmail,
        password,
        confirmPassword,
      } = formData

      // 1) Basic validation
      if (!firstName || !lastName) throw new Error("Please enter first and last name")
      if (!email) throw new Error("Please enter your email")
      if (!phone) throw new Error("Please enter your phone number")
      if (!companyRegisteredName || !businessName || !companyDomain) {
        throw new Error("Please enter all company details")
      }
      if (password !== confirmPassword) throw new Error("Passwords don't match")
      if (password.length < 6) throw new Error("Password must be at least 6 characters")

      // 2) Check domain uniqueness
      const companyQuery = query(collection(db, "companies"), where("domain", "==", companyDomain))
      const companySnapshot = await getDocs(companyQuery)
      if (!companySnapshot.empty) {
        throw new Error("A company with this domain already exists")
      }

      // 3) Create user in Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const userId = userCredential.user.uid

      // Determine if this is the superadmin
      const isAdmin = isSuperAdmin(email)

      // 4) Create the company doc
      const companyDoc = await addDoc(collection(db, "companies"), {
        registeredName: companyRegisteredName,
        businessName,
        domain: companyDomain,
        adminEmail: adminEmail || email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: userId,
        users: [userId],
        status: "active",
        maxUsers: 3,
        subscriptionStatus: "active",
        subscriptionPlan: "standard", // Default to standard plan
      })

      // 5) Create the user doc
      await setDoc(doc(db, "users", userId), {
        userId: `OS${Date.now().toString().slice(-6)}`,
        firstName,
        lastName,
        email,
        phone,
        role: isAdmin ? "superAdmin" : "admin",
        isAdmin: true,
        permissions: ["read"],
        createdAt: new Date().toISOString(),
        emailVerified: false,
        ownerId: userCredential.user.uid,
        companyId: companyDoc.id,
      })
      await userCredential.user.reload()

      // 6) Email verification + displayName
      try {
        await sendEmailVerification(userCredential.user)
      } catch (emailError) {
        console.error("Error sending email verification:", emailError)
        // Optionally setError or handle gracefully
      }
      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`,
      })

      setError("Account created successfully! Redirecting to dashboard...")

      // Call onSuccess to close modals
      onSuccess()

      // Redirect to plan selection page after successful signup
      setTimeout(() => {
        if (isAdmin) {
          navigate("/admin/dashboard", { replace: true })
        } else {
          navigate("/select-plan", { replace: true })
        }
      }, 1500)
    } catch (err) {
      console.error("Signup error:", err)
      setError(err instanceof Error ? err.message : "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-auto p-6">
      {/* Close button (X) */}
      <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full">
        <X className="w-5 h-5 text-gray-500" />
      </button>

      <h2 className="text-2xl font-bold mb-4 text-gray-900">Create Account</h2>

      {error && (
        <div
          className={`mb-4 p-4 ${error.includes("successfully") ? "bg-green-50 border border-green-200 text-green-600" : "bg-red-50 border border-red-200 text-red-600"} rounded-lg flex items-center gap-2`}
        >
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Scrollable form container */}
      <div className="max-h-[70vh] overflow-auto">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          {/* First Name */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="border rounded-lg px-3 py-2"
            />
          </div>

          {/* Last Name */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="border rounded-lg px-3 py-2"
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="border rounded-lg px-3 py-2"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="border rounded-lg px-3 py-2"
            />
          </div>

          {/* Company Registered Name */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Registered Name</label>
            <input
              type="text"
              name="companyRegisteredName"
              value={formData.companyRegisteredName}
              onChange={handleChange}
              required
              className="border rounded-lg px-3 py-2"
            />
          </div>

          {/* Business Name */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Business Name</label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              required
              className="border rounded-lg px-3 py-2"
            />
          </div>

          {/* Company Domain */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Domain</label>
            <input
              type="text"
              name="companyDomain"
              value={formData.companyDomain}
              onChange={handleChange}
              required
              className="border rounded-lg px-3 py-2"
              placeholder="example.com"
            />
          </div>

          {/* Admin Email */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Admin Email (optional)</label>
            <input
              type="email"
              name="adminEmail"
              value={formData.adminEmail}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2"
              placeholder="Leave blank to use signup email"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="border rounded-lg px-3 py-2"
            />
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="border rounded-lg px-3 py-2"
            />
          </div>

          {/* Footer Buttons (span both columns) */}
          <div className="col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignupForm

