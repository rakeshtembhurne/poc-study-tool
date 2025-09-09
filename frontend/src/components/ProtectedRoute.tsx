'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export default function ProtectedRoute({
  children,
  fallback,
  redirectTo = '/login',
  requireAuth = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // Still checking authentication status
      return;
    }

    if (!requireAuth) {
      // Route doesn't require authentication
      setShouldRender(true);
      return;
    }

    if (!isAuthenticated) {
      // User is not authenticated, redirect to login
      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      router.push(loginUrl);
      return;
    }

    // All checks passed, render the protected content
    setShouldRender(true);
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      fallback || (
        <div className="protected-route-loading">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Checking authentication...</p>
          </div>
          <style jsx>{`
            .protected-route-loading {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .loading-container {
              text-align: center;
            }
            .loading-spinner {
              width: 40px;
              height: 40px;
              border: 3px solid rgba(255, 255, 255, 0.3);
              border-top: 3px solid #fff;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 16px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            p {
              margin: 0;
              font-size: 16px;
              color: rgba(255, 255, 255, 0.8);
            }
          `}</style>
        </div>
      )
    );
  }

  // Don't render anything while redirecting
  if (!shouldRender) {
    return null;
  }

  // Render the protected content
  return <>{children}</>;
}

// Higher-order component version for easier usage
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
