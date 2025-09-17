'use client'; // required in Next.js 13+ for context providers

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import authStorage from '@/lib/auth-storage';
import { AxiosRequestConfig } from 'axios';
import apiClient from '@/lib/api-client';

type User = {
  id: string;
  email: string;
} | null;

type AuthContextType = {
  user: User;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    token: string,
    userData: User,
    expiresIn?: number,
    refreshToken?: string
  ) => void;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
  isTokenExpiringSoon: (minutes?: number) => boolean;
  getAuthHeader: () => string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize auth state on mount with proper token validation
  useEffect(() => {
    const initializeAuth = async () => {
      if (!isMountedRef.current) return;

      try {
        // Check if we have a stored token
        const storedToken = authStorage.getToken();

        if (storedToken) {
          // Token exists, validate it
          if (authStorage.isTokenValid()) {
            // Token is valid, restore auth state
            if (isMountedRef.current) {
              setToken(storedToken);

              // Try to get user data from localStorage
              const userStr = localStorage.getItem('user');
              if (userStr) {
                const userData = JSON.parse(userStr);
                setUser(userData);
              } else {
                setUser({ id: '', email: '' }); // Placeholder user data
              }
            }
          } else {
            // Token is expired, try to refresh
            console.log('Token expired, attempting refresh...');
            const refreshed = await refreshAuth();

            if (!refreshed && isMountedRef.current) {
              // Refresh failed, clear auth state
              console.log('Token refresh failed, clearing auth state');
              authStorage.clearAll();
              localStorage.removeItem('user');
            }
          }
        } else {
          // No token found, user needs to login
          console.log('No token found, user needs to authenticate');
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        if (isMountedRef.current) {
          authStorage.clearAll(); // Clear corrupted data
          localStorage.removeItem('user');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Set up token expiration monitoring
  useEffect(() => {
    if (!token || !isMountedRef.current) return;

    const checkTokenExpiration = async () => {
      if (!isMountedRef.current) return;

      if (!authStorage.isTokenValid()) {
        // Try to refresh token before logging out
        const refreshed = await refreshAuth();
        if (!refreshed && isMountedRef.current) {
          logout();
        }
      }
    };

    // Check token validity every minute
    intervalRef.current = setInterval(checkTokenExpiration, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [token]);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const login = (
    newToken: string,
    userData: User,
    expiresIn?: number,
    refreshToken?: string
  ) => {
    console.log('Login successful!');
    const success = authStorage.setToken(newToken, expiresIn, refreshToken);
    localStorage.setItem(
      'user',
      JSON.stringify({ id: userData?.id || '', email: userData?.email || '' })
    );

    if (success) {
      setToken(newToken);
      setUser(userData);
    } else {
      throw new Error('Failed to store authentication token');
    }
  };

  const logout = () => {
    authStorage.clearAll();
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const refreshAuth = async (): Promise<boolean> => {
    try {
      const refreshToken = authStorage.getRefreshToken();
      const userStr = localStorage.getItem('user');

      if (!refreshToken || !userStr) {
        return false;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && isMountedRef.current) {
        const success = authStorage.setToken(
          data.accessToken,
          data.expiresIn,
          data.refreshToken
        );

        if (success) {
          setToken(data.accessToken);

          // Restore user data if we don't have it
          if (!user && userStr) {
            const userData = JSON.parse(userStr);
            setUser(userData);
          }

          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  const isTokenExpiringSoon = (minutes: number = 5): boolean => {
    return authStorage.willExpireSoon(minutes);
  };

  const getAuthHeader = (): string | null => {
    return authStorage.getAuthHeader();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        refreshAuth,
        isTokenExpiringSoon,
        getAuthHeader,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};

// Hook for protected routes
export const useRequireAuth = () => {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Redirect to login page
      window.location.href = '/login';
    }
  }, [auth.isAuthenticated, auth.isLoading]);

  return auth;
};

// Hook for API calls with automatic token inclusion
export const useAuthenticatedFetch = () => {
  const { logout } = useAuth();

  return async (url: string, options: RequestInit = {}) => {
    try {
      // Use axios for the request
      const response = await apiClient.get(url, options as AxiosRequestConfig);
      return response;
    } catch (error: any) {
      // Handle token expiration (already handled by axios interceptor)
      if (error.response?.status === 401) {
        logout();
        throw new Error('Authentication expired. Please log in again.');
      }
      throw error;
    }
  };
};
