interface TokenData {
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

interface StoredTokenData {
  data: string; // encrypted token data
  timestamp: number;
}

class AuthTokenStorage {
  private readonly TOKEN_KEY = 'auth_token_data';
  private readonly ENCRYPTION_KEY = 'poc_study_tool_auth_key';

  /**
   * Simple encryption using base64 encoding with a salt
   * Note: For production, consider using a more robust encryption library
   */
  private encrypt(data: string): string {
    try {
      const salt = Math.random().toString(36).substring(2, 15);
      const encoded = btoa(salt + '|' + data);
      return encoded;
    } catch (error) {
      console.error('Encryption failed:', error);
      return data; // Fallback to unencrypted
    }
  }

  /**
   * Simple decryption for base64 encoded data with salt
   */
  private decrypt(encryptedData: string): string {
    try {
      const decoded = atob(encryptedData);
      const parts = decoded.split('|');
      if (parts.length >= 2) {
        return parts.slice(1).join('|'); // Remove salt, rejoin in case data contained |
      }
      return decoded; // Fallback for data without salt
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData; // Fallback to original data
    }
  }

  /**
   * Check if we're in a browser environment
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Store authentication token with expiration
   */
  setToken(token: string, expiresIn?: number, refreshToken?: string): boolean {
    if (!this.isBrowser()) {
      console.warn('Token storage not available in server environment');
      return false;
    }

    try {
      const expiresAt = expiresIn 
        ? Date.now() + (expiresIn * 1000) // Convert seconds to milliseconds
        : Date.now() + (24 * 60 * 60 * 1000); // Default 24 hours

      const tokenData: TokenData = {
        token,
        expiresAt,
        refreshToken
      };

      const encryptedData = this.encrypt(JSON.stringify(tokenData));
      const storedData: StoredTokenData = {
        data: encryptedData,
        timestamp: Date.now()
      };

      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(storedData));
      return true;
    } catch (error) {
      console.error('Failed to store token:', error);
      return false;
    }
  }

  /**
   * Retrieve authentication token if valid
   */
  getToken(): string | null {
    if (!this.isBrowser()) {
      return null;
    }

    try {
      const storedItem = localStorage.getItem(this.TOKEN_KEY);
      if (!storedItem) {
        return null;
      }

      const storedData: StoredTokenData = JSON.parse(storedItem);
      const decryptedData = this.decrypt(storedData.data);
      const tokenData: TokenData = JSON.parse(decryptedData);

      // Check if token is expired
      if (Date.now() > tokenData.expiresAt) {
        this.removeToken(); // Clean up expired token
        return null;
      }

      return tokenData.token;
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      this.removeToken(); // Clean up corrupted data
      return null;
    }
  }

  /**
   * Get refresh token if available
   */
  getRefreshToken(): string | null {
    if (!this.isBrowser()) {
      return null;
    }

    try {
      const storedItem = localStorage.getItem(this.TOKEN_KEY);
      if (!storedItem) {
        return null;
      }

      const storedData: StoredTokenData = JSON.parse(storedItem);
      const decryptedData = this.decrypt(storedData.data);
      const tokenData: TokenData = JSON.parse(decryptedData);

      return tokenData.refreshToken || null;
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  }

  /**
   * Check if token exists and is valid
   */
  isTokenValid(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(): Date | null {
    if (!this.isBrowser()) {
      return null;
    }

    try {
      const storedItem = localStorage.getItem(this.TOKEN_KEY);
      if (!storedItem) {
        return null;
      }

      const storedData: StoredTokenData = JSON.parse(storedItem);
      const decryptedData = this.decrypt(storedData.data);
      const tokenData: TokenData = JSON.parse(decryptedData);

      return new Date(tokenData.expiresAt);
    } catch (error) {
      console.error('Failed to get token expiration:', error);
      return null;
    }
  }

  /**
   * Check if token will expire within specified minutes
   */
  willExpireSoon(minutes: number = 5): boolean {
    const expiration = this.getTokenExpiration();
    if (!expiration) {
      return true; // Consider no token as "expiring soon"
    }

    const warningTime = Date.now() + (minutes * 60 * 1000);
    return expiration.getTime() <= warningTime;
  }

  /**
   * Remove authentication token
   */
  removeToken(): void {
    if (!this.isBrowser()) {
      return;
    }

    try {
      localStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  }

  /**
   * Clear all authentication data
   */
  clearAll(): void {
    if (!this.isBrowser()) {
      return;
    }

    try {
      // Remove token data
      this.removeToken();
      
      // Remove any other auth-related items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('auth') || key.includes('token'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  /**
   * Get token with Bearer prefix for API calls
   */
  getAuthHeader(): string | null {
    const token = this.getToken();
    return token ? `Bearer ${token}` : null;
  }

  /**
   * Update token expiration time
   */
  extendTokenExpiration(additionalSeconds: number): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    try {
      const storedItem = localStorage.getItem(this.TOKEN_KEY);
      if (!storedItem) {
        return false;
      }

      const storedData: StoredTokenData = JSON.parse(storedItem);
      const decryptedData = this.decrypt(storedData.data);
      const tokenData: TokenData = JSON.parse(decryptedData);

      // Extend expiration
      tokenData.expiresAt += (additionalSeconds * 1000);

      // Re-encrypt and store
      const encryptedData = this.encrypt(JSON.stringify(tokenData));
      const newStoredData: StoredTokenData = {
        data: encryptedData,
        timestamp: Date.now()
      };

      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(newStoredData));
      return true;
    } catch (error) {
      console.error('Failed to extend token expiration:', error);
      return false;
    }
  }
}

// Create singleton instance
const authStorage = new AuthTokenStorage();

export default authStorage;

// Export individual functions for convenience
export const {
  setToken,
  getToken,
  getRefreshToken,
  isTokenValid,
  getTokenExpiration,
  willExpireSoon,
  removeToken,
  clearAll,
  getAuthHeader,
  extendTokenExpiration
} = authStorage;
