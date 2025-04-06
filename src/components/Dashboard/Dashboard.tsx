"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { auth, db } from "../../lib/firebase"
import { doc, getDoc, collection, query, where, getDocs, getCountFromServer } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { Loader2 } from "lucide-react"
import AccountManagement from "./AccountManagement"
import Integration from "./Integration"

import {
  LayoutDashboard,
  User,
  Settings,
  LinkIcon,
  Users,
  BarChart,
  HelpCircle,
  PenToolIcon as Tool,
  Bell,
  Briefcase,
  Calendar,
  FileText,
  TrendingUp,
  Calculator,
  Shield,
  Search,
  Clock,
  Lightbulb,
  FileCheck,
  Globe,
  Lock,
  AlertCircle,
} from "lucide-react"
import { signOutUser } from "../../lib/firebase"
import SuperAdminDashboard from "../SuperAdmin/SuperAdminDashboard"
import VisaFeeCalculator from "../VisaFeeCalculator"
import FundsCalculator from "./FundsCalc"
import ProfileManagement from "./ProfileManagement"
import MyOccupations from "./MyOccupations"
import DocumentChecklist from "../DocumentChecklist"
import PointsCalculator from "./PointsCalculator"
import UserManagement from "./UserManagement"
import ProspectManagement from "./ProspectManagement"
import Support from "./Support"
import Reports from "./Reports"
import TicketDetail from "./TicketDetail"
import { useSubscriptionFeatures } from "../../hooks/useSubscriptionFeatures"
import TrialBanner from "../TrialBanner"

interface NavItem {
  icon: React.ElementType
  label: string
  adminOnly?: boolean
  path: string
  superAdminOnly?: boolean
}

interface TabItem {
  label: string
  key: string
  adminOnly?: boolean
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const navigate = useNavigate()

