'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
import { redirectAfterLogin } from '@/lib/redirect-utils';
import { API_ENDPOINTS } from '@/utils/apiEndponits';

// Validation schema
const resetPasswordSchema = yup.object({
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema),
  });

  useEffect(() => {
    // Get token from URL parameters
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      // If no token, redirect to forgot password page
      setSubmitMessage(
        'Invalid or missing reset token. Please request a new password reset.'
      );
    }
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setSubmitMessage(
        'Invalid or missing reset token. Please request a new password reset.'
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const url = API_ENDPOINTS.v1.auth.resetPasswordConfirm;
      const response = await apiClient.post(url, {
        resetToken: token,
        newPassword: data.newPassword,
      });

      const result = response.data;
      console.log('Reset password response result:', result);

      if (result.success) {
        setSubmitMessage('Password reset successful! Redirecting to login...');
        reset();
        // Redirect to login page after successful reset
        setTimeout(() => {
          redirectAfterLogin('/login');
        }, 1000);
      } else {
        setSubmitMessage(
          result.message || 'Password reset failed. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('Reset password error:', error);

      // Handle different types of errors
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 400:
            errorMessage =
              data?.message || 'Invalid reset token or password format.';
            break;
          case 401:
            errorMessage =
              data?.message || 'Reset token has expired or is invalid.';
            break;
          case 404:
            errorMessage =
              'Reset token not found. Please request a new password reset.';
            break;
          case 422:
            errorMessage =
              data?.message || 'Please check your password requirements.';
            break;
          case 429:
            errorMessage = 'Too many reset attempts. Please try again later.';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage =
              data?.message || `Reset failed (${status}). Please try again.`;
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
            Reset your password
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="newPassword"
                className="text-gray-900 text-sm font-medium"
              >
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  {...register('newPassword')}
                  placeholder="Enter your new password"
                  className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:ring-gray-500 pr-10 ${
                    errors.newPassword
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-gray-900 text-sm font-medium"
              >
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="Confirm your new password"
                  className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:ring-gray-500 pr-10 ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !token}
              className="w-full bg-gray-900 !text-white !cursor-pointer hover:bg-gray-800 font-semibold py-3 transition-all duration-200 hover:-translate-y-0.5 disabled:bg-gray-400 disabled:text-white disabled:transform-none disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
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
            Remember your password?{' '}
            <Link
              href="/login"
              className="text-gray-900 hover:text-gray-700 hover:underline font-medium transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
