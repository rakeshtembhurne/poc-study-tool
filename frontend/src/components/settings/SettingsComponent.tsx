'use client';

import { useState } from 'react';
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
import { Eye, EyeOff, Key, Check, X } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/utils/apiEndpoints';
import { useAuth } from '@/context/AuthContext';

const formSchema = yup.object({
  openAiApiKey: yup
    .string()
    .required('API key is required')
    .min(10, 'API key must be at least 10 characters long')
    .test(
      'starts-with-sk-or',
      'OpenRouter API key should start with "sk-or-"',
      (value) => {
        return value ? value.startsWith('sk-or-') : false;
      }
    ),
});

type FormValues = yup.InferType<typeof formSchema>;

export default function ProfileSettingsComponent() {
  const { user } = useAuth();
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const form = useForm<FormValues>({
    resolver: yupResolver(formSchema),
    defaultValues: {
      openAiApiKey: '',
    },
  });

  // No localStorage loading - just for updating API key

  const onSubmit = async (data: FormValues) => {
    setSaveStatus('saving');
    setSaveMessage('');

    try {
      if (!user?.id) {
        throw new Error('User ID not found. Please login again.');
      }

      const url = API_ENDPOINTS.v1.user.updateApiKey.replace(':id', user.id);
      const response = await apiClient.patch(url, data);

      const result = response.data;
      console.log('API key update response result:', result);

      if (result.success || response.status === 200) {
        console.log('API key update successful!');
        setSaveStatus('success');
        setSaveMessage(result?.message || 'API key updated successfully!');

        // Save to localStorage if successful
        localStorage.setItem('apiKeys', JSON.stringify(data));

        // Reset status after 3 seconds
        setTimeout(() => {
          setSaveStatus('idle');
          setSaveMessage('');
        }, 3000);
      } else {
        setSaveStatus('error');
        setSaveMessage(
          result?.message || 'API key update failed. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('API key update error:', error);

      // Handle different types of errors
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 400:
            errorMessage = data?.message || 'Invalid API key format.';
            break;
          case 401:
            errorMessage = 'Unauthorized. Please login again.';
            break;
          case 404:
            errorMessage = 'User not found. Please contact support.';
            break;
          case 409:
            errorMessage =
              'API key already exists. Please use a different key.';
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
              `API key update failed (${status}). Please try again.`;
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
          error.message || 'Failed to update API key. Please try again.';
      }

      setSaveStatus('error');
      setSaveMessage(errorMessage);
    } finally {
      // Reset error status after 5 seconds
      setTimeout(() => {
        if (saveStatus === 'error') {
          setSaveStatus('idle');
          setSaveMessage('');
        }
      }, 5000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your API keys and application preferences.
        </p>
      </div>

      {/* Status Messages */}
      {saveMessage && (
        <Alert
          className={
            saveStatus === 'success'
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          }
        >
          <div className="flex items-center gap-2">
            {saveStatus === 'success' ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <X className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription
              className={
                saveStatus === 'success' ? 'text-green-800' : 'text-red-800'
              }
            >
              {saveMessage}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* API Keys Section */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <h2 className="text-xl font-semibold">API Configuration</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure your API keys for external services
            </p>

            <FormField
              control={form.control}
              name="openAiApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OpenRouter API Key</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="pr-10"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Your OpenRouter API key for accessing AI models. Get one
                    from{' '}
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      OpenRouter
                    </a>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="min-w-[120px]"
            >
              {saveStatus === 'saving' ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
