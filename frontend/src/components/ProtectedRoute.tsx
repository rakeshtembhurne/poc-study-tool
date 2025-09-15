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
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative overflow-hidden">
          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent animate-pulse-bg" />

          <div className="text-center z-10 relative">
            {/* Logo Container */}
            <div className="mb-8 animate-fade-in-up">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-card border-2 border-border rounded-2xl mb-4 shadow-lg animate-logo-pulse">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-primary w-12 h-12"
                >
                  <path
                    d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 7h8M8 11h8M8 15h6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-2xl font-bold text-foreground tracking-tight">
                Super-Memo
              </div>
            </div>

            {/* Loading Spinner */}
            <div className="relative w-15 h-15 mx-auto my-8 animate-fade-in-up-delayed">
              <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin-slow" />
              <div className="absolute inset-0 border-2 border-transparent border-r-primary/60 rounded-full animate-spin-reverse" />
              <div className="absolute inset-0 border-2 border-transparent border-b-primary/30 rounded-full animate-spin-slow-delayed" />
            </div>

            {/* Loading Text */}
            <div className="animate-fade-in-up-more-delayed">
              <p className="text-lg font-medium text-foreground mb-2 leading-relaxed">
                Preparing your learning environment
              </p>
              <p className="text-sm text-muted-foreground leading-snug">
                This will only take a moment...
              </p>
            </div>
          </div>

          <style jsx>{`
            @keyframes fade-in-up {
              0% {
                opacity: 0;
                transform: translateY(20px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes logo-pulse {
              0%,
              100% {
                transform: scale(1);
                box-shadow: 0 10px 25px hsl(var(--foreground) / 0.1);
              }
              50% {
                transform: scale(1.05);
                box-shadow: 0 15px 35px hsl(var(--primary) / 0.2);
              }
            }

            @keyframes pulse-bg {
              0%,
              100% {
                opacity: 0.5;
              }
              50% {
                opacity: 1;
              }
            }

            @keyframes spin-slow {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }

            @keyframes spin-reverse {
              0% {
                transform: rotate(360deg);
              }
              100% {
                transform: rotate(0deg);
              }
            }

            .animate-fade-in-up {
              animation: fade-in-up 0.8s ease-out;
            }

            .animate-fade-in-up-delayed {
              animation: fade-in-up 0.8s ease-out 0.2s both;
            }

            .animate-fade-in-up-more-delayed {
              animation: fade-in-up 0.8s ease-out 0.4s both;
            }

            .animate-logo-pulse {
              animation: logo-pulse 2s ease-in-out infinite;
            }

            .animate-pulse-bg {
              animation: pulse-bg 3s ease-in-out infinite;
            }

            .animate-spin-slow {
              animation: spin-slow 1.5s linear infinite;
            }

            .animate-spin-reverse {
              animation: spin-reverse 1.5s linear infinite;
              animation-delay: -0.3s;
            }

            .animate-spin-slow-delayed {
              animation: spin-slow 1.5s linear infinite;
              animation-delay: -0.6s;
            }

            .bg-gradient-radial {
              background: radial-gradient(
                ellipse at center,
                var(--tw-gradient-stops)
              );
            }

            .w-15 {
              width: 3.75rem;
            }

            .h-15 {
              height: 3.75rem;
            }

            @media (max-width: 640px) {
              .w-20 {
                width: 4rem;
              }

              .h-20 {
                height: 4rem;
              }

              .w-12 {
                width: 2.25rem;
              }

              .h-12 {
                height: 2.25rem;
              }

              .text-2xl {
                font-size: 1.25rem;
              }

              .w-15 {
                width: 3rem;
              }

              .h-15 {
                height: 3rem;
              }

              .text-lg {
                font-size: 1rem;
              }

              .text-sm {
                font-size: 0.8rem;
              }
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
