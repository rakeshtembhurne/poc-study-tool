'use client';

import { useState } from 'react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Mail,
  Save,
  CheckCircle,
  AlertCircle,
  Camera,
} from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  bio: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: 'John Doe',
    email: 'user@example.com',
    bio: 'Learning enthusiast using spaced repetition to master new concepts.',
  });

  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));

    // Reset save status
    if (saveStatus !== 'idle') {
      setSaveStatus('idle');
      setSaveMessage('');
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    setSaveMessage('');

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Save to localStorage (in a real app, this would be an API call)
      localStorage.setItem('userProfile', JSON.stringify(profile));

      setSaveStatus('success');
      setSaveMessage('Profile updated successfully!');

      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage('Failed to update profile. Please try again.');
      console.error('Error saving profile:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                {profile.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{profile.name}</h3>
              <Button variant="outline" size="sm" className="!cursor-pointer">
                <Camera className="h-4 w-4 mr-2" />
                Change Avatar
              </Button>
            </div>
          </div>

          {/* Profile Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full min-h-[100px] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border border-input bg-background rounded-md"
              rows={4}
            />
          </div>

          {/* Save Status Alert */}
          {saveStatus !== 'idle' && saveMessage && (
            <Alert variant={saveStatus === 'error' ? 'destructive' : 'default'}>
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
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Account Statistics</CardTitle>
          <CardDescription>
            Your learning progress and achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">234</div>
              <div className="text-sm text-muted-foreground">Cards Created</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">1,456</div>
              <div className="text-sm text-muted-foreground">Cards Studied</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">7 days</div>
              <div className="text-sm text-muted-foreground">
                Current Streak
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
