import CryptoJS from 'crypto-js';

interface TokenData {
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

interface StoredTokenData {
  data: string; // AES encrypted token data
  salt: string; // Random salt for key derivation
  iv: string; // Initialization vector for AES
  timestamp: number;
}

interface EncryptionResult {
  encryptedData: string;
  salt: string;
  iv: string;
}

class AuthTokenStorage {
  private readonly TOKEN_KEY = 'auth_token_data';
  private readonly KEY_ITERATIONS = 10000; // PBKDF2 iterations
  private readonly KEY_SIZE = 256 / 32; // 256-bit key size in words

  /**
   * Get application-specific salt from environment or generate a consistent one
   */
  private getApplicationSalt(): string {
    // In production, this should come from environment variables
    // For now, we'll use a combination of domain and a fixed salt
    const domain =
      typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const envSalt = process.env.NEXT_PUBLIC_APP_SALT || 'poc_study_tool_2024';
    return `${domain}_${envSalt}`;
  }

  /**
   * Derive encryption key using PBKDF2
   */
  private deriveKey(password: string, salt: string): CryptoJS.lib.WordArray {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: this.KEY_SIZE,
      iterations: this.KEY_ITERATIONS,
      hasher: CryptoJS.algo.SHA256,
    });
  }

  /**
   * Generate a secure random salt
   */
  private generateSalt(): string {
    return CryptoJS.lib.WordArray.random(128 / 8).toString();
  }

  /**
   * Generate a secure random IV
   */
  private generateIV(): string {
    return CryptoJS.lib.WordArray.random(128 / 8).toString();
  }

  /**
   * Encrypt data using AES with PBKDF2 key derivation
   */
  private encrypt(data: string): EncryptionResult {
    try {
      const salt = this.generateSalt();
      const iv = this.generateIV();
      const appSalt = this.getApplicationSalt();

      // Derive key using PBKDF2
      const key = this.deriveKey(appSalt, salt);

      // Encrypt using AES
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      return {
        encryptedData: encrypted.toString(),
        salt,
        iv,
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt token data');
    }
  }

  /**
   * Decrypt AES encrypted data with PBKDF2 key derivation
   */
  private decrypt(encryptedData: string, salt: string, iv: string): string {
    try {
      const appSalt = this.getApplicationSalt();

      // Derive the same key using stored salt
      const key = this.deriveKey(appSalt, salt);

      // Decrypt using AES
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedText) {
        throw new Error('Decryption resulted in empty string');
      }

      return decryptedText;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt token data');
    }
  }

  /**
   * Check if we're in a browser environment
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Store authentication token with expiration using AES encryption
   */
  setToken(token: string, expiresIn?: number, refreshToken?: string): boolean {
    if (!this.isBrowser()) {
      console.warn('Token storage not available in server environment');
      return false;
    }

    try {
      const expiresAt = expiresIn
        ? Date.now() + expiresIn * 1000 // Convert seconds to milliseconds
        : Date.now() + 24 * 60 * 60 * 1000; // Default 24 hours

      const tokenData: TokenData = {
        token,
        expiresAt,
        refreshToken,
      };

      const encryptionResult = this.encrypt(JSON.stringify(tokenData));
      const storedData: StoredTokenData = {
        data: encryptionResult.encryptedData,
        salt: encryptionResult.salt,
        iv: encryptionResult.iv,
        timestamp: Date.now(),
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

      // Validate required fields
      if (!storedData.data || !storedData.salt || !storedData.iv) {
        console.warn('Invalid stored token format, removing corrupted data');
        this.removeToken();
        return null;
      }

      const decryptedData = this.decrypt(
        storedData.data,
        storedData.salt,
        storedData.iv
      );
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

      // Validate required fields
      if (!storedData.data || !storedData.salt || !storedData.iv) {
        return null;
      }

      const decryptedData = this.decrypt(
        storedData.data,
        storedData.salt,
        storedData.iv
      );
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

      // Validate required fields
      if (!storedData.data || !storedData.salt || !storedData.iv) {
        return null;
      }

      const decryptedData = this.decrypt(
        storedData.data,
        storedData.salt,
        storedData.iv
      );
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

    const warningTime = Date.now() + minutes * 60 * 1000;
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

      keysToRemove.forEach((key) => localStorage.removeItem(key));
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

      // Validate required fields
      if (!storedData.data || !storedData.salt || !storedData.iv) {
        return false;
      }

      const decryptedData = this.decrypt(
        storedData.data,
        storedData.salt,
        storedData.iv
      );
      const tokenData: TokenData = JSON.parse(decryptedData);

      // Extend expiration
      tokenData.expiresAt += additionalSeconds * 1000;

      // Re-encrypt and store with new salt and IV for forward secrecy
      const encryptionResult = this.encrypt(JSON.stringify(tokenData));
      const newStoredData: StoredTokenData = {
        data: encryptionResult.encryptedData,
        salt: encryptionResult.salt,
        iv: encryptionResult.iv,
        timestamp: Date.now(),
      };

      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(newStoredData));
      return true;
    } catch (error) {
      console.error('Failed to extend token expiration:', error);
      return false;
    }
  }

  /**
   * Validate the integrity of stored token data
   */
  validateStoredData(): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    try {
      const storedItem = localStorage.getItem(this.TOKEN_KEY);
      if (!storedItem) {
        return false;
      }

      const storedData: StoredTokenData = JSON.parse(storedItem);

      // Check if all required fields are present
      if (
        !storedData.data ||
        !storedData.salt ||
        !storedData.iv ||
        !storedData.timestamp
      ) {
        return false;
      }

      // Try to decrypt to validate integrity
      const decryptedData = this.decrypt(
        storedData.data,
        storedData.salt,
        storedData.iv
      );
      const tokenData: TokenData = JSON.parse(decryptedData);

      // Validate token data structure
      return !!(
        tokenData.token &&
        tokenData.expiresAt &&
        typeof tokenData.expiresAt === 'number'
      );
    } catch (error) {
      console.error('Token validation failed:', error);
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
  extendTokenExpiration,
} = authStorage;
