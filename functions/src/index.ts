import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

admin.initializeApp();


/**
 * Creates a new tenant and user with specified role
 */
export const createTenantUser = functions.https.onCall(async (data, context) => {
  // Verify caller is super admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userDoc = await admin.firestore().doc(`users/${context.auth.uid}`).get();
  if (!userDoc.exists || userDoc.data()?.role !== 'superAdmin') {
    throw new functions.https.HttpsError('permission-denied', 'Only superadmins can create users');
  }

  const { email, password, tenantId, role } = data;
  if (!email || !password || !tenantId || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    // Create the user in Firebase Auth
    const user = await admin.auth().createUser({
      email,
      password,
      emailVerified: false
    });

    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, { role, tenantId });

    // Create user document in Firestore
    await admin.firestore().collection('users').doc(user.uid).set({
      uid: user.uid,
      email,
      tenantId,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create membership document
    await admin.firestore().collection('memberships').doc(`${user.uid}_${tenantId}`).set({
      userId: user.uid,
      tenantId,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { uid: user.uid };
  } catch (error) {
    console.error('Error creating tenant user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create user');
  }
});

/**
 * Creates a new tenant and sets up initial data structure
 */
export const createTenant = functions.https.onCall(async (data, context) => {
  // Verify caller is super admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userDoc = await admin.firestore().doc(`users/${context.auth.uid}`).get();
  if (!userDoc.exists || userDoc.data()?.role !== 'superAdmin') {
    throw new functions.https.HttpsError('permission-denied', 'Must be super admin');
  }

  const { name, domain, plan = 'free' } = data;
  if (!name || !domain) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Create tenant document
    await admin.firestore().doc(`tenants/${tenantId}`).set({
      id: tenantId,
      name,
      domain,
      plan,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { tenantId };
  } catch (error) {
    console.error('Error creating tenant:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create tenant');
  }
});

/**
 * Updates user custom claims when role or tenant changes
 */
export const updateUserClaims = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    const after = change.after.data();
    const before = change.before.data();

    // Skip if no data changes affecting claims
    if (!after || (before && 
        before.role === after.role && 
        before.tenantId === after.tenantId)) {
      return null;
    }

    try {
      const claims = {
        role: after.role || 'user',
        tenantId: after.tenantId
      };

      await admin.auth().setCustomUserClaims(context.params.userId, claims);
      
      // Update user doc to indicate claims were set
      await change.after.ref.update({
        claimsUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      return null;
    } catch (error) {
      console.error('Error updating custom claims:', error);
      return null;
    }
});

/**
 * Handles tenant deletion cleanup
 */
export const onTenantDelete = functions.firestore
  .document('tenants/{tenantId}')
  .onDelete(async (snap, context) => {
    const tenantId = context.params.tenantId;
    const batch = admin.firestore().batch();

    try {
      // Delete all memberships for this tenant
      const memberships = await admin.firestore()
        .collection('memberships')
        .where('tenantId', '==', tenantId)
        .get();

      memberships.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Update users to remove tenantId
      const users = await admin.firestore()
        .collection('users')
        .where('tenantId', '==', tenantId)
        .get();

      users.docs.forEach(doc => {
        batch.update(doc.ref, {
          tenantId: admin.firestore.FieldValue.delete()
        });
      });

      await batch.commit();
      return null;
    } catch (error) {
      console.error('Error cleaning up tenant:', error);
      return null;
    }
});


