import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import type { Tenant, TenantSettings, TenantFeatures, TenantBilling } from '../types/tenant';
import { subscriptionPlans, type SubscriptionTier } from '../types/subscription';

/**
 * Create a new tenant in Firestore
 */
export async function createTenant(
  name: string,
  domain: string,
  plan: SubscriptionTier = 'free'
): Promise<Tenant> {
  if (!auth.currentUser) {
    throw new Error('Must be authenticated to create tenant');
  }

  const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  
  const tenant: Tenant = {
    id: tenantId,
    name,
    domain,
    plan,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: getDefaultSettings(),
    features: getFeaturesByPlan(plan),
    billing: getDefaultBilling(plan)
  };

  // Create tenant doc
  await setDoc(doc(db, 'tenants', tenantId), tenant);

  // Create membership doc linking user to tenant
  await setDoc(doc(db, 'memberships', `${auth.currentUser.uid}_${tenantId}`), {
    userId: auth.currentUser.uid,
    tenantId,
    role: 'owner',
    createdAt: new Date().toISOString()
  });

  return tenant;
}

/**
 * Get tenant by ID
 */
export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const docRef = doc(db, 'tenants', tenantId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() as Tenant : null;
}

/**
 * Update tenant settings
 */
export async function updateTenantSettings(
  tenantId: string, 
  settings: Partial<TenantSettings>
): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId);
  await updateDoc(docRef, {
    settings: settings,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Update tenant features based on plan
 */
export async function updateTenantFeatures(
  tenantId: string,
  plan: SubscriptionTier
): Promise<void> {
  const features = getFeaturesByPlan(plan);
  const docRef = doc(db, 'tenants', tenantId);
  await updateDoc(docRef, {
    features,
    plan,
    updatedAt: new Date().toISOString()
  });
}

// Helper functions

function getDefaultSettings(): TenantSettings {
  return {
    timezone: 'Australia/Sydney',
    dateFormat: 'DD/MM/YYYY',
    theme: {
      primaryColor: '#2563eb'
    },
    security: {
      mfaRequired: false,
      passwordPolicy: {
        minLength: 8,
        requireSpecialChars: true,
        requireNumbers: true,
        requireUppercase: true
      },
      sessionTimeout: 3600 // 1 hour
    }
  };
}

function getFeaturesByPlan(plan: SubscriptionTier): TenantFeatures {
  const planFeatures = subscriptionPlans.find(p => p.id === plan)?.features;
  if (!planFeatures) {
    throw new Error(`Invalid plan: ${plan}`);
  }
  return planFeatures;
}

function getDefaultBilling(plan: SubscriptionTier): TenantBilling {
  return {
    subscriptionId: '',
    plan,
    status: 'active',
    billingEmail: '',
    paymentMethod: {
      type: 'card'
    },
    billingAddress: {
      line1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Australia'
    }
  };
}