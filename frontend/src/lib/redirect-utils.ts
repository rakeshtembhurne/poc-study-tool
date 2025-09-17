/**
 * Utility functions for handling authentication redirects
 */

/**
 * Get the redirect URL from query parameters
 */
export function getRedirectUrl(searchParams?: URLSearchParams | string): string | null {
  let params: URLSearchParams;
  
  if (typeof searchParams === 'string') {
    params = new URLSearchParams(searchParams);
  } else if (searchParams) {
    params = searchParams;
  } else if (typeof window !== 'undefined') {
    params = new URLSearchParams(window.location.search);
  } else {
    return null;
  }
  
  return params.get('redirect');
}

/**
 * Store the intended destination before redirecting to login
 */
export function storeIntendedUrl(url?: string): void {
  if (typeof window === 'undefined') return;
  
  const intendedUrl = url || window.location.pathname + window.location.search;
  
  // Don't store auth-related URLs as intended destinations
  const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
  if (authRoutes.some(route => intendedUrl.startsWith(route))) {
    return;
  }
  
  sessionStorage.setItem('intendedUrl', intendedUrl);
}

/**
 * Get and clear the stored intended URL
 */
export function getAndClearIntendedUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const intendedUrl = sessionStorage.getItem('intendedUrl');
  if (intendedUrl) {
    sessionStorage.removeItem('intendedUrl');
    return intendedUrl;
  }
  
  return null;
}

/**
 * Redirect to the intended URL or fallback
 */
export function redirectAfterLogin(fallbackUrl: string = '/dashboard'): void {
  if (typeof window === 'undefined') return;
  
  // First check URL parameters
  const redirectFromUrl = getRedirectUrl();
  if (redirectFromUrl && isValidRedirectUrl(redirectFromUrl)) {
    window.location.href = redirectFromUrl;
    return;
  }
  
  // Then check stored intended URL
  const intendedUrl = getAndClearIntendedUrl();
  if (intendedUrl && isValidRedirectUrl(intendedUrl)) {
    window.location.href = intendedUrl;
    return;
  }
  
  // Fallback to default URL
  window.location.href = fallbackUrl;
}

/**
 * Check if a redirect URL is valid and safe
 */
export function isValidRedirectUrl(url: string): boolean {
  try {
    // Prevent open redirect vulnerabilities
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const urlObj = new URL(url);
      const currentHost = window.location.host;
      
      // Only allow redirects to the same host
      if (urlObj.host !== currentHost) {
        return false;
      }
    }
    
    // Must start with / for relative URLs
    if (!url.startsWith('/')) {
      return false;
    }
    
    // Don't redirect to auth pages
    const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
    if (authRoutes.some(route => url.startsWith(route))) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a login URL with redirect parameter
 */
export function createLoginUrl(redirectTo?: string, loginPath: string = '/login'): string {
  const redirect = redirectTo || window.location.pathname + window.location.search;
  
  if (!isValidRedirectUrl(redirect)) {
    return loginPath;
  }
  
  return `${loginPath}?redirect=${encodeURIComponent(redirect)}`;
}

/**
 * Handle logout redirect
 */
export function redirectAfterLogout(logoutUrl: string = '/login'): void {
  if (typeof window === 'undefined') return;
  
  // Clear any stored intended URLs
  sessionStorage.removeItem('intendedUrl');
  
  // Redirect to logout page
  window.location.href = logoutUrl;
}

/**
 * Check if current route requires authentication
 */
export function isProtectedRoute(pathname?: string): boolean {
  const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  
  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
  ];
  
  // Check if current path is in public routes
  return !publicRoutes.some(route => {
    if (route === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(route);
  });
}
