'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
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

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      // console.log('Login response result:', result);
      const resultData = result?.data?.data;
      // console.log('Login response resultData:', resultData);

      if (result.data.success) {
        setSubmitMessage(resultData.message || 'Email sent successfully');
        setIsEmailSent(true);
      } else {
        setSubmitMessage(result.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      // console.error('Login error:', error.message);
      // Handle axios error responses
      setSubmitMessage(error.message);
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
