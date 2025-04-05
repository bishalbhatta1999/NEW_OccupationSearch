import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';
import { trackUsage, checkUsageLimits } from './subscription';

/**
 * Check if user has access to a feature based on their subscription
 */
export async function hasFeatureAccess(feature: string): Promise<boolean> {
  if (!auth.currentUser) return false;

  try {
    // Get user's tenant
    const membershipsRef = collection(db, 'memberships');
    const q = query(membershipsRef, where('userId', '==', auth.currentUser.uid));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return false;
    
    // Get first tenant (assuming one tenant per user for now)
    const membership = snapshot.docs[0].data();
    const tenantId = membership.tenantId;

    // Get tenant features
    const tenantRef = doc(db, 'tenants', tenantId);
    const tenantSnap = await getDoc(tenantRef);
    
    if (!tenantSnap.exists()) return false;
    
    const features = tenantSnap.data().features;
    return !!features[feature];
  } catch (err) {
    console.error('Error checking feature access:', err);
    return false;
  }
}

/**
 * Track feature usage and check limits
 */
export async function useFeature(feature: string): Promise<boolean> {
  if (!auth.currentUser) return false;

  try {
    // Get user's tenant
    const membershipsRef = collection(db, 'memberships');
    const q = query(membershipsRef, where('userId', '==', auth.currentUser.uid));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return false;
    
    const membership = snapshot.docs[0].data();
    const tenantId = membership.tenantId;

    // Check if usage limit is exceeded
    const isExceeded = await checkUsageLimits(tenantId, feature);
    if (isExceeded) return false;

    // Track usage
    await trackUsage(tenantId, feature);
    return true;
  } catch (err) {
    console.error('Error using feature:', err);
    return false;
  }
}

/**
 * Get tenant usage statistics
 */
export async function getTenantUsage(tenantId: string) {
  try {
    const usageRef = doc(db, 'usage', tenantId);
    const usageSnap = await getDoc(usageRef);
    
    if (!usageSnap.exists()) {
      return {
        occupationSearches: 0,
        savedSearches: 0,
        teamMembers: 0
      };
    }

    return usageSnap.data();
  } catch (err) {
    console.error('Error getting tenant usage:', err);
    throw err;
  }
}

/**
 * Reset monthly usage metrics
 */
export async function resetMonthlyUsage(tenantId: string) {
  try {
    const usageRef = doc(db, 'usage', tenantId);
    await updateDoc(usageRef, {
      occupationSearches: 0,
      lastReset: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error resetting usage:', err);
    throw err;
  }
}