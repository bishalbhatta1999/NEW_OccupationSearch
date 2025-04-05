import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Tenant } from '../types/tenant';

interface TenantContextType {
  currentTenant: Tenant | null;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  currentTenant: null,
  loading: true,
  error: null
});

export const useTenant = () => useContext(TenantContext);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged(async (user) => {
      setLoading(true);
      setError(null);

      try {
        if (!user) {
          setCurrentTenant(null);
          return;
        }

        // Get user's claims to find tenantId
        const token = await user.getIdTokenResult();
        const tenantId = token.claims.tenantId;

        if (!tenantId) {
          setCurrentTenant(null);
          return;
        }

        // Fetch tenant details
        const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
        if (!tenantDoc.exists()) {
          throw new Error('Tenant not found');
        }

        setCurrentTenant(tenantDoc.data() as Tenant);
      } catch (err) {
        console.error('Error fetching tenant:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tenant');
        setCurrentTenant(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <TenantContext.Provider value={{ currentTenant, loading, error }}>
      {children}
    </TenantContext.Provider>
  );
};