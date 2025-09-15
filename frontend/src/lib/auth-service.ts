interface RefreshTokenRequest {
  userId: string;
  refreshToken: string;
}

interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class AuthService {
  private static instance: AuthService;
  private abortController: AbortController | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Refresh authentication token with proper cleanup
   */
  async refreshToken(
    request: RefreshTokenRequest
  ): Promise<RefreshTokenResponse | null> {
    try {
      // Cancel any existing request
      this.cancelPendingRequests();

      // Create new AbortController for this request
      this.abortController = new AbortController();

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: this.abortController.signal,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return data as RefreshTokenResponse;
      }

      return null;
    } catch (error: any) {
      // Don't log aborted requests as errors
      if (error.name === 'AbortError') {
        console.log('Auth request was cancelled');
        return null;
      }

      console.error('Token refresh failed:', error);
      return null;
    } finally {
      // Clean up the abort controller
      this.abortController = null;
    }
  }

  /**
   * Cancel any pending authentication requests
   */
  cancelPendingRequests(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Cleanup method to be called on logout or component unmount
   */
  cleanup(): void {
    this.cancelPendingRequests();
  }
}

// Export singleton instance
export default AuthService.getInstance();
