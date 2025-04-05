// "use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { doc, updateDoc, getDoc, setDoc, collection, getDocs } from "firebase/firestore"
import { db, auth, storage, firebaseConfig } from "../../lib/firebase"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { useNavigate } from "react-router-dom"

import {
  CreditCard,
  Settings,
  Upload,
  Minus,
  Plus,
  Download,
  Building,
  MapPin,
  Globe,
  Facebook,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  Chrome,
  Video,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
} from "lucide-react"
import { getPaidCheckoutUrl, getPortalUrl, watchSubscriptions } from "../../components/admin/stripe-payments"
import { initializeApp } from "firebase/app"
import { getPremiumStatus } from "../admin/getPremiumStatus"
import { getThemeColors } from "../../utils/trial-status"

// Define allowed social media platforms
const ALLOWED_PLATFORMS = [
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "google", label: "Google", icon: Chrome },
  { id: "tiktok", label: "TikTok", icon: Video },
  { id: "twitter", label: "Twitter", icon: Twitter },
]

const MAX_EMAILS = 3
const EMAIL_PREFERENCES = ["Accounts", "Marketing", "General"] as const

interface EmailPref {
  address: string
  preference: (typeof EMAIL_PREFERENCES)[number] // 'Accounts' | 'Marketing' | 'General'
}

interface Invoice {
  id: string
  date: string
  amount: string
  status: string
  pdfUrl?: string // Add this property for the PDF URL
}

interface PricingPlan {
  name: string
  price: number
  description: string
  features: {
    included: string[]
    excluded: string[]
  }
  recommended?: boolean
}

