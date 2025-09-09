import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import authStorage from './auth-storage';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get auth header from storage
    const authHeader = authStorage.getAuthHeader();

    if (authHeader && config.headers) {
      config.headers.Authorization = authHeader;
    }

    // Log request for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
        {
          headers: config.headers,
          data: config.data,
        }
      );
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration and errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful response for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          status: response.status,
          data: response.data,
        }
      );
    }

    return response;
  },
  (error: AxiosError) => {
    const { response, config } = error;

    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error(
        `❌ API Error: ${config?.method?.toUpperCase()} ${config?.url}`,
        {
          status: response?.status,
          data: response?.data,
          message: error.message,
        }
      );
    }

    // Handle different error scenarios
    if (response) {
      switch (response.status) {
        case 401:
          // Token expired or invalid
          console.warn('Authentication failed - clearing stored tokens');
          authStorage.clearAll();

          // Redirect to login page if not already there
          if (
            typeof window !== 'undefined' &&
            !window.location.pathname.includes('/login')
          ) {
            window.location.href = '/login';
          }
          break;

        case 403:
          // Forbidden - user doesn't have permission
          console.warn('Access forbidden - insufficient permissions');
          break;

        case 404:
          // Not found
          console.warn('Resource not found');
          break;

        case 422:
          // Validation error
          console.warn('Validation error:', response.data);
          break;

        case 429:
          // Rate limiting
          console.warn('Rate limit exceeded - please try again later');
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          console.error('Server error - please try again later');
          break;

        default:
          console.error('Unexpected error:', response.status, response.data);
      }
    } else if (error.code === 'ECONNABORTED') {
      // Request timeout
      console.error('Request timeout - please check your connection');
    } else if (error.message === 'Network Error') {
      // Network error
      console.error('Network error - please check your internet connection');
    }

    return Promise.reject(error);
  }
);

// Utility functions for common API operations
export const apiUtils = {
  // GET request
  get: <T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return apiClient.get<T>(url, config);
  },

  // POST request
  post: <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, data, config);
  },

  // PUT request
  put: <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return apiClient.put<T>(url, data, config);
  },

  // PATCH request
  patch: <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return apiClient.patch<T>(url, data, config);
  },

  // DELETE request
  delete: <T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return apiClient.delete<T>(url, config);
  },

  // Upload file
  upload: <T = unknown>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Check if token is expiring soon and refresh if needed
  checkAndRefreshToken: async (): Promise<boolean> => {
    if (authStorage.willExpireSoon(5)) {
      // 5 minutes before expiration
      try {
        const refreshToken = authStorage.getRefreshToken();
        if (refreshToken) {
          const response = await apiClient.post('/api/auth/refresh', {
            refreshToken,
          });

          if (response.data.success && response.data.token) {
            authStorage.setToken(
              response.data.token,
              response.data.expiresIn,
              response.data.refreshToken
            );
            return true;
          }
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        authStorage.clearAll();
        return false;
      }
    }
    return authStorage.isTokenValid();
  },
};

// Export the configured axios instance
export default apiClient;

// Export types for use in components
export type { AxiosResponse, AxiosError, AxiosRequestConfig };
