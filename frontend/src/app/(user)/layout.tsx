'use client';

// import ProtectedRoute from '@/components/ProtectedRoute';
// import { useAuth } from '@/context/AuthContext';
// import { redirectAfterLogout } from '@/lib/redirect-utils';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  FolderOpen,
  SquarePlus,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Mail,
} from 'lucide-react';

const user = {
  email: 'user@example.com',
};

function TopNavigation() {
  // const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();

  // const handleLogout = async () => {
  //   setIsLoggingOut(true);
  //   try {
  //     await logout();
  //     setTimeout(() => {
  //       redirectAfterLogout();
  //     }, 500);
  //   } catch (error) {
  //     console.error('Logout failed:', error);
  //     setIsLoggingOut(false);
  //   }
  // };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/decks', label: 'Decks', icon: FolderOpen },
    { href: '/create-card', label: 'Create Card', icon: SquarePlus },
    { href: '/study', label: 'Study', icon: BookOpen },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background-navbar/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div className="flex h-16 max-w-[80vw] mx-auto items-center justify-between">
        <Link href={'/dashboard'} className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold text-foreground m-0">Super-Memo</h1>
        </Link>

        <div className="hidden md:flex items-center space-x-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={
                    isActive
                      ? 'flex items-center !text-primary-foreground !cursor-pointer'
                      : 'flex items-center !cursor-pointer'
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative h-8 w-8 rounded-full p-0 !cursor-pointer"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-fit">
              <DropdownMenuLabel>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-md whitespace-nowrap">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                // onClick={handleLogout}
                disabled={isLoggingOut}
                className=" !cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <LogOut className="h-4 w-4" />
                  <span className="text-md">Logout</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t py-2 flex justify-center">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={
                    isActive
                      ? 'flex items-center !text-primary-foreground !cursor-pointer'
                      : 'flex items-center !cursor-pointer'
                  }
                >
                  <Icon className="h-4 w-4" />
                  {/* <span className="text-xs">{item.label}</span> */}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <ProtectedRoute>
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <main className="flex-1">{children}</main>
    </div>
    // </ProtectedRoute>
  );
}
