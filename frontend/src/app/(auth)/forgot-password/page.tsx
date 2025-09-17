'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
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
import { Mail, ArrowLeft } from 'lucide-react';
import { API_ENDPOINTS } from '@/utils/apiEndpoints';

// Validation schema
const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const url = API_ENDPOINTS.v1.auth.resetPassword;
      const response = await apiClient.post(url, data);

      const result = response.data;
      console.log('Reset password response result:', result);

      if (result.success) {
        setSubmitMessage(result.message || 'Email sent successfully');
        setIsEmailSent(true);
      } else {
        setSubmitMessage(result.message || 'Failed to send reset email');
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
            errorMessage = data?.message || 'Invalid email address format.';
            break;
          case 404:
            errorMessage = data?.message || 'Email address not found.';
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

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
        <Card className="w-full max-w-md bg-white border-gray-200 shadow-xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Check Your Email
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-green-600" />
            </div>

            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                If this email exists, a reset link has been sent.
              </p>
              <p className="text-xs text-gray-500">
                Didn&apos;t receive the email? Check your spam folder or try
                again.
              </p>
            </div>

            <Button
              onClick={() => {
                setIsEmailSent(false);
                setSubmitMessage('');
              }}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 !cursor-pointer"
            >
              Send Another Email
            </Button>
          </CardContent>

          <CardFooter className="border-t border-gray-200 pt-6">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors w-full"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <Card className="w-full max-w-md bg-white border-gray-200 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Forgot Password?
          </CardTitle>
          <CardDescription className="text-gray-600">
            Enter your email address and we&apos;ll send you mail to reset your
            password
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

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gray-900 !text-white !cursor-pointer hover:bg-gray-800 font-semibold py-3 transition-all duration-200 hover:-translate-y-0.5 disabled:bg-gray-400 disabled:text-white disabled:transform-none disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Mail'}
            </Button>

            {submitMessage && !isEmailSent && (
              <Alert className="mt-4 border-red-500/20 bg-red-50 text-red-700">
                <AlertDescription className="text-center">
                  {submitMessage}
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>

        <CardFooter className="border-t border-gray-200 pt-6">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors w-full"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
