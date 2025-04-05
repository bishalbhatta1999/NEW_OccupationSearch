"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { collection, query, getDocs, getDoc, doc, where } from "firebase/firestore"
import { db, auth } from "../../lib/firebase"
import { useNavigate } from "react-router-dom"
import { Loader2, Users, Building, CreditCard } from "lucide-react"
import AdminUserManagement from "../AdminPages/AdminUserManagement"
import Subscriptions from "../AdminPages/Subscriptions"

interface DashboardStats {
  totalCompanies: number
  activeCompanies: number
  totalUsers: number
  recentSignups: number
  activeSubscriptions: number
  totalRevenue: number
}

const SuperAdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    activeCompanies: 0,
    totalUsers: 0,
    recentSignups: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
  })
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "tenants" | "subscriptions">("dashboard")
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        if (!auth.currentUser) {
          navigate("/admin")
          return
        }

        // Check if user is superAdmin
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
        if (!userDoc.exists()) {
          navigate("/admin")
          return
        }

        const userData = userDoc.data()
        if (userData.role !== "superAdmin" && userData.email !== "admin4545@gmail.com") {
          navigate("/admin")
          return
        }

        setIsAuthorized(true)
        fetchDashboardStats()
      } catch (error) {
        console.error("Error checking authorization:", error)
        navigate("/admin")
      } finally {
        setLoading(false)
      }
    }

    checkAuthorization()
  }, [navigate])

  const fetchDashboardStats = async () => {
    try {
      // Get total companies
      const companiesRef = collection(db, "companies")
      const companiesSnapshot = await getDocs(companiesRef)
      const totalCompanies = companiesSnapshot.size

      // Get active companies (with active subscription)
      const activeCompaniesQuery = query(companiesRef, where("status", "==", "active"))
      const activeCompaniesSnapshot = await getDocs(activeCompaniesQuery)
      const activeCompanies = activeCompaniesSnapshot.size

      // Get total users
      const usersRef = collection(db, "users")
      const usersSnapshot = await getDocs(usersRef)
      const totalUsers = usersSnapshot.size

      // Get recent signups (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentSignupsQuery = query(usersRef, where("createdAt", ">=", thirtyDaysAgo.toISOString()))
      const recentSignupsSnapshot = await getDocs(recentSignupsQuery)
      const recentSignups = recentSignupsSnapshot.size

      // Get active subscriptions from customers collection
      const getActiveSubscriptions = async () => {
        try {
          let totalActive = 0
          const customersRef = collection(db, "customers")
          const customersSnapshot = await getDocs(customersRef)

          // Process each customer
          for (const customerDoc of customersSnapshot.docs) {
            const subscriptionsRef = collection(customerDoc.ref, "subscriptions")
            const activeSubQuery = query(subscriptionsRef, where("status", "==", "active"))
            const activeSubSnapshot = await getDocs(activeSubQuery)

            totalActive += activeSubSnapshot.size
          }

          return totalActive
        } catch (error) {
          console.error("Error fetching active subscriptions:", error)
          return 0
        }
      }

      const activeSubscriptions = await getActiveSubscriptions()

      // Calculate total revenue (simplified)
      const totalRevenue = 0
      // activeSubscriptionsSnapshot.forEach((doc) => {
      //   const data = doc.data()
      //   if (data.plan === "basic") totalRevenue += 29
      //   else if (data.plan === "professional") totalRevenue += 79
      //   else if (data.plan === "enterprise") totalRevenue += 199
      // })

      setStats({
        totalCompanies,
        activeCompanies,
        totalUsers,
        recentSignups,
        activeSubscriptions,
        totalRevenue,
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!isAuthorized) {
    return null // Will redirect in useEffect
  }

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Companies</p>
              <h3 className="text-2xl font-bold">{stats.totalCompanies}</h3>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              <span className="text-green-500 font-medium">{stats.activeCompanies} active</span> companies with
              subscriptions
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 mr-4">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              <span className="text-green-500 font-medium">{stats.recentSignups} new</span> users in the last 30 days
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
              <h3 className="text-2xl font-bold">{stats.activeSubscriptions}</h3>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              <span className="text-green-500 font-medium">${stats.totalRevenue}</span> monthly recurring revenue
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {/* Placeholder for recent activity */}
          <p className="text-gray-500 text-sm italic">Recent activity will be displayed here.</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
            <button
              onClick={() => auth.signOut().then(() => navigate("/"))}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
          <div className="flex space-x-8 mt-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`pb-4 text-sm font-medium ${
                activeTab === "dashboard"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`pb-4 text-sm font-medium ${
                activeTab === "users" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab("tenants")}
              className={`pb-4 text-sm font-medium ${
                activeTab === "tenants"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Tenant Management
            </button>
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`pb-4 text-sm font-medium ${
                activeTab === "subscriptions"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Subscriptions
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "users" && <AdminUserManagement />}
        {activeTab === "tenants" && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Tenant Management</h3>
            <p className="text-gray-500 text-sm italic">Tenant management features coming soon.</p>
          </div>
        )}
        {activeTab === "subscriptions" && <Subscriptions />}
      </div>
    </div>
  )
}

export default SuperAdminDashboard

