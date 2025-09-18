'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Check, X, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/utils/apiEndpoints';
import { useAuth } from '@/context/AuthContext';

const emailFormSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
});

const passwordFormSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords do not match')
    .required('Please confirm your new password'),
});

type EmailFormValues = yup.InferType<typeof emailFormSchema>;
type PasswordFormValues = yup.InferType<typeof passwordFormSchema>;

export default function EditEmailPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [emailSaveStatus, setEmailSaveStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle');
  const [emailSaveMessage, setEmailSaveMessage] = useState('');
  const [passwordSaveStatus, setPasswordSaveStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle');
  const [passwordSaveMessage, setPasswordSaveMessage] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailForm = useForm<EmailFormValues>({
    resolver: yupResolver(emailFormSchema),
    defaultValues: {
      email: '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: yupResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Load current email from localStorage on component mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('user');
      if (savedProfile) {
        console.log('Raw user data from localStorage:', savedProfile);
        const parsedProfile = JSON.parse(savedProfile);
        console.log('Parsed user data:', parsedProfile);
        console.log('Email from parsed data:', parsedProfile.email);
        emailForm.setValue('email', parsedProfile.email || '');
      }
    } catch (error) {
      console.error('Error loading profile from localStorage:', error);
    }
  }, [emailForm]);

  const onEmailSubmit = async (data: EmailFormValues) => {
    setEmailSaveStatus('saving');
    setEmailSaveMessage('');

    try {
      if (!user?.id) {
        throw new Error('User ID not found. Please login again.');
      }

      const url = API_ENDPOINTS.v1.user.updateEmail.replace(':id', user.id);
      const response = await apiClient.patch(url, data);

      const result = response.data;
      console.log('Email update response result:', result);

      if (result.success || response.status === 200) {
        console.log('Email update successful!');
        setEmailSaveStatus('success');
        setEmailSaveMessage(result?.message || 'Email updated successfully!');

        // Update email in localStorage if successful
        const savedProfile = localStorage.getItem('user');
        if (savedProfile) {
          const parsedProfile = JSON.parse(savedProfile);
          const updatedProfile = {
            ...parsedProfile,
            email: data.email,
          };
          localStorage.setItem('user', JSON.stringify(updatedProfile));
        }

        // Reset status after 3 seconds
        setTimeout(() => {
          setEmailSaveStatus('idle');
          setEmailSaveMessage('');
        }, 3000);
      } else {
        setEmailSaveStatus('error');
        setEmailSaveMessage(
          result?.message || 'Email update failed. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('Email update error:', error);

      // Handle different types of errors
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 400:
            errorMessage = data?.message || 'Invalid email format.';
            break;
          case 401:
            errorMessage = 'Unauthorized. Please login again.';
            break;
          case 404:
            errorMessage = 'User not found. Please contact support.';
            break;
          case 409:
            errorMessage =
              'Email already exists. Please use a different email.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please try again later.';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage =
              data?.message ||
              `Email update failed (${status}). Please try again.`;
        }
      } else if (error.request) {
        // Network error
        errorMessage =
          'Unable to connect to server. Please check your internet connection.';
      } else if (error.code === 'ECONNABORTED') {
        // Timeout error
        errorMessage = 'Request timed out. Please try again.';
      } else {
        errorMessage =
          error.message || 'Failed to update email. Please try again.';
      }

      setEmailSaveStatus('error');
      setEmailSaveMessage(errorMessage);
    } finally {
      // Reset error status after 5 seconds
      setTimeout(() => {
        if (emailSaveStatus === 'error') {
          setEmailSaveStatus('idle');
          setEmailSaveMessage('');
        }
      }, 5000);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setPasswordSaveStatus('saving');
    setPasswordSaveMessage('');

    try {
      const url = API_ENDPOINTS.v1.user.updatePassword;
      const response = await apiClient.patch(url, data);

      const result = response.data;
      console.log('Password update response result:', result);

      if (result.success || response.status === 200) {
        console.log('Password update successful!');
        setPasswordSaveStatus('success');
        setPasswordSaveMessage(
          result?.message || 'Password updated successfully!'
        );

        // Clear password fields after successful update
        passwordForm.reset();

        // Reset status after 3 seconds
        setTimeout(() => {
          setPasswordSaveStatus('idle');
          setPasswordSaveMessage('');
        }, 3000);
      } else {
        setPasswordSaveStatus('error');
        setPasswordSaveMessage(
          result?.message || 'Password update failed. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('Password update error:', error);

      // Handle different types of errors
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 400:
            errorMessage =
              data?.message ||
              'Invalid password format or passwords do not match.';
            break;
          case 401:
            errorMessage = data?.message || 'Current password is incorrect.';
            break;
          case 404:
            errorMessage = 'User not found. Please contact support.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please try again later.';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage =
              data?.message ||
              `Password update failed (${status}). Please try again.`;
        }
      } else if (error.request) {
        // Network error
        errorMessage =
          'Unable to connect to server. Please check your internet connection.';
      } else if (error.code === 'ECONNABORTED') {
        // Timeout error
        errorMessage = 'Request timed out. Please try again.';
      } else {
        errorMessage =
          error.message || 'Failed to update password. Please try again.';
      }

      setPasswordSaveStatus('error');
      setPasswordSaveMessage(errorMessage);
    } finally {
      // Reset error status after 5 seconds
      setTimeout(() => {
        if (passwordSaveStatus === 'error') {
          setPasswordSaveStatus('idle');
          setPasswordSaveMessage('');
        }
      }, 5000);
    }
  };

  const handleCancel = () => {
    router.push('/settings/profile');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Email & Password
          </h1>
          <p className="text-muted-foreground">
            Update your email address and password
          </p>
        </div>
      </div>

      {/* Email Status Messages */}
      {emailSaveMessage && (
        <Alert
          className={
            emailSaveStatus === 'success'
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          }
        >
          <div className="flex items-center gap-2">
            {emailSaveStatus === 'success' ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <X className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription
              className={
                emailSaveStatus === 'success'
                  ? 'text-green-800'
                  : 'text-red-800'
              }
            >
              {emailSaveMessage}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Password Status Messages */}
      {passwordSaveMessage && (
        <Alert
          className={
            passwordSaveStatus === 'success'
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          }
        >
          <div className="flex items-center gap-2">
            {passwordSaveStatus === 'success' ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <X className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription
              className={
                passwordSaveStatus === 'success'
                  ? 'text-green-800'
                  : 'text-red-800'
              }
            >
              {passwordSaveMessage}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Email Form */}
      <Form {...emailForm}>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Email Address</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Update your email address
            </p>

            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Email Address</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        id="email-input"
                        type="email"
                        placeholder="Enter your new email address"
                        {...field}
                        className="flex-1"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Submit Button */}
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={async () => {
                  const emailValue = emailForm.getValues('email');
                  if (emailValue) {
                    await onEmailSubmit({ email: emailValue });
                  }
                }}
                disabled={emailSaveStatus === 'saving'}
                className="min-w-[120px]"
              >
                {emailSaveStatus === 'saving' ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </div>
                ) : (
                  'Update Email'
                )}
              </Button>
            </div>
          </div>
        </div>
      </Form>

      {/* Password Form */}
      <Form {...passwordForm}>
        <form
          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
          className="space-y-6"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Password</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Update your password for security
            </p>

            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="Enter your current password"
                        {...field}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Enter your new password"
                        {...field}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Password must be at least 8 characters long
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your new password"
                        {...field}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Password Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={passwordSaveStatus === 'saving'}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={passwordSaveStatus === 'saving'}
                className="min-w-[120px]"
              >
                {passwordSaveStatus === 'saving' ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </div>
                ) : (
                  'Update Password'
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
