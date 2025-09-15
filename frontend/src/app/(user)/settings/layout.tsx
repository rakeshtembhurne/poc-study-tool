'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, User } from 'lucide-react';

const settingsNavItems = [
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-[80vw] mx-auto space-y-8">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-md text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <nav className="space-y-2">
                {settingsNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        className={`w-full justify-start !cursor-pointer ${
                          isActive
                            ? '!text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </CardContent>
          </Card>

          {/* Content Area */}
          <div className="lg:col-span-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
