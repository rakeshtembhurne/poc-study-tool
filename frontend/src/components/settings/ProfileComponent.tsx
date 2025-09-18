'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { useRouter } from 'next/navigation';

interface UserProfile {
  name: string;
  email: string;
  bio: string;
  avatar?: string;
}

export default function ProfileComponent() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    bio: '',
  });
  // Load saved data from localStorage on component mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('user');
      if (savedProfile) {
        console.log('Raw user data from localStorage:', savedProfile);
        const parsedProfile = JSON.parse(savedProfile);
        console.log('Parsed user data:', parsedProfile);
        console.log('Email from parsed data:', parsedProfile.email);

        setProfile((prev) => ({
          ...prev,
          email: parsedProfile.email || '',
          avatar: parsedProfile.avatar || '',
        }));
      }
    } catch (error) {
      console.error('Error loading profile from localStorage:', error);
    }
  }, []);

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and profile settings.
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details and profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src="https://avatar.iran.liara.run/public"
                alt="Profile picture"
              />
              <AvatarFallback className="text-lg">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  readOnly
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/settings/edit-email')}
                  className="px-3"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
