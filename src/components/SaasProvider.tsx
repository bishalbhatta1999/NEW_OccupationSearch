import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getTenantUsage } from '../lib/saas';
import { subscriptionPlans } from '../types/subscription';

interface SaasContextType {
  currentPlan: string;
  usage: {
    occupationSearches: number;
    savedSearches: number;
    teamMembers: number;
  };
  isLoading: boolean;
  error: string | null;
}

const SaasContext = createContext<SaasContextType>({
  currentPlan: 'free',
  usage: {
    occupationSearches: 0,
    savedSearches: 0,
    teamMembers: 0
  },
  isLoading: true,
  error: null
});

export const useSaas = () => useContext(SaasContext);

export const SaasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPlan, setCurrentPlan] = useState('free');
  const [usage, setUsage] = useState({
    occupationSearches: 0,
    savedSearches: 0,
    teamMembers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSaasData = async () => {
      if (!auth.currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        // Get tenant ID from memberships
        const membershipsRef = collection(db, 'memberships');
        const q = query(membershipsRef, where('userId', '==', auth.currentUser.uid));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const membership = snapshot.docs[0].data();
          const tenantId = membership.tenantId;

          // Get tenant data
          const tenantRef = doc(db, 'tenants', tenantId);
          const tenantSnap = await getDoc(tenantRef);
          
          if (tenantSnap.exists()) {
            const tenantData = tenantSnap.data();
            setCurrentPlan(tenantData.plan);

            // Get usage data
            const usageData = await getTenantUsage(tenantId);
            setUsage(usageData);
          }
        }

        setError(null);
      } catch (err) {
        console.error('Error loading SaaS data:', err);
        setError('Failed to load subscription data');
      } finally {
        setIsLoading(false);
      }
    };

    loadSaasData();
  }, []);

  return (
    <SaasContext.Provider value={{ currentPlan, usage, isLoading, error }}>
      {children}
    </SaasContext.Provider>
  );
};