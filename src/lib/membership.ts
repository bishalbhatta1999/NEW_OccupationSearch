import { 
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';

export type MemberRole = 'owner' | 'admin' | 'member';

export interface Membership {
  userId: string;
  tenantId: string;
  role: MemberRole;
  createdAt: string;
}

/**
 * Get user's memberships across all tenants
 */
export async function getUserMemberships(userId: string): Promise<Membership[]> {
  const q = query(
    collection(db, 'memberships'),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Membership);
}

/**
 * Get all members for a tenant
 */
export async function getTenantMembers(tenantId: string): Promise<Membership[]> {
  const q = query(
    collection(db, 'memberships'),
    where('tenantId', '==', tenantId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Membership);
}

/**
 * Add a member to a tenant
 */
export async function addMember(
  tenantId: string,
  userId: string,
  role: MemberRole = 'member'
): Promise<void> {
  // Check if user exists
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  // Check if membership already exists
  const membershipId = `${userId}_${tenantId}`;
  const membershipDoc = await getDoc(doc(db, 'memberships', membershipId));
  if (membershipDoc.exists()) {
    throw new Error('User is already a member of this tenant');
  }

  // Create membership
  await setDoc(doc(db, 'memberships', membershipId), {
    userId,
    tenantId,
    role,
    createdAt: new Date().toISOString()
  });
}

/**
 * Remove a member from a tenant
 */
export async function removeMember(tenantId: string, userId: string): Promise<void> {
  const membershipId = `${userId}_${tenantId}`;
  await deleteDoc(doc(db, 'memberships', membershipId));
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  tenantId: string,
  userId: string,
  newRole: MemberRole
): Promise<void> {
  const membershipId = `${userId}_${tenantId}`;
  const membershipRef = doc(db, 'memberships', membershipId);
  
  const membershipDoc = await getDoc(membershipRef);
  if (!membershipDoc.exists()) {
    throw new Error('Membership not found');
  }

  // Prevent removing the last owner
  if (membershipDoc.data().role === 'owner' && newRole !== 'owner') {
    const owners = await getDocs(
      query(
        collection(db, 'memberships'),
        where('tenantId', '==', tenantId),
        where('role', '==', 'owner')
      )
    );
    if (owners.size === 1) {
      throw new Error('Cannot remove the last owner');
    }
  }

  await setDoc(membershipRef, { role: newRole }, { merge: true });
}