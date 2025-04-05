import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface UserContextType {
  currentUser: any;
  companyId: string | null;
  loading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  companyId: null,
  loading: true,
  error: null
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      setError(null);

      try {
        if (!user) {
          setCurrentUser(null);
          setCompanyId(null);
          return;
        }

        // Get user document
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          throw new Error('User document not found');
        }

        const userData = userDoc.data();
        setCurrentUser(userData);
        setCompanyId(userData.companyId || null);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, companyId, loading, error }}>
      {children}
    </UserContext.Provider>
  );
};