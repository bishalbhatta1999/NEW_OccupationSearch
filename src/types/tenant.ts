// Tenant Types
export interface Tenant {
  id: string;
  name: string;
  domain: string;
  plan: string;
  status: 'active' | 'suspended' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  settings: TenantSettings;
  features: TenantFeatures;
  billing: TenantBilling;
}

export interface TenantSettings {
  timezone: string;
  dateFormat: string;
  theme: {
    primaryColor: string;
    logo?: string;
    favicon?: string;
  };
  security: {
    mfaRequired: boolean;
    passwordPolicy: {
      minLength: number;
      requireSpecialChars: boolean;
      requireNumbers: boolean;
      requireUppercase: boolean;
    };
    sessionTimeout: number;
  };
}

export interface TenantFeatures {
  occupationSearchLimit: number;
  savedSearchesLimit: number;
  customAlerts: boolean;
  batchProcessing: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  teamMembersLimit: number;
  dataExports: boolean;
  advancedAnalytics: boolean;
}

export interface TenantBilling {
  subscriptionId: string;
  plan: string;
  status: 'active' | 'past_due' | 'cancelled';
  billingEmail: string;
  paymentMethod: {
    type: 'card' | 'direct_debit';
    last4?: string;
    expiryDate?: string;
  };
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}