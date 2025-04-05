"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db, auth, isSuperAdmin } from "../../lib/firebase"
import { useNavigate } from "react-router-dom"
import { Building2, Users, TrendingUp, Settings, AlertCircle, CreditCard, LogOut } from "lucide-react"
import AdminUserManagement from "./AdminUserManagement"
import Subscriptions from "./Subscriptions"

interface DashboardStats {
  totalTenants: number
  totalUsers: number
  activeTenants: number
  recentSignups: number
  totalRevenue: number
  activeSubscriptions: number
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    totalUsers: 0,
    activeTenants: 0,
    recentSignups: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "tenants" | "subscriptions">("overview")
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      if (!auth.currentUser) {
        navigate("/admin")
        return
      }

      try {
        const isSuperAdminUser = await isSuperAdmin(auth.currentUser.uid)
        if (!isSuperAdminUser) {
          auth.signOut()
          navigate("/admin")
        }
      } catch (err) {
        console.error("Auth check error:", err)
        navigate("/admin")
      }
    }

    checkAuth()
  }, [navigate])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!auth.currentUser) {
          throw new Error("Not authenticated")
        }

        setLoading(true)
        setError(null)

        // Check if user is superadmin first
        const isSuperAdminUser = await isSuperAdmin(auth.currentUser.uid)
        if (!isSuperAdminUser) {
          throw new Error("Permission denied - must be super admin")
        }

        // Get all tenants (companies)
        const tenantsSnap = await getDocs(collection(db, "companies"))
        const totalTenants = tenantsSnap.size

        // Get active tenants
        const activeTenantsSnap = await getDocs(query(collection(db, "companies"), where("status", "==", "active")))
        const activeTenants = activeTenantsSnap.size

        // Get all users
        const usersSnap = await getDocs(collection(db, "users"))
        const totalUsers = usersSnap.size

        // Get recent signups (in the last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        // Query for recent signups
        const recentSignupsSnap = await getDocs(
          query(collection(db, "users"), where("createdAt", ">=", thirtyDaysAgo.toISOString())),
        )
        const recentSignups = recentSignupsSnap.size

        // Get subscription data
        const customersSnap = await getDocs(collection(db, "customers"))
        let activeSubscriptions = 0
        let totalRevenue = 0

  for (const customerDoc of customersSnap.docs) {
    const subsSnap = await getDocs(collection(db, "customers", customerDoc.id, "subscriptions"))

    subsSnap.forEach((subDoc) => {
      const sub = subDoc.data()

      if (sub.status === "active" || sub.status === "trialing") {
        activeSubscriptions++
      }

      if (sub.status === "active" && sub.price) {
        totalRevenue += (sub.price.unit_amount || 0) / 100
      }
    })
  }
        setStats({
          totalTenants,
          totalUsers,
          activeTenants,
          recentSignups,
          totalRevenue,
          activeSubscriptions,
        })
      } catch (err) {
        console.error("Error fetching stats:", err)
        setError("Failed to load dashboard statistics")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const handleSignOut = async () => {
    try {
      await auth.signOut()
      navigate("/")
    } catch (err) {
      console.error("Sign out error:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Settings className="w-8 h-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">SaaS Admin Portal</span>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleSignOut}
                className="ml-4 px-4 py-2 flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab("tenants")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "tenants"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Tenant Management
            </button>
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "subscriptions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Subscriptions
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Tenants */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Companies</p>
                    <h4 className="text-2xl font-bold text-gray-900">{stats.totalTenants}</h4>
                  </div>
                </div>
              </div>

              {/* Active Tenants */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Companies</p>
                    <h4 className="text-2xl font-bold text-gray-900">{stats.activeTenants}</h4>
                  </div>
                </div>
              </div>

              {/* Total Users */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <h4 className="text-2xl font-bold text-gray-900">{stats.totalUsers}</h4>
                  </div>
                </div>
              </div>

              {/* Recent Signups */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Users className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Recent Signups</p>
                    <h4 className="text-2xl font-bold text-gray-900">{stats.recentSignups}</h4>
                    <p className="text-xs text-gray-500">Last 30 days</p>
                  </div>
                </div>
              </div>

              {/* Active Subscriptions */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <CreditCard className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Subscriptions</p>
                    <h4 className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</h4>
                  </div>
                </div>
              </div>

              {/* Total Revenue */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <CreditCard className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <h4 className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</h4>
                    <p className="text-xs text-gray-500">From active subscriptions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && <AdminUserManagement />}

        {activeTab === "tenants" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Tenant Management</h2>
            <p>Tenant management functionality will be implemented here.</p>
          </div>
        )}

        {activeTab === "subscriptions" && <Subscriptions />}
      </div>
    </div>
  )
}

export default AdminDashboard

