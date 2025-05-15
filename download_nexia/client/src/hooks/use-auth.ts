import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChanged, auth } from '@/lib/firebase';

// Hook to get the current auth state
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup function
    return () => unsubscribe();
  }, []);

  return { user, loading, error };
}

// Hook to get the current user's ID token
export function useUserIdToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuthState();

  useEffect(() => {
    const getToken = async () => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
        } catch (err) {
          setError(err as Error);
        } finally {
          setLoading(false);
        }
      } else {
        setToken(null);
        setLoading(false);
      }
    };

    getToken();
  }, [user]);

  return { token, loading, error };
}

// Check if user is authenticated
export function useIsAuthenticated() {
  const { user, loading } = useAuthState();
  return { isAuthenticated: !!user, loading };
}