  const [isAdmin, setIsAdmin] = useState(false)
  const [activeSection, setActiveSection] = useState("dashboard")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<"superAdmin" | "user">("user")
  const [activeTicket, setActiveTicket] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [showAdminPortal, setShowAdminPortal] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipText, setTooltipText] = useState("")
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // Use the subscription features hook
  const { featureAccess, currentPlan, isTrialPeriod: isInTrial, trialDaysRemaining } = useSubscriptionFeatures()

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  const [adminStats, setAdminStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
  })
  const [loadingAdminStats, setLoadingAdminStats] = useState(false)

  // Subscription state
  const [subscription, setSubscription] = useState({
    isActive: true,
    plan: currentPlan.toLowerCase(), // Use the plan from the hook
    loading: true,
    error: null as string | null,
  })

  // Update subscription when currentPlan changes
  useEffect(() => {
    setSubscription((prev) => ({
      ...prev,
      plan: currentPlan.toLowerCase(),
      loading: false,
    }))
  }, [currentPlan])

  // Define navigation items
  const navigation: NavItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Briefcase, label: "My Occupations", path: "/occupations" },
    { icon: Users, label: "Prospects", path: "/prospects" },
    { icon: Calculator, label: "Visa Fee Calculator", path: "/calculator" },
    { icon: Calculator, label: "Visa Funds Calculator", path: "/funds" },
    { icon: Calculator, label: "Points Calculator", path: "/points" },
    { icon: FileText, label: "Document Checklist", path: "/documents" },
    { icon: LinkIcon, label: "Integration", path: "/integration" },
    { icon: User, label: "Account", path: "/account" },
    { icon: BarChart, label: "Reports", path: "/reports" },
    { icon: HelpCircle, label: "Support", path: "/support" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: Shield, label: "User Management", path: "/users" },
  ]

  // Define tabs for dashboard
  const dashboardTabs: TabItem[] = [
    { label: "Dashboard", key: "dashboard" },
    { label: "My Occupations", key: "occupations" },
    { label: "Prospects", key: "prospects" },
    { label: "Calculators", key: "calculators" },
    { label: "Documents", key: "documents" },
    { label: "Account", key: "account" },
    { label: "Support", key: "support" },
    { label: "User Management", key: "users" },
    { label: "Settings", key: "settings" },
    { label: "Admin", key: "admin", adminOnly: true },
  ]

  // Listen for custom event to navigate to support section
  useEffect(() => {
    const handleSupportNavigation = () => {
      setActiveSection("support")
      setActiveTab("support")
    }

    window.addEventListener("navigateToSupport", handleSupportNavigation)
    return () => {
      window.removeEventListener("navigateToSupport", handleSupportNavigation)
    }
  }, [])

  // Update the useEffect that checks for authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // Don't navigate away if we're on an admin page
        if (!window.location.pathname.startsWith("/admin")) {
          navigate("/")
        }
        return
      }

      try {
        // Reload user to get fresh verification status
        await currentUser.reload()

        // Check if email is verified
        if (!currentUser.emailVerified) {
          navigate("/verification")
          return
        }

        setUser(currentUser)
        const userDocRef = doc(db, "users", currentUser.uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const data = userDoc.data()
          setUserData(data)

          // Check if user is admin
          const userIsAdmin = data?.role === "superAdmin"
          const userIsSuperAdmin = data?.role === "superAdmin"

          setIsAdmin(userIsAdmin)
          setIsSuperAdmin(userIsSuperAdmin)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [navigate])

  // Update the useEffect that checks premium status to also determine the subscription type
  useEffect(() => {
    // Set subscription state based on the currentPlan from useSubscriptionFeatures
    setSubscription({
      isActive: currentPlan.toLowerCase() !== "free",
      plan: currentPlan.toLowerCase(),
      loading: false,
      error: null,
    })
  }, [currentPlan])

  const fetchAdminStats = async () => {
    if (!isAdmin) return

    setLoadingAdminStats(true)
    try {
      // Get total companies
      const companiesRef = collection(db, "companies")
      const companiesSnapshot = await getCountFromServer(companiesRef)
      const totalCompanies = companiesSnapshot.data().count

      // Get active companies (with active subscription)
      const activeCompaniesQuery = query(companiesRef, where("subscriptionStatus", "==", "active"))
      const activeCompaniesSnapshot = await getCountFromServer(activeCompaniesQuery)
      const activeCompanies = activeCompaniesSnapshot.data().count

      // Get total users
      const usersRef = collection(db, "users")
      const usersSnapshot = await getCountFromServer(usersRef)
      const totalUsers = usersSnapshot.data().count

      // Get active subscriptions
      const activeSubscriptionsCount = await getActiveSubscriptionsCount()

      setAdminStats({
        totalCompanies,
        activeCompanies,
        totalUsers,
        activeSubscriptions: activeSubscriptionsCount,
        totalRevenue: 0, // This would require more complex calculation
      })
    } catch (error) {
      console.error("Error fetching admin statistics:", error)
    } finally {
      setLoadingAdminStats(false)
    }
  }

  const getActiveSubscriptionsCount = async () => {
    try {
      let totalActive = 0
      const customersRef = collection(db, "customers")
      const customersSnapshot = await getDocs(customersRef)

      // Process each customer
      for (const customerDoc of customersSnapshot.docs) {
        const subscriptionsRef = collection(customerDoc.ref, "subscriptions")
        const activeSubQuery = query(subscriptionsRef, where("status", "==", "active"))
        const activeSubSnapshot = await getCountFromServer(activeSubQuery)

        totalActive += activeSubSnapshot.data().count
      }

      return totalActive
    } catch (error) {
      console.error("Error fetching active subscriptions:", error)
      return 0
    }
  }

  useEffect(() => {
    if (activeSection === "admin-portal" && isAdmin) {
      fetchAdminStats()
    }
  }, [activeSection, isAdmin])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(
    (item) =>
      // Check admin/superAdmin permissions
      (!item.adminOnly || isAdmin) && (!item.superAdminOnly || isSuperAdmin),
  )

  // Filter dashboard tabs based on user role
  const filteredTabs = dashboardTabs.filter((tab) => !tab.adminOnly || isAdmin)

  // Check if a feature is accessible based on the path
  const isFeatureAccessible = (path: string): boolean => {
    // If user is admin, allow access to all features
    if (isAdmin) return true

    console.log("Checking access for path:", path, "Current plan:", currentPlan, "Feature access:", featureAccess)

    // Check specific features based on the path
    switch (path) {
      case "/prospects":
        return featureAccess.prospects
      case "/calculator":
        return featureAccess.visaCalculator
      case "/integration":
        return featureAccess.widgetIntegration
      // Default features available to all plans
      case "/dashboard":
      case "/occupations":
      case "/funds":
      case "/points":
      case "/documents":
      case "/account":
      case "/support":
      case "/settings":
      case "/users":
      case "/reports":
        return true
      default:
        return false
    }
  }

  // Update the getUpgradeMessage function to provide more specific messages
  const getUpgradeMessage = (path: string): string => {
    switch (path) {
      case "/prospects":
        return "Upgrade to Enterprise plan to unlock Prospects"
      case "/calculator":
        return "Upgrade to Premium or Enterprise plan to unlock Visa Fee Calculator"
      case "/integration":
        return "Upgrade to Standard or higher plan to unlock Widget Integration"
      default:
        return "Upgrade your plan to unlock this feature"
    }
  }

  // Show tooltip for locked features
  const showTooltip = (e: React.MouseEvent, path: string) => {
    const message = getUpgradeMessage(path)
    setTooltipText(message)
    setTooltipVisible(true)
    setTooltipPosition({ x: e.clientX, y: e.clientY })
  }

  const hideTooltip = () => {
    setTooltipVisible(false)
  }

  // Quick actions for the Dashboard page
  const quickActions = isAdmin
    ? [
        { label: "Occupation Search", icon: Briefcase, section: "occupations" },
        { label: "Points Calculator", icon: Calculator, section: "points" },
        { label: "Visa Fee Calculator", icon: Calculator, section: "calculator" },
        { label: "Documents Checklist", icon: FileText, section: "documents" },
      ]
    : [
        { label: "Occupation Search", icon: Briefcase, section: "occupations" },
        { label: "Points Calculator", icon: Calculator, section: "points" },
        { label: "Visa Fee Calculator", icon: Calculator, section: "calculator" },
        { label: "Documents Checklist", icon: FileText, section: "documents" },
        { label: "Support", icon: HelpCircle, section: "support" },
      ]

  const handleSignOut = async () => {
    try {
      await signOutUser()
      window.location.reload()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Function to handle section navigation
  const handleSectionClick = (section: string) => {
    setActiveSection(section)

    // Update active tab based on section
    if (section === "dashboard") {
      setActiveTab("dashboard")
    } else if (section === "occupations") {
      setActiveTab("occupations")
    } else if (["funds", "points"].includes(section)) {
      setActiveTab("calculators")
    } else if (section === "documents") {
      setActiveTab("documents")
    } else if (section === "account") {
      setActiveTab("account")
    } else if (section === "support") {
      setActiveTab("support")
    } else if (section === "integration") {
      setActiveTab("integration")
    } else if (section === "settings") {
      setActiveTab("settings")
    } else if (section === "users") {
      setActiveTab("users")
    } else if (["admin-portal"].includes(section)) {
      setActiveTab("admin")
    }
  }

  // Function to handle tab navigation
  const handleTabClick = (tab: string) => {
    setActiveTab(tab)

    // Set default section for each tab
    if (tab === "dashboard") {
      setActiveSection("dashboard")
    } else if (tab === "occupations") {
      setActiveSection("occupations")
    } else if (tab === "prospects") {
      setActiveSection("prospects")
    } else if (tab === "calculators") {
      setActiveSection("calculator")
    } else if (tab === "documents") {
      setActiveSection("documents")
    } else if (tab === "account") {
      setActiveSection("account")
    } else if (tab === "support") {
      setActiveSection("support")
    } else if (tab === "admin") {
      setActiveSection("admin-portal")
    } else if (tab === "settings") {
      setActiveSection("settings")
    } else if (tab === "users") {
      setActiveSection("users")
    } else if (tab === "integration") {
      setActiveSection("integration")
    }
  }

  // Function to render the appropriate content based on activeSection
  const renderContent = () => {
    // If we're in admin portal mode, just return the SuperAdminDashboard
    if (activeSection === "admin-portal" && isAdmin) {
      return <SuperAdminDashboard />
    }

    // For all other sections, render the appropriate content
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
            {/* Trial Banner */}
            <TrialBanner />
            {/* Quick Actions Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon
                const isAccessible = isFeatureAccessible(`/${action.section}`)

                return (
                  <button
                    key={action.label}
                    onClick={() => isAccessible && setActiveSection(action.section)}
                    className={`p-4 sm:p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex items-center gap-3 ${!isAccessible ? "opacity-70 cursor-not-allowed" : ""}`}
                    onMouseEnter={(e) => !isAccessible && showTooltip(e, `/${action.section}`)}
                    onMouseLeave={hideTooltip}
                  >
                    <div className="p-3 rounded-lg bg-blue-100">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="font-medium text-sm sm:text-base text-gray-900">{action.label}</span>
                    {!isAccessible && <Lock className="w-4 h-4 text-gray-500 ml-auto" />}
                  </button>
                )
              })}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Leads</p>
                    <h4 className="text-2xl font-bold text-gray-900">150</h4>
                  </div>
                </div>
                <div className="text-sm text-green-600">↑ 10% increase from last month</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Tool className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Recent Searches</p>
                    <h4 className="text-2xl font-bold text-gray-900">12</h4>
                  </div>
                </div>
                <div className="text-sm text-gray-600">Latest: Engineer jobs</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Calculator className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                    <h4 className="text-2xl font-bold text-gray-900">15%</h4>
                  </div>
                </div>
                <div className="text-sm text-green-600">Improved by 3% from last period</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <h4 className="text-2xl font-bold text-gray-900">45</h4>
                  </div>
                </div>
                <div className="text-sm text-blue-600">Currently online</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                  </div>
                  {notifications.length > 0 && (
                    <span className="text-sm text-gray-500">
                      Last updated {new Date(notifications[0].timestamp.seconds * 1000).toLocaleString()}
                    </span>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="p-3 rounded-full bg-gray-100 mb-3">
                      <Clock className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-center">No recent activity to display</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-blue-50">
                          {notif.type === "search" ? (
                            <Search className="w-4 h-4 text-blue-600" />
                          ) : notif.type === "lead" ? (
                            <Users className="w-4 h-4 text-green-600" />
                          ) : (
                            <Bell className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-gray-900 truncate">{notif.title}</p>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {new Date(notif.timestamp.seconds * 1000).toLocaleString(undefined, {
                                hour: "numeric",
                                minute: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Migration Tips */}
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <Lightbulb className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Migration Tips</h2>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      icon: Calendar,
                      title: "Plan Ahead",
                      description: "Develop a comprehensive migration strategy with clear timelines.",
                    },
                    {
                      icon: FileCheck,
                      title: "Document Management",
                      description: "Keep all required documents organized and up-to-date.",
                    },
                    {
                      icon: Globe,
                      title: "Stay Informed",
                      description: "Monitor the latest immigration policy changes and updates.",
                    },
                    {
                      icon: Users,
                      title: "Professional Guidance",
                      description: "Seek advice from registered migration agents when needed.",
                    },
                    {
                      icon: Calculator,
                      title: "Points Calculation",
                      description: "Regularly assess your points score using our calculator tools.",
                    },
                  ].map((tip, index) => {
                    const Icon = tip.icon
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-gray-100">
                          <Icon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{tip.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      case "integration":
        return (
          <div className="p-8">
            <Integration />
          </div>
        )
      case "calculator":
        return featureAccess.visaCalculator || isAdmin ? (
          <div className="p-8 animate-fadeIn">
            <VisaFeeCalculator />
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Feature Locked</h2>
            <p className="text-gray-600 mb-6 max-w-md">
              The Visa Fee Calculator feature is available on Premium and Enterprise plans.
            </p>
            <button
              onClick={() => navigate("/select-plan")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Upgrade Your Plan
            </button>
          </div>
        )
      case "funds":
        return (
          <div className="p-8 animate-fadeIn">
            <FundsCalculator />
          </div>
        )
      case "occupations":
        return (
          <div className="animate-fadeIn">
            <MyOccupations />
          </div>
        )
      case "documents":
        return (
          <div className="p-8 animate-fadeIn">
            <DocumentChecklist />
          </div>
        )
      case "profile":
        return (
          <div className="p-8 animate-fadeIn">
            <ProfileManagement />
          </div>
        )
      case "points":
        return (
          <div className="p-8 animate-fadeIn">
            <PointsCalculator />
          </div>
        )

      case "users":
        return (
          <div className="p-8 animate-fadeIn">
            <UserManagement />
          </div>
        )
      case "prospects":
        return featureAccess.prospects || isAdmin ? (
          <div className="animate-fadeIn">
            <ProspectManagement />
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Feature Locked</h2>
            <p className="text-gray-600 mb-6 max-w-md">
              The Prospects feature is only available on the Enterprise plan.
            </p>
            <button
              onClick={() => navigate("/select-plan")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Upgrade Your Plan
            </button>
          </div>
        )
      case "account":
        return (
          <div className="animate-fadeIn">
            <AccountManagement />
          </div>
        )
      case "support":
        return activeTicket ? (
          <div className="animate-fadeIn">
            <TicketDetail ticketId={activeTicket} onBack={() => setActiveTicket(null)} />
          </div>
        ) : (
          <div className="animate-fadeIn">
            <Support onViewTicket={(ticketId) => setActiveTicket(ticketId)} />
          </div>
        )
      case "reports":
        return (
          <div className="p-8 animate-fadeIn">
            <Reports />
          </div>
        )
      default:
        return (
          <div className="p-8 text-center">
            <p>Select an option from the sidebar</p>
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-gray-900">OccupationSearch</h1>
            </div>
            <div className="mt-5 flex-1 flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {filteredNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.path.substring(1)
                  const isAccessible = isFeatureAccessible(item.path)

                  return (
                    <button
                      key={item.label}
                      onClick={() => isAccessible && handleSectionClick(item.path.substring(1))}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full ${
                        isActive
                          ? "bg-blue-100 text-blue-900"
                          : isAccessible
                            ? "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            : "text-gray-400 cursor-not-allowed"
                      }`}
                      disabled={!isAccessible}
                      onMouseEnter={(e) => !isAccessible && showTooltip(e, item.path)}
                      onMouseLeave={hideTooltip}
                    >
                      <Icon
                        className={`mr-3 flex-shrink-0 h-5 w-5 ${
                          isActive ? "text-blue-600" : isAccessible ? "text-gray-500" : "text-gray-300"
                        }`}
                      />
                      <span className="flex-1 text-left">{item.label}</span>
                      {!isAccessible && <Lock className="ml-2 h-4 w-4 text-gray-300" />}
                    </button>
                  )
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div>
                    <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      {userData?.firstName?.charAt(0) || user?.displayName?.charAt(0) || "U"}
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {userData?.firstName || user?.displayName || "User"}
                    </p>
                    <div className="flex items-center">
                      <span
                        className={`text-xs ${
                          currentPlan.toLowerCase() === "free"
                            ? "text-gray-500"
                            : currentPlan.toLowerCase() === "standard"
                              ? "text-blue-600"
                              : currentPlan.toLowerCase() === "premium"
                                ? "text-purple-600"
                                : "text-green-600"
                        }`}
                      >
                        {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
                        {isInTrial && trialDaysRemaining !== null && (
                          <span className="ml-1 text-amber-600">({trialDaysRemaining} days left)</span>
                        )}
                      </span>
                      <button onClick={handleSignOut} className="ml-2 text-xs text-blue-600 hover:text-blue-800">
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        <div className={`fixed inset-0 flex z-40 ${showProfileDropdown ? "visible" : "invisible"}`}>
          <div
            className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${showProfileDropdown ? "opacity-100" : "opacity-0"}`}
            onClick={() => setShowProfileDropdown(false)}
          ></div>
          <div
            className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition-transform ${showProfileDropdown ? "translate-x-0" : "-translate-x-full"}`}
          >
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setShowProfileDropdown(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <svg
                  className="h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-gray-900">OccupationSearch</h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {filteredNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.path.substring(1)
                  const isAccessible = isFeatureAccessible(item.path)

                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (isAccessible) {
                          handleSectionClick(item.path.substring(1))
                          setShowProfileDropdown(false)
                        }
                      }}
                      className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full ${
                        isActive
                          ? "bg-blue-100 text-blue-900"
                          : isAccessible
                            ? "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            : "text-gray-400 cursor-not-allowed"
                      }`}
                      disabled={!isAccessible}
                      onMouseEnter={(e) => !isAccessible && showTooltip(e, item.path)}
                      onMouseLeave={hideTooltip}
                    >
                      <Icon
                        className={`mr-4 flex-shrink-0 h-6 w-6 ${
                          isActive ? "text-blue-600" : isAccessible ? "text-gray-500" : "text-gray-300"
                        }`}
                      />
                      {item.label}
                      {!isAccessible && <Lock className="ml-2 h-4 w-4 text-gray-300" />}
                    </button>
                  )
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 group block">
                <div className="flex items-center">
                  <div>
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      {userData?.firstName?.charAt(0) || user?.displayName?.charAt(0) || "U"}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-gray-700 group-hover:text-gray-900">
                      {userData?.firstName || user?.displayName || "User"}
                    </p>
                    <div className="flex items-center">
                      <span
                        className={`text-sm ${
                          currentPlan.toLowerCase() === "free"
                            ? "text-gray-500"
                            : currentPlan.toLowerCase() === "standard"
                              ? "text-blue-600"
                              : currentPlan.toLowerCase() === "premium"
                                ? "text-purple-600"
                                : "text-green-600"
                        }`}
                      >
                        {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
                        {isInTrial && trialDaysRemaining !== null && (
                          <span className="ml-1 text-amber-600">({trialDaysRemaining} days left)</span>
                        )}
                      </span>
                      <button onClick={handleSignOut} className="ml-2 text-sm text-blue-600 hover:text-blue-800">
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 w-14">{/* Force sidebar to shrink to fit close icon */}</div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            onClick={() => setShowProfileDropdown(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
              </h1>
              <div className="ml-4 flex items-center">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    currentPlan.toLowerCase() === "free"
                      ? "bg-gray-100 text-gray-800"
                      : currentPlan.toLowerCase() === "standard"
                        ? "bg-blue-100 text-blue-800"
                        : currentPlan.toLowerCase() === "premium"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-green-100 text-green-800"
                  }`}
                >
                  {currentPlan} Plan
                </span>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notification button */}
              <button
                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
              </button>

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    id="user-menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      {userData?.firstName?.charAt(0) || user?.displayName?.charAt(0) || "U"}
                    </div>
                  </button>
                </div>

                {/* Dropdown menu */}
                {showProfileDropdown && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu">
                      <button
                        onClick={() => navigate("/profile")}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        role="menuitem"
                      >
                        Profile
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="block px-4 py-2 text-sm text-red-700 hover:bg-gray-100 w-full text-left"
                        role="menuitem"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 relative overflow-y-auto">
          {tooltipVisible && (
            <div
              ref={tooltipRef}
              className="absolute z-50 bg-gray-800 text-white text-sm rounded py-2 px-3 pointer-events-none"
              style={{ top: tooltipPosition.y + 10, left: tooltipPosition.x + 10 }}
            >
              {tooltipText}
            </div>
          )}
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

