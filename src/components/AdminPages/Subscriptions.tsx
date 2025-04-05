"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, Timestamp, doc, getDoc } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { Calendar, CreditCard, DollarSign, Package, RefreshCw, Search, User } from "lucide-react"

interface SubscriptionData {
  id: string
  customerId: string
  customerEmail?: string
  customerName?: string
  companyName?: string
  created: Timestamp | Date
  status: string
  name: string
  price?: number
  currency?: string
  interval?: string
  currentPeriodStart?: Timestamp | Date
  currentPeriodEnd?: Timestamp | Date
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get all customers
      const customersRef = collection(db, "customers")
      const customersSnapshot = await getDocs(customersRef)

      const allSubscriptions: SubscriptionData[] = []

      // For each customer, get their subscriptions
      for (const customerDoc of customersSnapshot.docs) {
        const customerId = customerDoc.id
        const customerData = customerDoc.data()

        // Try to get company name if available
        let companyName = "Unknown Company"
        if (customerData.metadata && customerData.metadata.companyId) {
          try {
            const companyDoc = await getDoc(doc(db, "companies", customerData.metadata.companyId))
            if (companyDoc.exists()) {
              companyName = companyDoc.data().name || companyName
            }
          } catch (err) {
            console.error("Error fetching company:", err)
          }
        }

        // Get subscriptions subcollection
        const subscriptionsRef = collection(customerDoc.ref, "subscriptions")
        const subscriptionsQuery = query(subscriptionsRef, orderBy("created", "desc"))
        const subscriptionsSnapshot = await getDocs(subscriptionsQuery)

        // Process each subscription
        for (const subDoc of subscriptionsSnapshot.docs) {
          const subData = subDoc.data()

          // Extract subscription name and price from items if available
          let subscriptionName = "Unknown Plan"
          let subscriptionPrice: number | undefined
          let subscriptionCurrency: string | undefined
          let subscriptionInterval: string | undefined

          if (subData.items && subData.items.length > 0 && subData.items[0].price) {
            const priceData = subData.items[0].price
            subscriptionName = priceData.product?.name || priceData.name || subscriptionName
            subscriptionPrice = priceData.unit_amount ? priceData.unit_amount / 100 : undefined
            subscriptionCurrency = priceData.currency
            subscriptionInterval = priceData.recurring?.interval
          }

          allSubscriptions.push({
            id: subDoc.id,
            customerId,
            customerEmail: customerData.email,
            customerName: customerData.name,
            companyName,
            created: subData.created,
            status: subData.status || "unknown",
            name: subscriptionName,
            price: subscriptionPrice,
            currency: subscriptionCurrency,
            interval: subscriptionInterval,
            currentPeriodStart: subData.current_period_start,
            currentPeriodEnd: subData.current_period_end,
          })
        }
      }

      // Sort by created date (newest first)
      allSubscriptions.sort((a, b) => {
        const dateA = a.created instanceof Timestamp ? a.created.toDate() : a.created
        const dateB = b.created instanceof Timestamp ? b.created.toDate() : b.created
        return dateB.getTime() - dateA.getTime()
      })

      setSubscriptions(allSubscriptions)
    } catch (err) {
      console.error("Error fetching subscriptions:", err)
      setError("Failed to load subscription data")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchSubscriptions()
  }

  // Filter subscriptions based on search term
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (sub.customerEmail && sub.customerEmail.toLowerCase().includes(searchLower)) ||
      (sub.customerName && sub.customerName.toLowerCase().includes(searchLower)) ||
      (sub.companyName && sub.companyName.toLowerCase().includes(searchLower)) ||
      sub.name.toLowerCase().includes(searchLower) ||
      sub.status.toLowerCase().includes(searchLower)
    )
  })

  // Format date
  const formatDate = (timestamp?: Timestamp | Date) => {
    if (!timestamp) return "N/A"
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Format currency
  const formatCurrency = (amount?: number, currency?: string) => {
    if (amount === undefined) return "$0.00"

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount)
  }

  // Format period
  const formatPeriod = (start?: Timestamp | Date, end?: Timestamp | Date) => {
    if (!start || !end) return "N/A"
    return `${formatDate(start)} to ${formatDate(end)}`
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscriptions</h1>
        <p className="text-gray-600">Manage and view all customer subscriptions</p>
      </div>

      {/* Search and Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search subscriptions..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Subscriptions</p>
              <h4 className="text-2xl font-bold text-gray-900">{subscriptions.length}</h4>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Subscribers</p>
              <h4 className="text-2xl font-bold text-gray-900">
                {subscriptions.filter((sub) => sub.status === "active").length}
              </h4>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Subscription Plans</p>
              <h4 className="text-2xl font-bold text-gray-900">{new Set(subscriptions.map((sub) => sub.name)).size}</h4>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <h4 className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  subscriptions
                    .filter((sub) => sub.status === "active" && (sub.interval === "month" || sub.interval==="year"))
                    .reduce((sum, sub) => sum + (sub.price || 0), 0),
                )}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p>{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            {searchTerm ? "No subscriptions match your search" : "No subscriptions found"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Period
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubscriptions.map((subscription, index) => (
                  <tr key={`${subscription.id}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">{subscription.companyName}</div>
                        <div className="text-sm text-gray-500">{subscription.customerEmail || "No email"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{subscription.name}</div>
                      <div className="text-xs text-gray-500">
                        {subscription.interval ? `Billed ${subscription.interval}ly` : "One-time"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          subscription.status === "active"
                            ? "bg-green-100 text-green-800"
                            : subscription.status === "canceled"
                              ? "bg-red-100 text-red-800"
                              : subscription.status === "trialing"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {subscription.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(subscription.price, subscription.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(subscription.created)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPeriod(subscription.currentPeriodStart, subscription.currentPeriodEnd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

