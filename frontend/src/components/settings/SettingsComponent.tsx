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
import { Eye, EyeOff, Key, Check, X } from 'lucide-react';

const formSchema = yup.object({
  openRouterApiKey: yup
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
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const form = useForm<FormValues>({
    resolver: yupResolver(formSchema),
    defaultValues: {
      openRouterApiKey: '',
    },
  });

  // Load saved data from localStorage on component mount
  useEffect(() => {
    try {
      const savedApiKeys = localStorage.getItem('apiKeys');
      if (savedApiKeys) {
        const parsedKeys = JSON.parse(savedApiKeys);
        if (parsedKeys.openRouterApiKey) {
          form.setValue(
            'openRouterApiKey',
            parsedKeys.openRouterApiKey as string
          );
        }
      }
    } catch (error) {
      console.error('Error loading API keys from localStorage:', error);
    }
  }, [form]);

  const onSubmit = async (values: FormValues) => {
    setSaveStatus('saving');
    setSaveMessage('');

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Save to localStorage (in a real app, this would be an API call)
      localStorage.setItem('apiKeys', JSON.stringify(values));

      setSaveStatus('success');
      setSaveMessage('Settings saved successfully!');

      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage('Failed to save settings. Please try again.');

      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);
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
              name="openRouterApiKey"
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
