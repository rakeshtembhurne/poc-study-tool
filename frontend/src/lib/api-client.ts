// utils/apiClient.ts
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getToken, getRefreshToken, setToken, removeToken, willExpireSoon } from './auth-storage';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log("config: ",apiClient);

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor for auth and proactive refresh
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get token from secure storage
    const token = typeof window !== 'undefined' ? getToken() : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Check if token will expire soon and refresh proactively
      if (typeof window !== 'undefined' && willExpireSoon(5)) { // 5 minutes before expiry
        try {
          await refreshTokenIfNeeded();
          // Get the new token after refresh
          const newToken = getToken();
          if (newToken) {
            config.headers.Authorization = `Bearer ${newToken}`;
          }
        } catch (error) {
          console.warn('Proactive token refresh failed:', error);
          // Continue with existing token, let response interceptor handle expiry
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 errors and automatic refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshTokenIfNeeded();
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          removeToken();
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other error statuses
    if (error.response?.status === 403) {
      console.error('Access forbidden - insufficient permissions');
    } else if (error.response?.status === 404) {
      console.error('Resource not found');
    } else if (error.response?.status && error.response.status >= 500) {
      console.error('Server error occurred');
    }

    return Promise.reject(error);
  }
);

// Helper function to refresh tokens
const refreshTokenIfNeeded = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;

  const refreshToken = getRefreshToken();
  const userId = getUserIdFromStorage();

  if (!refreshToken || !userId) {
    throw new Error('No refresh token or user ID available');
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        refreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Token refresh failed');
    }

    // Store new tokens
    const success = setToken(
      data.accessToken,
      data.expiresIn,
      data.refreshToken
    );

    if (!success) {
      throw new Error('Failed to store new tokens');
    }

    return data.accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

// Helper function to get user ID from storage
const getUserIdFromStorage = (): string | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
  } catch (error) {
    console.error('Failed to get user ID from storage:', error);
  }
  return null;
};

export default apiClient;
