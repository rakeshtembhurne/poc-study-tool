'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { redirectAfterLogin } from '@/lib/redirect-utils';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';
import { API_ENDPOINTS } from '@/utils/apiEndponits';

// Validation schema
const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(1, 'Password is required'),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const url = API_ENDPOINTS.v1.auth.login;
      const response = await apiClient.post(url, data);

      const result = response.data;
      console.log('Login response result:', result);

      if (result.success) {
        console.log('Login successful!');
        setSubmitMessage(
          result.message || 'Login successful! Redirecting to dashboard...'
        );

        // Use AuthContext login method with secure token storage
        if (result.data?.accessToken) {
          try {
            login(
              result.data.accessToken,
              {
                id: result.data.user?.id || result.data.userId,
                email: result.data.user?.email || data.email,
              },
              result.data.expiresIn, // Token expiration in seconds from backend
              result.data.refreshToken // Optional refresh token
            );
            // Redirect to intended page or dashboard after successful login
            redirectAfterLogin('/dashboard');
          } catch (error) {
            console.error('Failed to store authentication token:', error);
            setSubmitMessage(
              'Login successful but failed to save session. Please try again.'
            );
            return;
          }
        } else {
          setSubmitMessage(
            'Login response missing access token. Please try again.'
          );
        }
      } else {
        setSubmitMessage(result.message || 'Login failed. Please try again.');
      }
    } catch (error: any) {
      // console.error('Login error:', error);

      // Handle different types of errors
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 400:
            errorMessage = data?.message || 'Invalid email or password format.';
            break;
          case 401:
            errorMessage = data?.message || 'Invalid email or password.';
            break;
          case 404:
            errorMessage = 'Login service not found. Please contact support.';
            break;
          case 429:
            errorMessage = 'Too many login attempts. Please try again later.';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage =
              data?.message || `Login failed (${status}). Please try again.`;
        }
      } else if (error.request) {
        // Network error
        errorMessage =
          'Unable to connect to server. Please check your internet connection.';
      } else if (error.code === 'ECONNABORTED') {
        // Timeout error
        errorMessage = 'Request timed out. Please try again.';
      }

      setSubmitMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <Card className="w-full max-w-md bg-white border-gray-200 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-semibold text-gray-900">
            Super-Memo
          </CardTitle>
          <CardDescription className="text-gray-600">
            Sign in to your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-gray-900 text-sm font-medium"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Enter your email address"
                className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:ring-gray-500 ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : ''
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-gray-900 text-sm font-medium"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Enter your password"
                  className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:ring-gray-500 pr-10 ${
                    errors.password
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex justify-end py-2">
              <Link
                href="/forgot-password"
                className="text-sm text-gray-900 hover:text-gray-700 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gray-900 !text-white !cursor-pointer hover:bg-gray-800 font-semibold py-3 transition-all duration-200 hover:-translate-y-0.5 disabled:bg-gray-400 disabled:text-white disabled:transform-none disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>

            {submitMessage && (
              <Alert
                className={`mt-4 ${
                  submitMessage.includes('successful')
                    ? 'border-green-500/20 bg-green-50 text-green-700'
                    : 'border-red-500/20 bg-red-50 text-red-700'
                }`}
              >
                <AlertDescription className="text-center">
                  {submitMessage}
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>

        <CardFooter className="border-t border-gray-200 pt-6">
          <p className="text-center text-sm text-gray-600 w-full">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-gray-900 hover:text-gray-700 hover:underline font-medium transition-colors"
            >
              Create one here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