const AccountManagement: React.FC = () => {
  const app = initializeApp(firebaseConfig)
  const navigate = useNavigate()
  const [billingCycle, setBillingCycle] = useState<"month" | "year">("month")
  const [activeTab, setActiveTab] = useState<"billing" | "settings">("billing")
  const [themeColors, setThemeColors] = useState(null)

  // Instead of storing just strings, each email is an object { address, preference }
  const [emailPreferences, setEmailPreferences] = useState<EmailPref[]>([
    { address: "info@occupationsearch.com.au", preference: "Accounts" },
  ])

  // Social media array
  const [socialMedia, setSocialMedia] = useState<Array<{ type: string; url: string }>>([])

  // Company name/domain + lock
  const [companyDetails, setCompanyDetails] = useState({
    name: "",
    domain: "",
    detailsLocked: false,
  })

  // Address state
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    country: "Australia", // default to Australia
  })

  // Migration agent info
  const [migrationAgentInfo, setMigrationAgentInfo] = useState({
    agentName: "",
    maraNumber: "",
    contactEmail: "",
    description: "",
  })

  // UI states
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    const checkPremium = async () => {
      const newPremiumStatus = auth.currentUser ? await getPremiumStatus(app) : false
      setIsPremium(newPremiumStatus)
    }
    checkPremium()
  }, [app, auth.currentUser?.uid])

  // Logo states
  const [logo, setLogo] = useState<string>("")
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Replace the static invoices array with a state variable
  const [invoices, setInvoices] = useState<Invoice[]>([])

  // Reference to the new subscription section
  const upgradeSectionRef = useRef<HTMLDivElement | null>(null)

  // State for active subscription
  const [activeSubscription, setActiveSubscription] = useState<"standard" | "premium" | "enterprise">("standard")

  // Default plan for new users
  const defaultPlan = {
    name: "FREE",
    price: 0,
    billingCycle: "month",
    trialPeriod: false,
    timestamp: Date.now(),
  }

  const [savedPlan, setSavedPlan] = useState(defaultPlan)

  // Helper function to get the user-specific localStorage key
  const getUserPlanKey = (userId: string) => {
    return `selectedPlan_${userId}`
  }

  // Load user's plan from localStorage
  useEffect(() => {
    const userId = auth.currentUser?.uid
    if (!userId) return

    // Always use the user-specific key
    const planKey = getUserPlanKey(userId)
    const storedPlan = localStorage.getItem(planKey)

    if (storedPlan) {
      try {
        const parsedPlan = JSON.parse(storedPlan)
        // Verify this plan belongs to the current user or has no user ID
        if (!parsedPlan.userId || parsedPlan.userId === userId) {
          // Add userId if it's missing
          if (!parsedPlan.userId) {
            parsedPlan.userId = userId
            localStorage.setItem(planKey, JSON.stringify(parsedPlan))
          }
          setSavedPlan(parsedPlan)

          // Set subscription type based on plan name
          const planName = parsedPlan.name?.toLowerCase() || ""
          if (planName.includes("enterprise")) {
            setSubscriptionType("enterprise")
          } else if (planName.includes("premium")) {
            setSubscriptionType("premium")
          } else {
            setSubscriptionType("standard")
          }
        } else {
          // Plan belongs to another user, reset to standard
          const newDefaultPlan = { ...defaultPlan, userId }
          localStorage.setItem(planKey, JSON.stringify(newDefaultPlan))
          setSavedPlan(newDefaultPlan)
          setSubscriptionType("standard")
        }
      } catch (e) {
        console.error("Error parsing stored plan:", e)
        // Invalid JSON, reset to default
        const newDefaultPlan = { ...defaultPlan, userId }
        localStorage.setItem(planKey, JSON.stringify(newDefaultPlan))
        setSavedPlan(newDefaultPlan)
        setSubscriptionType("standard")
      }
    } else {
      // No stored plan, set default
      const newDefaultPlan = { ...defaultPlan, userId }
      localStorage.setItem(planKey, JSON.stringify(newDefaultPlan))
      setSavedPlan(newDefaultPlan)
      setSubscriptionType("standard")
    }

    // Clean up any old non-user-specific plan data
    localStorage.removeItem("selectedPlan")
  }, [auth.currentUser?.uid]) // Run when user ID changes

  const plans: PricingPlan[] = [
    {
      name: "STANDARD",
      price: 29,
      description: "Perfect for individuals and small businesses",
      features: {
        included: [
          "Unlimited Occupation Searches",
          "Unlimited Saved Searches",
          "Email Newsletters",
          "White Labeling",
          "Report Downloads",
          "Email Reports",
        ],
        excluded: [],
      },
    },
    {
      name: "PREMIUM",
      price: 79,
      description: "Ideal for growing migration agencies",
      features: {
        included: [
          "All STANDARD Features",
          "Document Checklist",
          "Report Downloads",
          "Widget Integration",
          "Widget Customization",
          "Lead Generation",
          "Lead Notifications",
          "Lead Exports",
          "Personalized Branding",
          "Custom Alerts",
          "Data Exports",
        ],
        excluded: [],
      },
      recommended: true,
    },
    {
      name: "ENTERPRISE",
      price: 99,
      description: "For large organizations with advanced needs",
      features: {
        included: [
          "All PREMIUM Features",
          "Webhook Integration",
          "Banner Integration",
          "Email Signature",
          "Custom Alerts",
          "Batch Processing",
          "API Access",
          "Priority Support",
          "Custom Branding",
          "Unlimited Team Members",
          "Data Exports",
          "Advanced Analytics",
        ],
        excluded: [],
      },
    },
  ]

  const [selectedPlan, setSelectedPlan] = useState(null)

  // Helper function to calculate adjusted price for yearly billing
  const getAdjustedPrice = (basePrice: number) => {
    return billingCycle === "year" ? (basePrice * 10).toFixed(2) : basePrice.toFixed(2)
  }

  // Add a new state to track the subscription type
  const [subscriptionType, setSubscriptionType] = useState<"standard" | "premium" | "enterprise">("standard")

  // ------------------------------------------------------------------------------
  // Load company details from Firebase
  // ------------------------------------------------------------------------------
  useEffect(() => {
    const loadCompanyDetails = async () => {
      if (!auth.currentUser) {
        setError("Please sign in to manage your account")
        return
      }

      setIsLoading(true)
      try {
        const docRef = doc(db, "companies", auth.currentUser.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()

          // Company details
          setCompanyDetails({
            name: data.name || "",
            domain: data.domain || "",
            detailsLocked: data.detailsLocked || false,
          })

          // Logo
          setLogo(data.logo || "")

          // Social media
          setSocialMedia(data.socialMedia || [])

          // Email preferences (handle old data if it was just an array of strings)
          if (Array.isArray(data.emailPreferences)) {
            // We assume it's an array of {address, preference}, but let's be safe
            const converted = data.emailPreferences.map((item: any) => {
              // If item is a string, convert to object
              if (typeof item === "string") {
                return { address: item, preference: "Accounts" } as EmailPref
              }
              // Otherwise assume it's {address, preference}
              return {
                address: item.address || "",
                preference: EMAIL_PREFERENCES.includes(item.preference) ? item.preference : "Accounts",
              }
            })
            setEmailPreferences(converted)
          } else if (Array.isArray(data.emails)) {
            // fallback if your old data was "emails"
            const converted = data.emails.map((addr: string) => ({
              address: addr,
              preference: "Accounts",
            }))
            setEmailPreferences(converted)
          }

          // Address
          setAddress({
            street: data.address?.street || "",
            city: data.address?.city || "",
            state: data.address?.state || "",
            country: data.address?.country || "Australia",
          })

          // Migration Agent Info
          setMigrationAgentInfo({
            agentName: data.migrationAgentInfo?.agentName || "",
            maraNumber: data.migrationAgentInfo?.maraNumber || "",
            contactEmail: data.migrationAgentInfo?.contactEmail || "",
            description: data.migrationAgentInfo?.description || "",
          })
        }
      } catch (err: any) {
        console.error("Error loading company details:", err)
        setError("Failed to load company details")
      } finally {
        setIsLoading(false)
      }
    }

    loadCompanyDetails()
  }, [])

  // Add a function to fetch invoices from Firestore
  const fetchInvoices = useCallback(async () => {
    if (!auth.currentUser) return

    try {
      // Get the customer document for the current user
      const customerRef = doc(db, "customers", auth.currentUser.uid)
      const customerDoc = await getDoc(customerRef)

      if (!customerDoc.exists()) {
        console.log("No customer document found")
        return
      }

      // Get the subscriptions subcollection
      const subscriptionsRef = collection(customerRef, "subscriptions")
      const subscriptionsSnapshot = await getDocs(subscriptionsRef)

      const fetchedInvoices: Invoice[] = []
      const processedInvoiceIds = new Set<string>()

      // For each subscription, get the invoices subcollection
      for (const subscriptionDoc of subscriptionsSnapshot.docs) {
        const invoicesRef = collection(subscriptionDoc.ref, "invoices")
        const invoicesSnapshot = await getDocs(invoicesRef)

        invoicesSnapshot.forEach((invoiceDoc) => {
          const invoiceData = invoiceDoc.data()
          const invoiceId = invoiceData.id || `INV-${invoiceDoc.id.substring(0, 6)}`

          if (processedInvoiceIds.has(invoiceId)) return
          processedInvoiceIds.add(invoiceId)

          fetchedInvoices.push({
            id: invoiceId,
            date: invoiceData.created ? new Date(invoiceData.created * 1000).toISOString().split("T")[0] : "N/A",
            amount: `$${(invoiceData.amount_paid / 100).toFixed(2)}`,
            status: invoiceData.status || "Paid",
            pdfUrl: invoiceData.invoice_pdf || null,
          })
        })
      }

      setInvoices(fetchedInvoices)
    } catch (error) {
      console.error("Error fetching invoices:", error)
      setError("Failed to load invoice history")
    }
  }, [])

  const downloadPdf = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId)
    if (invoice?.pdfUrl) {
      window.open(invoice.pdfUrl, "_blank")
    } else {
      setError("PDF not available for this invoice")
      setTimeout(() => setError(null), 3000)
    }
  }

  // Add a function to fetch subscription data
  const fetchSubscriptionData = useCallback(async () => {
    if (!auth.currentUser) return

    try {
      // Get the customer document for the current user
      const customerRef = doc(db, "customers", auth.currentUser.uid)

      // Get the subscriptions subcollection
      const subscriptionsRef = collection(customerRef, "subscriptions")
      const subscriptionsSnapshot = await getDocs(subscriptionsRef)

      if (subscriptionsSnapshot.empty) {
        console.log("No active subscriptions found")
        return
      }

      // Get the most recent active subscription
      let latestSubscription = null
      let latestDate = 0

      subscriptionsSnapshot.forEach((doc) => {
        const subData = doc.data()
        // Only consider active or trialing subscriptions
        if (subData.status === "active" || subData.status === "trialing") {
          if (subData.created > latestDate) {
            latestSubscription = subData
            latestDate = subData.created
          }
        }
      })

      if (latestSubscription) {
        // Get the plan name from the subscription
        let planName = "STANDARD"

        // Try to get the plan name from different possible locations in the subscription data
        if (latestSubscription.items?.[0]?.plan?.nickname) {
          planName = latestSubscription.items[0].plan.nickname
        } else if (latestSubscription.items?.[0]?.price?.product?.name) {
          planName = latestSubscription.items[0].price.product.name
        } else if (latestSubscription.plan?.nickname) {
          planName = latestSubscription.plan.nickname
        } else if (latestSubscription.product?.name) {
          planName = latestSubscription.product.name
        }

        // Normalize the plan name to match our plan types
        const normalizedPlanName = planName.toUpperCase()

        // Update subscription type based on the plan name
        if (normalizedPlanName.includes("ENTERPRISE")) {
          setSubscriptionType("enterprise")
          planName = "ENTERPRISE"
        } else if (normalizedPlanName.includes("PREMIUM")) {
          setSubscriptionType("premium")
          planName = "PREMIUM"
        } else {
          setSubscriptionType("standard")
          planName = "STANDARD"
        }

        // Get the price amount from the subscription
        let priceAmount = 0
        if (latestSubscription.items?.[0]?.plan?.amount) {
          priceAmount = latestSubscription.items[0].plan.amount / 100
        } else if (latestSubscription.items?.[0]?.price?.unit_amount) {
          priceAmount = latestSubscription.items[0].price.unit_amount / 100
        } else if (latestSubscription.plan?.amount) {
          priceAmount = latestSubscription.plan.amount / 100
        }

        // Get the billing interval
        let billingInterval = "month"
        if (latestSubscription.items?.[0]?.plan?.interval) {
          billingInterval = latestSubscription.items[0].plan.interval
        } else if (latestSubscription.items?.[0]?.price?.recurring?.interval) {
          billingInterval = latestSubscription.items[0].price.recurring.interval
        } else if (latestSubscription.plan?.interval) {
          billingInterval = latestSubscription.plan.interval
        }

        // Check if this is a trial subscription
        const isTrialing = latestSubscription.status === "trialing"

        // Calculate trial end date if in trial
        let trialEndDate = null
        if (isTrialing && latestSubscription.trial_end) {
          trialEndDate = new Date(latestSubscription.trial_end * 1000).toISOString()
        }

        // Update saved plan with subscription data
        const newPlan = {
          name: planName,
          price: priceAmount,
          billingCycle: billingInterval,
          trialPeriod: isTrialing,
          trialEndDate: trialEndDate,
          timestamp: latestSubscription.created * 1000,
          userId: auth.currentUser.uid,
          status: latestSubscription.status, // Add status field
        }

        console.log("Updated subscription plan:", newPlan)

        // Update the state and localStorage
        setSavedPlan(newPlan)
        localStorage.setItem(getUserPlanKey(auth.currentUser.uid), JSON.stringify(newPlan))

        // Also update the user document in Firestore for persistence
        try {
          const userRef = doc(db, "users", auth.currentUser.uid)
          await updateDoc(userRef, {
            subscription: {
              plan: planName,
              price: priceAmount,
              billingCycle: billingInterval,
              trialPeriod: isTrialing,
              trialEndDate: trialEndDate,
              status: latestSubscription.status,
              updatedAt: new Date().toISOString(),
            },
          })
          console.log("Updated subscription in Firestore")
        } catch (error) {
          console.error("Error updating user subscription in Firestore:", error)
        }
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error)
    }
  }, [])

  // Call these functions when the component loads
  useEffect(() => {
    if (auth.currentUser) {
      fetchInvoices()
      fetchSubscriptionData()
    }
  }, [auth.currentUser?.uid, fetchInvoices, fetchSubscriptionData])

  // Update the useEffect that checks premium status to also determine the subscription type
  useEffect(() => {
    // Set premium status based on the plan
    if (auth.currentUser) {
      // If user has a paid plan, set isPremium to true
      const isPaid = savedPlan.name !== "FREE"
      setIsPremium(isPaid)
    }
  }, [auth.currentUser?.uid, savedPlan]) // Run when user ID or saved plan changes

  // Helper function to get theme colors based on subscription type
  const theme = auth.currentUser
    ? getThemeColors(auth.currentUser.uid)
    : {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-200",
        button: "bg-blue-600 hover:bg-blue-700",
        highlight: "bg-blue-100",
        highlightText: "text-blue-800",
      }

  // ------------------------------------------------------------------------------
  // Email Preferences Handlers
  // ------------------------------------------------------------------------------
  const handleAddEmail = () => {
    if (emailPreferences.length >= MAX_EMAILS) {
      setError(`Maximum ${MAX_EMAILS} email addresses allowed`)
      return
    }
    setEmailPreferences([...emailPreferences, { address: "", preference: "Accounts" }])
    setError(null)
  }

  const handleRemoveEmail = (index: number) => {
    setEmailPreferences(emailPreferences.filter((_, i) => i !== index))
    setError(null)
  }

  const handleEmailAddressChange = (index: number, value: string) => {
    const newPrefs = [...emailPreferences]
    newPrefs[index].address = value
    setEmailPreferences(newPrefs)
    setError(null)
  }

  const handleEmailPreferenceChange = (index: number, pref: string) => {
    if (!EMAIL_PREFERENCES.includes(pref as any)) return
    const newPrefs = [...emailPreferences]
    newPrefs[index].preference = pref as EmailPref["preference"]
    setEmailPreferences(newPrefs)
    setError(null)
  }

  // ------------------------------------------------------------------------------
  // Logo Upload Handlers
  // ------------------------------------------------------------------------------
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !auth.currentUser) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file")
      return
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB")
      return
    }

    setIsUploadingLogo(true)
    setError(null)
    setSuccess(null)

    try {
      // Delete old logo if exists
      if (logo) {
        const oldLogoRef = ref(storage, `logos/${auth.currentUser.uid}/logo`)
        try {
          await deleteObject(oldLogoRef)
        } catch (error) {
          console.log("No old logo to delete or error deleting:", error)
        }
      }

      // Upload new logo
      const logoRef = ref(storage, `logos/${auth.currentUser.uid}/logo`)
      await uploadBytes(logoRef, file)
      const downloadURL = await getDownloadURL(logoRef)

      // Update company document with new logo URL
      const companyRef = doc(db, "companies", auth.currentUser.uid)
      await updateDoc(companyRef, {
        logo: downloadURL,
        updatedAt: new Date().toISOString(),
      })

      setLogo(downloadURL)
      setSuccess("Logo uploaded successfully")
    } catch (err) {
      console.error("Error uploading logo:", err)
      setError("Failed to upload logo. Please try again.")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!auth.currentUser || !logo) return

    setIsUploadingLogo(true)
    try {
      // Delete logo from storage
      const logoRef = ref(storage, `logos/${auth.currentUser.uid}/logo`)
      await deleteObject(logoRef)

      // Update company document
      const companyRef = doc(db, "companies", auth.currentUser.uid)
      await updateDoc(companyRef, {
        logo: "",
        updatedAt: new Date().toISOString(),
      })

      setLogo("")
      setSuccess("Logo removed successfully")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      console.error("Error removing logo:", err)
      setError("Failed to remove logo. Please try again.")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  // ------------------------------------------------------------------------------
  // Social Media Handlers
  // ------------------------------------------------------------------------------
  const handleAddSocialMedia = () => {
    if (socialMedia.length >= ALLOWED_PLATFORMS.length) {
      setError("Maximum number of social media platforms reached")
      return
    }

    // Find first unused platform
    const usedPlatforms = socialMedia.map((sm) => sm.type.toLowerCase())
    const availablePlatform = ALLOWED_PLATFORMS.find((p) => !usedPlatforms.includes(p.id.toLowerCase()))

    if (availablePlatform) {
      setSocialMedia([...socialMedia, { type: availablePlatform.id, url: "" }])
      setError(null)
    }
  }

  const handleRemoveSocialMedia = (index: number) => {
    setSocialMedia(socialMedia.filter((_, i) => i !== index))
    setError(null)
  }

  // ------------------------------------------------------------------------------
  // Save Changes
  // ------------------------------------------------------------------------------
  const handleSaveChanges = async () => {
    if (!auth.currentUser) {
      setError("Please sign in to save changes")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Use user's UID for doc ID
      const docRef = doc(db, "companies", auth.currentUser.uid)
      const docSnap = await getDoc(docRef)

      const updates: any = {
        updatedAt: new Date().toISOString(),
        emailPreferences, // store as array of objects
        socialMedia,
        address,
        migrationAgentInfo,
      }

      // If doc doesn't exist, set creation fields
      if (!docSnap.exists()) {
        updates.createdAt = new Date().toISOString()
        updates.userId = auth.currentUser.uid
      }

      // Only update company details if they're not locked
      if (!companyDetails.detailsLocked && companyDetails.name && companyDetails.domain) {
        updates.name = companyDetails.name
        updates.domain = companyDetails.domain
        updates.detailsLocked = true
      }

      // If document exists, update it; otherwise create it
      if (docSnap.exists()) {
        await updateDoc(docRef, updates)
      } else {
        await setDoc(docRef, updates)
      }

      // If we just set new name/domain, reflect that in state
      if (!companyDetails.detailsLocked && updates.name) {
        setCompanyDetails((prev) => ({
          ...prev,
          detailsLocked: true,
        }))
      }

      setSuccess(companyDetails.detailsLocked ? "Settings updated successfully" : "Company details saved successfully")
      setError(null)
    } catch (err) {
      console.error("Error saving changes:", err)
      setError("Failed to save changes. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // ------------------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------------------

  // State to manage the visibility of the upgrade section
  const [showUpgradeSection, setShowUpgradeSection] = useState(false)

  // State for active subscription
  // const [activeSubscription, setActiveSubscription] = useState<'basic' | 'pro' | 'premium'>('basic');

  // Handle subscription change
  const handleSubscriptionChange = (subscription: "free" | "standard" | "enterprise") => {
    setActiveSubscription(subscription)
  }

  const priceIdsmonth = {
    standard: "price_1R7vXrAYoTzSaNKS3KCv8Fzu",
    premium: "price_1R7vXtAYoTzSaNKSV13x5MLp",
    enterprise: "price_1R7vXuAYoTzSaNKShilrrBbP",
  }

  const priceIdsyear = {
    standard: "price_1R7vXsAYoTzSaNKSawQiO7WO",
    premium: "price_1R7vXtAYoTzSaNKS2nZNjCD4",
    enterprise: "price_1R7vXuAYoTzSaNKSIKDFE15j",
  }
  // Add a new state to track whether the features modal is visible:
  const [showFeaturesModal, setShowFeaturesModal] = useState(false)

  // Add a new state variable to track which plan is being processed:
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)

  // Update the upgradePayment function to accept and track the plan name:
  const upgradePayment = async (planName: string, plan: PricingPlan) => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error("User not authenticated")

      setProcessingPlan(planName.toLowerCase())

      let priceId = ""
      const planKey = planName.toLowerCase()
      billingCycle === "month" ? (priceId = priceIdsmonth[planKey]) : (priceId = priceIdsyear[planKey])

      if (!priceId) {
        throw new Error(`No price ID found for plan: ${planName}`)
      }

      // Set subscription type immediately
      if (planName.toLowerCase().includes("enterprise")) {
        setSubscriptionType("enterprise")
      } else if (planName.toLowerCase().includes("standard")) {
        setSubscriptionType("standard")
      } else {
        setSubscriptionType("premium")
      }

      // Cancel any previous subscription if exists
      await cancelPreviousSubscription(app)

      // Get checkout URL for direct payment (no trial)
      const checkoutUrl = await getPaidCheckoutUrl(app, priceId)

      if (!checkoutUrl) {
        throw new Error("Received empty checkout URL")
      }

      // Save selected plan to localStorage using the user-specific key
      const newPlan = {
        name: planName,
        price: billingCycle === "year" ? plan.price * 10 : plan.price,
        billingCycle: billingCycle,
        userId: userId,
        trialPeriod: false,
        timestamp: Date.now(),
      }

      localStorage.setItem(getUserPlanKey(userId), JSON.stringify(newPlan))
      setSavedPlan(newPlan)
      watchSubscriptions(app, userId)

      // Redirect to the checkout URL
      window.location.href = checkoutUrl
    } catch (error) {
      console.error("Error in upgradePayment:", error)
      setError("Failed to process payment. Please try again.")
      setIsLoading(false)
      setProcessingPlan(null)
    }
  }

  const manageSubscription = async () => {
    const portalUrl = await getPortalUrl(app)
    window.location.href = portalUrl
  }

  // Handle the upgrade button click
  const handleUpgradeButtonClick = () => {
    setShowUpgradeSection(true) // Show the subscription upgrade section
  }

  // Handle back to billing
  const handleBackToBilling = () => {
    setShowUpgradeSection(false) // Hide the subscription upgrade section
  }

  // Add this near the other handler functions
  const handleViewFeaturesClick = () => {
    setShowFeaturesModal(true)
  }

  // Add this to close the features modal
  const handleCloseFeatures = () => {
    setShowFeaturesModal(false)
  }

  const isTrialPeriod = savedPlan.trialPeriod || false

  // Add this after the other useEffect hooks
  useEffect(() => {
    // Check if we need to refresh subscription data from Firestore
    const handleCloseFeatures = () => {
      setShowFeaturesModal(false)
    }

    const userId = auth.currentUser?.uid
    if (userId) {
      const colors = getThemeColors(userId)
      setThemeColors(colors)
    }
  }, [auth.currentUser])
  // Add this after the other useEffect hooks
  useEffect(() => {
    // Check if we need to refresh subscription data from Firestore
    // This helps ensure the UI reflects the latest subscription status
    const checkSubscriptionStatus = async () => {
      if (auth.currentUser) {
        // If the user is on the free plan or we haven't loaded a plan yet, check Firestore
        if (savedPlan.name === "FREE" || !savedPlan.name) {
          await fetchSubscriptionData()
        }
      }
    }

    checkSubscriptionStatus()
  }, [activeTab, fetchSubscriptionData, savedPlan.name, auth.currentUser]) // Re-check when the user switches tabs

  // Add this helper function to calculate days remaining in trial
  const getTrialDaysRemaining = (plan: any) => {
    if (!plan || !plan.trialPeriod || !plan.trialEndDate) return 0

    const trialEndDate = new Date(plan.trialEndDate)
    const now = new Date()

    // Calculate days remaining
    const daysRemaining = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    return daysRemaining
  }

  // Function to cancel previous subscription
  const cancelPreviousSubscription = async (app: any) => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error("User not authenticated")

      const customerRef = doc(db, "customers", userId)
      const subscriptionsRef = collection(customerRef, "subscriptions")
      const subscriptionsSnapshot = await getDocs(subscriptionsRef)

      subscriptionsSnapshot.forEach(async (doc) => {
        const subData = doc.data()
        if (subData.status === "active" || subData.status === "trialing") {
          // Call the stripe function to cancel the subscription
          const cancelSubscription = async (app: any, subscriptionId: string) => {
            const functionURL = `${firebaseConfig.functionsURL}/ext-firestore-stripe-subscriptions-cancelSubscription`
            const response = await fetch(functionURL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                subscriptionId: subscriptionId,
                reason: "Upgrading to a new plan",
              }),
            })

            if (!response.ok) {
              console.error("Failed to cancel subscription:", response.status, response.statusText)
              throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            if (data.error) {
              console.error("Failed to cancel subscription:", data.error)
              throw new Error(data.error)
            }

            console.log("Subscription cancelled successfully")
          }

          await cancelSubscription(app, subData.id)
        }
      })
    } catch (error) {
      console.error("Error cancelling previous subscription:", error)
      setError("Failed to cancel previous subscription. Please try again.")
    }
  }

  return (
    <div className="p-8 space-y-8">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("billing")}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors
            ${
              activeTab === "billing" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-blue-600"
            }`}
        >
          <CreditCard className="w-5 h-5" />
          Billing
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors
            ${
              activeTab === "settings"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
        >
          <Settings className="w-5 h-5" />
          Account Settings
        </button>
      </div>

      {/* Billing Section */}
      {activeTab === "billing" && !showUpgradeSection && (
        <div className={`max-w-4xl mx-auto space-y-8 p-8 rounded-xl ${theme.bg}`}>
          {/* Current Plan */}
          <div
            className={`bg-white rounded-xl shadow-sm border ${isTrialPeriod ? "border-amber-300" : theme.border} p-6`}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className={`text-2xl font-bold ${isTrialPeriod ? "text-amber-600" : theme.highlightText}`}>
                  {savedPlan.name || "STANDARD"}
                  {savedPlan.trialPeriod && (
                    <span className="ml-2 text-sm font-normal bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Trial - {getTrialDaysRemaining(savedPlan)} days left
                    </span>
                  )}
                </p>
                <p className="text-gray-600">
                  ${savedPlan.price || 29}/{savedPlan.billingCycle === "month" ? "month" : "year"}
                </p>
                {/* Subscription Status */}
                {auth.currentUser && (
                  <>
                    {/* Subscription status indicator */}
                    {savedPlan && (
                      <div className="mt-2">
                        {savedPlan.name !== "FREE" ? (
                          <div
                            className={`flex items-center gap-2 ${isTrialPeriod ? "text-amber-700" : "text-green-700"}`}
                          >
                            <div
                              className={`w-3 h-3 rounded-full ${isTrialPeriod ? "bg-amber-500" : "bg-green-500"}`}
                            ></div>
                            <span>{isTrialPeriod ? "Trial" : "Active"}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500">
                            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                            <span>No Subscription</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Trial expiration warning */}
                {savedPlan.trialPeriod && getTrialDaysRemaining(savedPlan) <= 3 && (
                  <div className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Your trial will expire soon. Please upgrade to continue using all features.
                  </div>
                )}
              </div>
              <button
                onClick={handleUpgradeButtonClick}
                className={`px-4 py-2 ${theme.button} text-white rounded-lg transition-colors`}
              >
                {savedPlan.trialPeriod ? "Upgrade Now" : "Change Plan"}
              </button>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <span className="font-mono text-lg">**** **** **** 1234</span>
              </div>
              <button className={`${theme.highlightText} hover:opacity-80`}>Change</button>
            </div>
            <button
              className={`w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-${subscriptionType === "enterprise" ? "purple" : subscriptionType === "standard" ? "green" : "blue"}-300 hover:${theme.highlightText} transition-colors`}
            >
              Add New Payment Method
            </button>
          </div>

          {/* Billing History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${theme.tableHeader}`}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.map((invoice, index) => (
                    <tr key={`${invoice.id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${theme.tableHighlight}`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          className={`${theme.highlightText} hover:opacity-80 flex items-center gap-1`}
                          onClick={() => downloadPdf(invoice.id)}
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subscription Badge */}
          {isPremium && (
            <div
              className={`fixed bottom-4 right-4 px-4 py-2 rounded-full shadow-lg ${
                subscriptionType === "enterprise"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
                  : subscriptionType === "premium"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">{subscriptionType.toUpperCase()} Plan Active</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Features Modal */}
      {showFeaturesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 m-4 border-t-4 ${theme.border}`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${theme.highlightText}`}>{savedPlan.name} Plan Features</h2>
              <button onClick={handleCloseFeatures} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Plan details */}
              <div className="flex justify-between">
                <div className="flex items-baseline gap-2 justify-center mb-6">
                  <span className="text-3xl font-bold">${savedPlan.price}</span>
                  <span className="text-gray-500">/{savedPlan.billingCycle === "month" ? "month" : "year"}</span>
                </div>
                <div>
                  <button
                    onClick={manageSubscription}
                    className={`px-4 py-2 ${theme.button} text-white rounded-lg transition-colors`}
                  >
                    Manage Subscription
                  </button>
                </div>
              </div>

              {/* Features list */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Included Features</h3>
                <ul className="space-y-3">
                  {plans
                    .find((p) => p.name === savedPlan.name)
                    ?.features.included.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 ${theme.highlightText} flex-shrink-0`} />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Upgrade button (only show if not on highest tier) */}
              {savedPlan.name !== "ENTERPRISE" && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-gray-600 mb-4">Want more features? Upgrade to a higher tier plan.</p>
                  <button
                    onClick={() => {
                      handleCloseFeatures()
                      handleUpgradeButtonClick()
                    }}
                    className={`w-full px-4 py-3 ${theme.button} text-white rounded-lg transition-colors`}
                  >
                    Upgrade Plan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subscription Upgrade Section */}
      {activeTab === "billing" && showUpgradeSection && (
        <div className={`${themeColors.bg} min-h-screen`}>
          <div className="text-right">
            <button
              onClick={handleBackToBilling}
              className="relative inline-flex items-center justify-center m-3 px-3 py-3 text-lg font-semibold text-blue-600 bg-white border-2 border-blue-600 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:bg-blue-600 hover:text-white hover:scale-105 hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Back to Billing Page
              <span className="absolute bottom-0 right-0 w-full h-full bg-blue-600 rounded-lg opacity-20 transform scale-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-40"></span>
            </button>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Page Header */}
            <div className="text-center mb-20">
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-6">
                Choose Your Subscription Plan
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Flexible pricing that grows with your occupation search needs. All plans include a 15-day free trial.
              </p>

              {/* Billing Cycle Toggle */}
              <div className="mt-12 inline-flex items-center p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setBillingCycle("month")}
                  className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                    billingCycle === "month" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Billed Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("year")}
                  className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                    billingCycle === "year" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Billed Yearly
                  <span className="ml-2 text-sm text-green-600 font-medium">2 Months FREE</span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative bg-white rounded-2xl border ${
                    plan.name === "STANDARD"
                      ? "border-blue-200"
                      : plan.name === "PREMIUM"
                        ? "border-green-200"
                        : plan.name === "ENTERPRISE"
                          ? "border-purple-200"
                          : "border-gray-200"
                  } ${plan.recommended ? "shadow-xl scale-105" : "shadow-lg"}`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-5 left-0 right-0 mx-auto w-fit px-4 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-full">
                      Recommended
                    </div>
                  )}

                  <div className="p-8">
                    {/* Plan Header */}
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                      <div className="mt-4 flex items-baseline justify-center gap-2">
                        <span className="text-4xl font-bold">A${getAdjustedPrice(plan.price)}</span>
                        <span className="text-gray-500">/{billingCycle === "month" ? "mo" : "yr"}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                    </div>

                    {/* Free Trial Badge */}
                    <div className="mb-8 text-center">
                      <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Free 15 Days Trial
                      </span>
                    </div>

                    {/* Features List */}
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-gray-900">Key Features</p>
                      <ul className="space-y-3">
                        {plan.features.included.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3 text-sm">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <button
                      className={`mt-8 w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-medium transition-all duration-200 ${
                        plan.name === "STANDARD"
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                          : plan.name === "PREMIUM"
                            ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                            : plan.name === "ENTERPRISE"
                              ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                              : "bg-gradient-to-r from-blue-600 to-indigo-600"
                      } hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70`}
                      onClick={() => upgradePayment(plan.name, plan)}
                      disabled={processingPlan !== null}
                    >
                      {processingPlan === plan.name ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing Payment...</span>
                        </>
                      ) : (
                        "Subscribe Now"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* --------------------------------------------------------- */}
      {/* Settings Tab Content */}
      {/* --------------------------------------------------------- */}
      {activeTab === "settings" && (
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Company Details + Logo */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              {/* Left: Company Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Company Details</h3>
                </div>
                <form className="space-y-4">
                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={companyDetails.name}
                      onChange={(e) => setCompanyDetails((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter company name"
                      disabled={companyDetails.detailsLocked}
                    />
                    {companyDetails.detailsLocked && (
                      <p className="mt-1 text-sm text-amber-600">
                        Contact info@occupationsearch.com.au to update company details
                      </p>
                    )}
                  </div>

                  {/* Domain */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                    <input
                      type="text"
                      value={companyDetails.domain}
                      onChange={(e) => setCompanyDetails((prev) => ({ ...prev, domain: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter company domain"
                      disabled={companyDetails.detailsLocked}
                    />
                  </div>
                </form>
              </div>

              {/* Right: Logo */}
              <div className="flex flex-col items-center">
                {!logo && (
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:border-blue-300 transition-colors">
                    <div className="flex flex-col items-center justify-center">
                      {isUploadingLogo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-gray-600">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-gray-400 mb-1" />
                          <p className="text-xs text-gray-600 text-center">
                            Click/drag
                            <br />
                            to upload
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo}
                    />
                  </label>
                )}

                {logo && (
                  <div className="relative group w-32 h-32">
                    {/* Logo image is circular */}
                    <img
                      src={logo || "/placeholder.svg"}
                      alt="Company Logo"
                      className="w-32 h-32 object-cover rounded-full border border-gray-200"
                    />
                    {/* Hover overlay for editing */}
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="flex gap-2">
                        {/* Replace Logo Button */}
                        <label className="bg-white text-gray-700 px-3 py-1 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          Edit
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            disabled={isUploadingLogo}
                          />
                        </label>

                        {/* Remove Logo Button */}
                        <button
                          onClick={handleRemoveLogo}
                          disabled={isUploadingLogo}
                          className="bg-white text-red-600 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Email Preferences */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Email Preferences</h3>
            </div>
            <div className="space-y-3">
              {emailPreferences.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-2 md:items-center">
                  {/* Email address */}
                  <input
                    type="email"
                    value={item.address}
                    onChange={(e) => handleEmailAddressChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                  {/* Preference */}
                  <select
                    value={item.preference}
                    onChange={(e) => handleEmailPreferenceChange(index, e.target.value)}
                    className="w-48 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {EMAIL_PREFERENCES.map((pref) => (
                      <option key={pref} value={pref}>
                        {pref}
                      </option>
                    ))}
                  </select>
                  {/* Remove button */}
                  {emailPreferences.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddEmail}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors w-full justify-center"
              >
                <Plus className="w-5 h-5" />
                Add Email
              </button>
            </div>
          </div>

          {/* Address Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Address Details</h3>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Street */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) => setAddress((prev) => ({ ...prev, street: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter street address"
                  />
                </div>
                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter city"
                  />
                </div>
                {/* Country (Select) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    value={address.country}
                    onChange={(e) => setAddress((prev) => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Australia">Australia</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {/* State (Only show if Country === "Australia") */}
                {address.country === "Australia" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter state"
                    />
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Migration Agent Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Migration Agent Info</h3>
            </div>
            <form className="space-y-6">
              {/* Agent Name & MARA Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                  <input
                    type="text"
                    value={migrationAgentInfo.agentName}
                    onChange={(e) => setMigrationAgentInfo((prev) => ({ ...prev, agentName: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter migration agent name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MARA Number</label>
                  <input
                    type="text"
                    value={migrationAgentInfo.maraNumber}
                    onChange={(e) => setMigrationAgentInfo((prev) => ({ ...prev, maraNumber: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter MARA number"
                  />
                </div>
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={migrationAgentInfo.contactEmail}
                  onChange={(e) => setMigrationAgentInfo((prev) => ({ ...prev, contactEmail: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter agent contact email"
                />
              </div>

              {/* Description box */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={migrationAgentInfo.description}
                  onChange={(e) => setMigrationAgentInfo((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional details or notes about the migration service..."
                />
              </div>
            </form>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Social Media</h3>
            </div>

            <div className="space-y-4">
              {socialMedia.map((social, index) => (
                <div key={index} className="flex gap-4">
                  <select
                    value={social.type}
                    onChange={(e) => {
                      // Check if platform is already in use
                      if (
                        socialMedia.some(
                          (sm) => sm.type.toLowerCase() === e.target.value.toLowerCase() && sm !== social,
                        )
                      ) {
                        setError("This social media platform is already added")
                        return
                      }

                      const newSocialMedia = [...socialMedia]
                      newSocialMedia[index].type = e.target.value
                      setSocialMedia(newSocialMedia)
                      setError(null)
                    }}
                    className="w-40 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {ALLOWED_PLATFORMS.map((platform) => (
                      <option key={platform.id} value={platform.id}>
                        {platform.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="url"
                    value={social.url}
                    onChange={(e) => {
                      const newSocialMedia = [...socialMedia]
                      newSocialMedia[index].url = e.target.value
                      setSocialMedia(newSocialMedia)
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter URL"
                  />
                  {socialMedia.length > 1 && (
                    <button
                      onClick={() => handleRemoveSocialMedia(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddSocialMedia}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors w-full justify-center"
              >
                <Plus className="w-5 h-5" />
                Add Social Media
              </button>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <p>{success}</p>
            </div>
          )}

          {/* Save Changes Button */}
          <div className="flex justify-end">
            <button
              disabled={isLoading}
              onClick={handleSaveChanges}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors
                            disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
export default AccountManagement

