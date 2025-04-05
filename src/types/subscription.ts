// Subscription tiers and features
export type SubscriptionTier = 'standard' | 'premium' | 'enterprise';
export interface SubscriptionFeatures {
  occupationSearchLimit: number;
  savedSearches: number;
  emailNewsletters: boolean;
  whiteLabeling: boolean;
  documentChecklist: boolean;
  reportDownloads: boolean;
  emailReports: boolean;
  widgetIntegration: boolean;
  widgetCustomization: boolean;
  leadGeneration: boolean;
  leadNotifications: boolean;
  leadExports: boolean;
  personalizedBranding: boolean;
  webhookIntegration: boolean;
  bannerIntegration: boolean;
  emailSignature: boolean;
  customAlerts: boolean;
  batchProcessing: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  teamMembers: number;
  dataExports: boolean;
  advancedAnalytics: boolean;
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  billingPeriod: 'monthly' | 'annual';
  features: SubscriptionFeatures;
  description: string;
}

// Default subscription plans
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'standard',
    name: 'Standard',
    price: 29,
    billingPeriod: 'monthly',
    features: {
      occupationSearchLimit: -1, // Unlimited
      savedSearches: -1, // Unlimited
      emailNewsletters: true,
      whiteLabeling: true,
      documentChecklist: false,
      reportDownloads: true,
      emailReports: true,
      widgetIntegration: false,
      widgetCustomization: false,
      leadGeneration: false,
      leadNotifications: false,
      leadExports: false,
      personalizedBranding: false,
      webhookIntegration: false,
      bannerIntegration: false,
      emailSignature: false,
      customAlerts: false,
      batchProcessing: false,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
      teamMembers: 1,
      dataExports: false,
      advancedAnalytics: false
    },
    description: 'Perfect for individuals and small businesses'
  },
  {
    id: 'Premium',
    name: 'Premium',
    price: 79,
    billingPeriod: 'monthly',
    features: {
      occupationSearchLimit: -1,
      savedSearches: -1,
      emailNewsletters: true,
      whiteLabeling: true,
      documentChecklist: true,
      reportDownloads: true,
      emailReports: true,
      widgetIntegration: true,
      widgetCustomization: true,
      leadGeneration: true,
      leadNotifications: true,
      leadExports: true,
      personalizedBranding: true,
      webhookIntegration: false,
      bannerIntegration: false,
      emailSignature: false,
      customAlerts: true,
      batchProcessing: false,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
      teamMembers: 3,
      dataExports: true,
      advancedAnalytics: false
    },
    description: 'Ideal for growing migration agencies'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    billingPeriod: 'monthly',
    features: {
      occupationSearchLimit: -1,
      savedSearches: -1,
      emailNewsletters: true,
      whiteLabeling: true,
      documentChecklist: true,
      reportDownloads: true,
      emailReports: true,
      widgetIntegration: true,
      widgetCustomization: true,
      leadGeneration: true,
      leadNotifications: true,
      leadExports: true,
      personalizedBranding: true,
      webhookIntegration: true,
      bannerIntegration: true,
      emailSignature: true,
      customAlerts: true,
      batchProcessing: true,
      apiAccess: true,
      prioritySupport: true,
      customBranding: true,
      teamMembers: -1,
      dataExports: true,
      advancedAnalytics: true
    },
    description: 'For large organizations with advanced needs'
  }
];