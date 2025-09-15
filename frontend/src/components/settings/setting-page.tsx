'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Eye,
  EyeOff,
  Key,
  Save,
  CheckCircle,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';

interface ApiKeySettings {
  openaiApiKey: string;
  anthropicApiKey: string;
}

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeySettings>({
    openaiApiKey: '',
    anthropicApiKey: '',
  });

  const [showKeys, setShowKeys] = useState({
    openaiApiKey: false,
    anthropicApiKey: false,
  });

  const [validationErrors, setValidationErrors] = useState<
    Partial<ApiKeySettings>
  >({});
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle');
  const [saveMessage, setSaveMessage] = useState('');

  // Load saved API keys from localStorage on component mount
  useEffect(() => {
    try {
      const savedKeys = localStorage.getItem('apiKeys');
      if (savedKeys) {
        const parsedKeys = JSON.parse(savedKeys) as ApiKeySettings;
        setApiKeys(parsedKeys);
      }
    } catch (error) {
      console.error('Error loading API keys from localStorage:', error);
    }
  }, []);

  // Enhanced validation functions
  const validateOpenAIKey = (key: string): string | null => {
    if (!key.trim()) return null; // Allow empty keys

    // Check prefix - support both old (sk-) and new (sk-proj-) formats
    if (!key.startsWith('sk-')) {
      return 'OpenAI API key must start with "sk-"';
    }

    // Determine if it's the new project-based format
    const isProjectKey = key.startsWith('sk-proj-');

    // Check minimum length based on format
    const minLength = isProjectKey ? 100 : 40; // Project keys are much longer
    if (key.length < minLength) {
      return `OpenAI API key appears to be too short (minimum ${minLength} characters for ${isProjectKey ? 'project-based' : 'legacy'} keys)`;
    }

    // Check maximum reasonable length
    const maxLength = isProjectKey ? 200 : 100; // Project keys can be much longer
    if (key.length > maxLength) {
      return `OpenAI API key appears to be too long (maximum ${maxLength} characters for ${isProjectKey ? 'project-based' : 'legacy'} keys)`;
    }

    // Check character set (alphanumeric and some special characters)
    const validPattern = isProjectKey
      ? /^sk-proj-[A-Za-z0-9\-_]+$/
      : /^sk-[A-Za-z0-9\-_]+$/;

    if (!validPattern.test(key)) {
      return 'OpenAI API key contains invalid characters (only letters, numbers, hyphens, and underscores allowed)';
    }

    // Check for common patterns that indicate a valid key structure
    const keyParts = key.split('-');
    const minParts = isProjectKey ? 3 : 2; // sk-proj-... vs sk-...

    if (keyParts.length < minParts) {
      return `OpenAI API key format appears invalid (expected ${isProjectKey ? 'sk-proj-...' : 'sk-...'} format)`;
    }

    // Additional validation for project keys
    if (isProjectKey) {
      // Project keys should have the format: sk-proj-[project-id]-[rest-of-key]
      if (keyParts.length < 4) {
        return 'Project-based OpenAI API key format appears invalid (expected sk-proj-[project-id]-[key] format)';
      }

      // Check that the project part and key part are not empty
      if (!keyParts[2] || !keyParts[3]) {
        return 'Project-based OpenAI API key format appears invalid (project ID or key part is missing)';
      }
    }

    return null;
  };

  const validateAnthropicKey = (key: string): string | null => {
    if (!key.trim()) return null; // Allow empty keys

    // Check prefix
    if (!key.startsWith('sk-ant-')) {
      return 'Anthropic API key must start with "sk-ant-"';
    }

    // Check minimum length (Anthropic keys are typically longer)
    if (key.length < 50) {
      return 'Anthropic API key appears to be too short (minimum 50 characters)';
    }

    // Check maximum reasonable length
    if (key.length > 150) {
      return 'Anthropic API key appears to be too long (maximum 150 characters)';
    }

    // Check character set (alphanumeric and some special characters)
    const validPattern = /^sk-ant-[A-Za-z0-9\-_]+$/;
    if (!validPattern.test(key)) {
      return 'Anthropic API key contains invalid characters (only letters, numbers, hyphens, and underscores allowed)';
    }

    // Check for common patterns that indicate a valid key structure
    const keyParts = key.split('-');
    if (keyParts.length < 3) {
      return 'Anthropic API key format appears invalid';
    }

    return null;
  };

  // Helper function to get validation status
  const getValidationStatus = (
    field: keyof ApiKeySettings
  ): 'valid' | 'invalid' | 'empty' => {
    const value = apiKeys[field];
    if (!value.trim()) return 'empty';

    const error =
      field === 'openaiApiKey'
        ? validateOpenAIKey(value)
        : validateAnthropicKey(value);

    return error ? 'invalid' : 'valid';
  };

  const handleInputChange = (field: keyof ApiKeySettings, value: string) => {
    setApiKeys((prev) => ({ ...prev, [field]: value }));

    // Real-time validation
    let validationError: string | null = null;
    if (field === 'openaiApiKey') {
      validationError = validateOpenAIKey(value);
    } else if (field === 'anthropicApiKey') {
      validationError = validateAnthropicKey(value);
    }

    // Update validation errors in real-time
    setValidationErrors((prev) => ({
      ...prev,
      [field]: validationError,
    }));

    // Reset save status
    if (saveStatus !== 'idle') {
      setSaveStatus('idle');
      setSaveMessage('');
    }
  };

  const toggleKeyVisibility = (field: keyof typeof showKeys) => {
    setShowKeys((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateAllKeys = (): boolean => {
    const errors: Partial<ApiKeySettings> = {};

    const openaiError = validateOpenAIKey(apiKeys.openaiApiKey);
    const anthropicError = validateAnthropicKey(apiKeys.anthropicApiKey);

    if (openaiError) errors.openaiApiKey = openaiError;
    if (anthropicError) errors.anthropicApiKey = anthropicError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateAllKeys()) {
      setSaveStatus('error');
      setSaveMessage('Please fix validation errors before saving.');
      return;
    }

    setSaveStatus('saving');
    setSaveMessage('');

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Save to localStorage
      localStorage.setItem('apiKeys', JSON.stringify(apiKeys));

      setSaveStatus('success');
      setSaveMessage('API keys saved successfully!');

      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage('Failed to save API keys. Please try again.');
      console.error('Error saving API keys:', error);
    }
  };

  const maskApiKey = (key: string): string => {
    if (!key) return '';
    if (key.length <= 8) return key;
    return (
      key.substring(0, 8) +
      '•'.repeat(Math.max(0, key.length - 12)) +
      key.substring(key.length - 4)
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-[80vw] mx-auto space-y-8">
        {/* Header Section - matching dashboard style */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-md text-muted-foreground">
            Configure your API keys and application preferences
          </p>
        </div>

        {/* API Keys Section - simplified layout */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Configure your API keys for AI services. These keys are stored
              locally in your browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* OpenAI API Key */}
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <div className="relative">
                <Input
                  id="openai-key"
                  type={showKeys.openaiApiKey ? 'text' : 'password'}
                  placeholder="sk-... or sk-proj-..."
                  value={
                    showKeys.openaiApiKey
                      ? apiKeys.openaiApiKey
                      : maskApiKey(apiKeys.openaiApiKey)
                  }
                  onChange={(e) =>
                    handleInputChange('openaiApiKey', e.target.value)
                  }
                  className={
                    validationErrors.openaiApiKey ? 'border-destructive' : ''
                  }
                />
                {/* Validation Status Indicator */}
                {apiKeys.openaiApiKey && (
                  <div className="absolute right-12 top-0 h-full flex items-center">
                    {getValidationStatus('openaiApiKey') === 'valid' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => toggleKeyVisibility('openaiApiKey')}
                >
                  {showKeys.openaiApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {validationErrors.openaiApiKey && (
                <p className="text-sm text-destructive">
                  {validationErrors.openaiApiKey}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenAI Platform
                </a>
              </p>
            </div>

            {/* Save Status Alert */}
            {saveStatus !== 'idle' && saveMessage && (
              <Alert
                variant={saveStatus === 'error' ? 'destructive' : 'default'}
              >
                {saveStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : saveStatus === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : null}
                <AlertDescription>{saveMessage}</AlertDescription>
              </Alert>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="min-w-[120px] !text-primary-foreground !cursor-pointer"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice - matching dashboard card style */}
        <Card>
          <CardContent className="p-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Notice:</strong> API keys are stored locally in
                your browser&apos;s localStorage. They are not transmitted to
                our servers. Keep your API keys secure and never share them
                publicly.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
