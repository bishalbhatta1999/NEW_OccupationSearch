"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import LandingPage from "./components/LandingPage/LandingPage"
import Dashboard from "./components/Dashboard/Dashboard"
import { fetchAnzscoData } from "./services/anzscoService"
import type { Occupation, SectionContent } from "./types"
import Header from "./components/Header"
import Footer from "./components/Footer"
import SignupForm from "./components/Auth/SignupForm"
import { SaasProvider } from "./components/SaasProvider"
import AboutPage from "./pages/AboutPage"
import BlogPage from "./pages/BlogPage"
import ContactPage from "./pages/ContactPage"
import PricingPage from "./components/PricingPage"
import { onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { auth, signOutUser, db } from "./lib/firebase"
import { X } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import AdminLogin from "./components/AdminPages/AdminLogin"
import AdminDashboard from "./components/AdminPages/AdminDashboard"
import PlanSelectionPage from "./pages/PlanSelectionPage"
// Add the import for VerificationPage
import VerificationPage from "./components/Auth/VerificationPage"

interface AuthError {
  code?: string
  message: string
}

function App() {
  const [query, setQuery] = useState("")
  const [occupations, setOccupations] = useState<Occupation[]>([])
  const [selectedOccupation, setSelectedOccupation] = useState<Occupation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [sectionContent, setSectionContent] = useState<SectionContent>({
    details: {
      unitGroup: "",
      description: "",
      skillLevel: "",
      tasksAndDuties: "",
      assessingAuthority: "",
    },
    assessment: "",
    nomination: "",
    eoi: "",
    visa: "",
  })
  const [loadingSections, setLoadingSections] = useState<Record<string, boolean>>({})
  const debounceTimeout = useRef<number | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showLanding, setShowLanding] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [signInError, setSignInError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetSent, setResetSent] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  /**
   * Store data from OccupationHeader
   * e.g. { occupation_list: 'MLTSSL', skill_level: '1' }
   */
  const [apiData, setApiData] = useState<{ occupation_list?: string; skill_level?: string } | null>(null)

  // Check authentication status on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthenticated(false)
        setIsAdmin(false)
        setAuthChecked(true)

        // Don't navigate away if we're on the admin login page or admin dashboard
        if (!location.pathname.startsWith("/admin")) {
          navigate("/")
        }
        return
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (!userDoc.exists()) {
          navigate("/")
          return
        }

        const userData = userDoc.data()
        const userIsAdmin = userData?.role === "superAdmin"
        setIsAdmin(userIsAdmin)
        setIsAuthenticated(true)

        // Check if email is verified
        if (!user.emailVerified && location.pathname !== "/verification") {
          // If not verified and not already on verification page, redirect to verification
          navigate("/verification")
          setAuthChecked(true)
          return
        }

        // Redirect based on user type and if they have a plan
        let hasSelectedPlan = false

        // Check if user has a subscription in Firestore
        if (userData && userData.subscription) {
          // If user has a subscription in Firestore with status "trialing" or "active", consider them as having a plan
          hasSelectedPlan = userData.subscription.status === "trialing" || userData.subscription.status === "active"
        }

        // If no subscription found in Firestore, fall back to localStorage check
        if (!hasSelectedPlan) {
          hasSelectedPlan = !!localStorage.getItem(`selectedPlan_${user.uid}`)
        }

        // Only redirect if we're not already on the target page
        // This prevents redirect loops
        const currentPath = location.pathname

        if (currentPath === "/admin/dashboard" && userIsAdmin) {
          // Stay on admin dashboard
        } else if (userIsAdmin && currentPath !== "/admin/dashboard") {
          // Redirect admin to admin dashboard
          navigate("/admin/dashboard")
        } else if (!hasSelectedPlan && currentPath !== "/select-plan" && user.emailVerified) {
          navigate("/select-plan")
        } else if (hasSelectedPlan && currentPath !== "/dashboard" && user.emailVerified) {
          navigate("/dashboard")
        }
      } catch (error) {
        console.error("Error checking user role:", error)
        setIsAuthenticated(true)
        setIsAdmin(false)
      } finally {
        setAuthChecked(true)
      }
    })

    // Add an event listener for the showAuthModal event
    const handleShowAuthModal = (event: any) => {
      setShowAuthModal(true)
      if (event.detail?.email) {
        setEmail(event.detail.email)
      }
    }

    window.addEventListener("showAuthModal", handleShowAuthModal)
    return () => {
      window.removeEventListener("showAuthModal", handleShowAuthModal)
      unsubscribe()
    }
  }, [navigate, location.pathname])

  const loadSectionContent = async (section: string) => {
    // For EOI section, we don't need to check for existing content
    if (section === "eoi") {
      setActiveSection("eoi")
      return
    }

    // For other sections, check if we already have content
    if (!selectedOccupation || (section !== "eoi" && sectionContent[section as keyof SectionContent])) {
      return
    }

    console.log("Loading section content for:", section)
    console.log("Selected occupation:", selectedOccupation)

    setLoadingSections((prev) => ({ ...prev, [section]: true }))

    try {
      // Extract the 4-digit ANZSCO code
      const anzscoCode = selectedOccupation.anzsco_code?.toString().slice(0, 4)
      console.log("Extracted ANZSCO code:", anzscoCode)

      if (!anzscoCode) {
        throw new Error("Invalid ANZSCO code")
      }

      const data = await fetchAnzscoData()
      const absData = data?.details?.[anzscoCode]

      console.log("Selected Occupation:", selectedOccupation)
      console.log("ANZSCO Code:", selectedOccupation.anzsco_code)

      if (section === "details") {
        setSectionContent((prev) => ({
          ...prev,
          details: {
            unitGroup: `${anzscoCode}${absData?.unitGroup ? ` - ${absData.unitGroup}` : ""}`,
            description: absData?.title || "No description available",
            skillLevel: absData?.skillLevel || "Not available",
            tasksAndDuties: Array.isArray(absData?.tasks) ? absData.tasks.join("\n") : "No tasks available",
            assessingAuthority: "See official website",
            anzscoCode: anzscoCode,
          },
        }))
      } else {
        // For other sections, provide static content
        const staticContent = {
          assessment: absData?.link
            ? {
                authority: {
                  name: "See official website",
                  url: absData.link,
                },
                processingTime: "Contact authority",
                applicationMode: "Online Application",
                fee: "Contact authority",
              }
            : "Assessment information not available",
          nomination: "Contact state authorities for nomination details",
          visa: "Contact Department of Home Affairs",
        }
        setSectionContent((prev) => ({
          ...prev,
          [section]:
            section === "eoi"
              ? null
              : staticContent[section as keyof typeof staticContent] || "Information not available",
        }))
      }
    } catch (error) {
      console.error(`Error loading ${section} content:`, error)
      setSectionContent((prev) => ({
        ...prev,
        [section]: "Failed to load information. Please try again later.",
      }))
    } finally {
      setLoadingSections((prev) => ({ ...prev, [section]: false }))
    }
  }

  const searchOccupations = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setOccupations([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("https://occupation-search.firebaseio.com/anzsco/.json", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch occupations (Status: ${response.status})`)
      }

      const data = await response.json()

      // Ensure we have data and convert to array if needed
      if (!data) {
        throw new Error("No data returned from API")
      }

      // Convert object to array if needed
      const occupationsArray = Array.isArray(data) ? data : Object.values(data)

      if (!occupationsArray || !occupationsArray.length) {
        throw new Error("No occupations found")
      }

      if (!occupationsArray || !occupationsArray.length) {
        throw new Error("No occupation data found")
      }

      const searchLower = searchQuery.toLowerCase()
      const filteredList = occupationsArray.filter(
        (occ: any) =>
          occ?.["Occupation Name"]?.toLowerCase()?.includes(searchLower) ||
          occ?.["Anzscocode"]?.toString()?.includes(searchLower) ||
          occ?.["OSCA Code"]?.toString()?.includes(searchLower),
      )

      const mappedOccupations = filteredList.map((occ) => ({
        occupation_id: occ?.["Anzsco Code"]?.toString() || occ?.id?.toString() || "",
        occupation_name: occ?.["Occupation Name"] || occ?.name || "",
        anzsco_code: occ?.["Anzsco Code"]?.toString() || occ?.anzscocode?.toString() || "",
        osca_code: occ?.["OSCA Code"]?.toString() || occ?.osca_code?.toString() || "",
        skill_level: occ?.["Skill Level"]?.toString() || occ?.skill_level?.toString() || "",
        specialisations: occ?.["Specialisations"]?.toString() || occ?.specialisations?.toString() || "",
        alternative_title: occ?.["Alternative Title"]?.toString() || occ?.alternative_title?.toString() || "",
      }))

      setOccupations(mappedOccupations)
    } catch (err) {
      setError(`Error: ${(err as Error).message}`)
      setOccupations([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setIsSearching(true)
    setSelectedOccupation(null) // Clear selected occupation when search changes

    if (debounceTimeout.current) {
      window.clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = window.setTimeout(() => {
      searchOccupations(value)
    }, 300)
  }

  const handleClearSearch = () => {
    setQuery("")
    setOccupations([])
    setIsSearching(false)
    setSelectedOccupation(null)
  }

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        window.clearTimeout(debounceTimeout.current)
      }
    }
  }, [])

  const handleSelect = (occupation: Occupation) => {
    setQuery(occupation.occupation_name)
    setSelectedOccupation(occupation)
    // Make the selected occupation available globally for the EOI component
    ;(window as any).selectedOccupation = occupation
    setOccupations([]) // Clear search results
    setSectionContent({}) // Clear previous content
    setActiveSection("visa") // Start with 'visa' section
    loadSectionContent("visa") // Load visa content first
  }

  // Sign In logic
  const handleSignIn = async () => {
    if (!email) {
      setSignInError("Please enter your email")
      return
    }

    if (!password) {
      setSignInError("Please enter your password")
      return
    }

    // Check if user is trying to use admin credentials in regular sign-in
    if (email === "admin4545@gmail.com" && password === "admin4545") {
      setSignInError("Invalid credentials. ")
      return
    }

    setSignInError(null)
    setIsLoading(true)

    try {
      // Sign in the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      // Check if the user is an admin by fetching their role from Firestore
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))
      const userData = userDoc.data()

      // If the user is an admin, redirect to regular dashboard (not admin dashboard)
      if (userData && userData.role === "superAdmin") {
        setIsAdmin(true)
        setShowAuthModal(false)
        setEmail("")
        setPassword("")
        navigate("/dashboard")
        return
      }

      // Regular user - complete sign-in
      setShowAuthModal(false)
      setIsAuthenticated(true)
      setShowLanding(false)
      setEmail("")
      setPassword("")
      navigate("/dashboard")
    } catch (error: any) {
      console.error("Sign in error:", error)
      if (error.code === "auth/wrong-password") {
        setSignInError("Incorrect password. Please try again.")
      } else if (error.code === "auth/user-not-found") {
        setSignInError("No account found with this email.")
      } else if (error.code === "auth/invalid-email") {
        setSignInError("Invalid email address.")
      } else {
        setSignInError("Failed to sign in. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = () => {
    signOutUser()
      .then(() => {
        setIsAuthenticated(false)
        setIsAdmin(false)
        setShowLanding(true)
        navigate("/")
      })
      .catch((error) => {
        console.error("Error signing out:", error)
      })
  }

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setSignInError("Please enter your email address")
      return
    }

    setIsLoading(true)
    setSignInError(null)

    try {
      await sendPasswordResetEmail(auth, resetEmail)
      setResetSent(true)
    } catch (error) {
      const authError = error as AuthError
      let errorMessage = "Failed to send reset email"

      if (authError.code === "auth/user-not-found") {
        errorMessage = "No account found with this email"
      }

      setSignInError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSectionClick = (section: string) => {
    setActiveSection(section)
    loadSectionContent(section)
  }

  const handleHomeClick = () => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate("/admin/dashboard")
      } else {
        navigate("/dashboard")
      }
    } else {
      setShowLanding(true)
      setSelectedOccupation(null)
      setQuery("")
      setOccupations([])
      navigate("/")
    }
  }

  const handleGetStarted = () => {
    setShowLanding(false)
  }

  const handleSignInClick = () => {
    setShowAuthModal(true)
  }

  const handleAuthSuccess = () => {
    setIsAuthenticated(true)
    setShowAuthModal(false)
    setShowLanding(false)
  }

  // Wait for auth check before rendering routes
  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <SaasProvider>
      <div className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-sky-50 via-background to-indigo-50">
        {!isSearching && !isAuthenticated && <Header onHomeClick={handleHomeClick} onSignInClick={handleSignInClick} />}
        <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 py-8">
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  isAdmin ? (
                    <Navigate to="/admin/dashboard" replace />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                ) : (
                  <LandingPage onSignInClick={handleSignInClick} onGetStarted={handleGetStarted} />
                )
              }
            />
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route
              path="/admin"
              element={isAuthenticated && isAdmin ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />}
            />
            <Route
              path="/admin/dashboard"
              element={isAuthenticated && isAdmin ? <AdminDashboard /> : <Navigate to="/admin" replace />}
            />
            <Route
              path="/pricing"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <PricingPage onSignInClick={handleSignInClick} onGetStarted={handleGetStarted} />
                )
              }
            />
            <Route
              path="/select-plan"
              element={isAuthenticated ? <PlanSelectionPage /> : <Navigate to="/" replace />}
            />
            // Add the route for verification page in the Routes component // Find the Routes component and add this
            route:
            <Route path="/verification" element={<VerificationPage />} />
          </Routes>
        </main>
        {!isSearching && !isAuthenticated && location.pathname !== "/admin" && <Footer />}

        {/* Auth Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative animate-scaleIn">
              <button
                onClick={() => {
                  setShowAuthModal(false)
                  setShowForgotPassword(false)
                  setResetSent(false)
                  setSignInError(null)
                  setResetEmail("")
                }}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <h2 className="text-2xl font-bold mb-4">{showForgotPassword ? "Reset Password" : "Sign In"}</h2>
              <div className="space-y-4">
                {showForgotPassword ? (
                  <>
                    {resetSent ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                        Password reset email sent! Please check your inbox.
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 mb-4">
                          Enter your email address and we'll send you a link to reset your password.
                        </p>
                        <div>
                          <label className="block text-sm font-medium mb-1">Email</label>
                          <input
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            placeholder="Enter your email"
                          />
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                        placeholder="Enter your password"
                      />
                    </div>
                  </>
                )}

                {signInError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {signInError}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      if (showForgotPassword) {
                        setShowForgotPassword(false)
                        setResetEmail("")
                        setResetSent(false)
                      } else {
                        setShowAuthModal(false)
                      }
                      setSignInError(null)
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    {showForgotPassword ? "Back to Sign In" : "Cancel"}
                  </button>
                  <button
                    onClick={showForgotPassword ? handleForgotPassword : handleSignIn}
                    disabled={isLoading}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 
                            disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    type="button"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {showForgotPassword ? "Sending..." : "Signing in..."}
                      </>
                    ) : showForgotPassword ? (
                      "Send Reset Link"
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </div>
                {!showForgotPassword && (
                  <div className="text-center pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Don't have an account?{" "}
                      <button
                        onClick={() => setShowSignup(true)}
                        className="text-primary hover:text-primary/90 font-medium"
                      >
                        Sign up
                      </button>
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Forgot your password?{" "}
                      <button
                        onClick={() => {
                          setShowForgotPassword(true)
                          setSignInError(null)
                        }}
                        className="text-primary hover:text-primary/90 font-medium"
                      >
                        Reset it here
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sign Up Modal */}
        {showSignup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <SignupForm
              onClose={() => setShowSignup(false)}
              onSuccess={() => {
                setShowSignup(false)
                setShowAuthModal(false)
              }}
            />
          </div>
        )}
      </div>
    </SaasProvider>
  )
}

export default App

