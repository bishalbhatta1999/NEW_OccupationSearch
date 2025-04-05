import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { updateTenantFeatures } from './tenant';
import type { SubscriptionTier } from '../types/subscription';

/**
 * Update tenant's subscription plan
 */
export async function updateSubscription(
  tenantId: string,
  plan: SubscriptionTier
): Promise<void> {
  const tenantRef = doc(db, 'tenants', tenantId);
  const tenantSnap = await getDoc(tenantRef);

  if (!tenantSnap.exists()) {
    throw new Error('Tenant not found');
  }

  // Update plan and features
  await Promise.all([
    updateDoc(tenantRef, {
      plan,
      'billing.plan': plan,
      updatedAt: new Date().toISOString()
    }),
    updateTenantFeatures(tenantId, plan)
  ]);
}

/**
 * Check if tenant has exceeded usage limits
 */
export async function checkUsageLimits(
  tenantId: string,
  metric: keyof typeof usageMetrics
): Promise<boolean> {
  const tenantRef = doc(db, 'tenants', tenantId);
  const usageRef = doc(db, 'usage', tenantId);

  const [tenantSnap, usageSnap] = await Promise.all([
    getDoc(tenantRef),
    getDoc(usageRef)
  ]);

  if (!tenantSnap.exists()) {
    throw new Error('Tenant not found');
  }

  const tenant = tenantSnap.data();
  const usage = usageSnap.exists() ? usageSnap.data() : { [metric]: 0 };
  const limit = tenant.features[usageMetrics[metric].feature];

  // -1 indicates unlimited
  if (limit === -1) return false;

  return usage[metric] >= limit;
}

// Usage tracking metrics
const usageMetrics = {
  occupationSearches: {
    feature: 'occupationSearchLimit',
    resetPeriod: 'monthly'
  },
  savedSearches: {
    feature: 'savedSearchesLimit', 
    resetPeriod: 'none'
  },
  teamMembers: {
    feature: 'teamMembersLimit',
    resetPeriod: 'none'
  }
} as const;

/**
 * Track usage for a specific metric
 */
export async function trackUsage(
  tenantId: string,
  metric: keyof typeof usageMetrics,
  increment: number = 1
): Promise<void> {
  const usageRef = doc(db, 'usage', tenantId);
  const usageSnap = await getDoc(usageRef);

  if (!usageSnap.exists()) {
    // Create initial usage doc
    await updateDoc(usageRef, {
      [metric]: increment,
      lastReset: new Date().toISOString()
    });
  } else {
    // Increment existing metric
    await updateDoc(usageRef, {
      [metric]: usageSnap.data()[metric] + increment
    });
  }
}