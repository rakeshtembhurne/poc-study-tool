"use client"; // required in Next.js 13+ for context providers

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import authStorage from "@/lib/auth-storage";
import { AxiosRequestConfig } from "axios";

type User = {
  id: string;
  name: string;
  email: string;
} | null;

type AuthContextType = {
  user: User;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User, expiresIn?: number, refreshToken?: string) => void;
  logout: () => void;
  refreshAuth: () => void;
  isTokenExpiringSoon: (minutes?: number) => boolean;
  getAuthHeader: () => string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = authStorage.getToken();
        if (storedToken) {
          setToken(storedToken);
          // In a real app, you might want to validate the token with the backend
          // and fetch user data. For now, we'll just mark as authenticated.
          setUser({ id: '', name: '', email: '' }); // Placeholder user data
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        authStorage.clearAll(); // Clear corrupted data
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Set up token expiration monitoring
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiration = () => {
      if (!authStorage.isTokenValid()) {
        logout();
      }
    };

    // Check token validity every minute
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [token]);

  const login = (
    newToken: string, 
    userData: User, 
    expiresIn?: number, 
    refreshToken?: string
  ) => {
    const success = authStorage.setToken(newToken, expiresIn, refreshToken);
    
    if (success) {
      setToken(newToken);
      setUser(userData);
    } else {
      throw new Error('Failed to store authentication token');
    }
  };

  const logout = () => {
    authStorage.clearAll();
    setToken(null);
    setUser(null);
  };

  const refreshAuth = () => {
    const currentToken = authStorage.getToken();
    if (currentToken) {
      setToken(currentToken);
    } else {
      logout();
    }
  };

  const isTokenExpiringSoon = (minutes: number = 5): boolean => {
    return authStorage.willExpireSoon(minutes);
  };

  const getAuthHeader = (): string | null => {
    return authStorage.getAuthHeader();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      isAuthenticated: !!token && !!user,
      isLoading,
      login, 
      logout,
      refreshAuth,
      isTokenExpiringSoon,
      getAuthHeader
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
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
    const { apiUtils } = await import('@/lib/axios-config');
    
    try {
      // Use axios for the request
      const response = await apiUtils.get(url, options as AxiosRequestConfig);
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
