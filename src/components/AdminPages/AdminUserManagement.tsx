"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { Search, Download, User, CreditCard } from "lucide-react"

interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  companyId: string
  companyName: string
  plan: string
  subscriptionStatus: string
  createdAt: string
}

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState<string | null>(null)
  const [filterSubscription, setFilterSubscription] = useState<string | null>(null)
  const [companies, setCompanies] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchAllUsers()
  }, [])

  const fetchAllUsers = async () => {
    try {
      setLoading(true)

      // First, fetch all companies to get their names and subscription info
      const companiesRef = collection(db, "companies")
      const companiesSnapshot = await getDocs(companiesRef)
      const companiesData: Record<string, any> = {}

      companiesSnapshot.forEach((doc) => {
        const data = doc.data()
        companiesData[doc.id] = {
          name: data.businessName || data.name || "Unknown Company",
          plan: data.plan || "free",
          subscriptionStatus: data.subscriptionStatus || "inactive",
        }
      })

      setCompanies(companiesData)

      // Now fetch all users
      const usersRef = collection(db, "users")
      const usersSnapshot = await getDocs(usersRef)

      const usersData: UserData[] = []

      for (const userDoc of usersSnapshot.docs) {
        const data = userDoc.data()
        const companyId = data.companyId

        // Get company info
        let companyName = "No Company"
        let plan = "None"
        let subscriptionStatus = "inactive"

        if (companyId && companiesData[companyId]) {
          companyName = companiesData[companyId].name
          plan = companiesData[companyId].plan
          subscriptionStatus = companiesData[companyId].subscriptionStatus
        }

        usersData.push({
          id: userDoc.id,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          role: data.role || "user",
          companyId: companyId || "",
          companyName,
          plan,
          subscriptionStatus,
          createdAt: data.createdAt || "",
        })
      }

      setUsers(usersData)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    // Apply search filter
    const matchesSearch =
      searchQuery === "" ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.companyName.toLowerCase().includes(searchQuery.toLowerCase())

    // Apply role filter
    const matchesRole = filterRole === null || user.role === filterRole

    // Apply subscription filter
    const matchesSubscription = filterSubscription === null || user.plan === filterSubscription

    return matchesSearch && matchesRole && matchesSubscription
  })

  const exportToCSV = () => {
    // Create CSV content
    const headers = ["First Name", "Last Name", "Email", "Role", "Company", "Plan", "Status", "Created At"]
    const rows = filteredUsers.map((user) => [
      user.firstName,
      user.lastName,
      user.email,
      user.role,
      user.companyName,
      user.plan,
      user.subscriptionStatus,
      new Date(user.createdAt).toLocaleDateString(),
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `users_export_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={filterRole || ""}
                onChange={(e) => setFilterRole(e.target.value || null)}
                className="pl-10 pr-4 py-2 border rounded-lg appearance-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="superAdmin">Super Admin</option>
              </select>
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>

            <div className="relative">
              <select
                value={filterSubscription || ""}
                onChange={(e) => setFilterSubscription(e.target.value || null)}
                className="pl-10 pr-4 py-2 border rounded-lg appearance-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Plans</option>
               
                <option value="basic">Standard</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No users found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {user.firstName?.[0] || "?"}
                                {user.lastName?.[0] || "?"}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.companyName}</div>
                        <div className="text-sm text-gray-500">{user.companyId || "No ID"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === "superAdmin"
                              ? "bg-purple-100 text-purple-800"
                              : user.role === "admin"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.plan === "enterprise"
                              ? "bg-purple-100 text-purple-800"
                              : user.plan === "professional"
                                ? "bg-green-100 text-green-800"
                                : user.plan === "basic"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.plan === "None" ? "No Plan" : user.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.subscriptionStatus === "active"
                              ? "bg-green-100 text-green-800"
                              : user.subscriptionStatus === "trialing"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.subscriptionStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUserManagement

