'use client';

import { Button } from '@/components/ui/button';
import {
  BookA,
  ChartNoAxesCombined,
  FolderClosed,
  LayoutDashboard,
  MessageSquarePlus,
  Settings,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard /> },
    { label: 'Decks', path: '/decks', icon: <FolderClosed /> },
    { label: 'Create Deck', path: '/decks/add', icon: <MessageSquarePlus /> },
    { label: 'Study', path: '/study', icon: <BookA /> },
    { label: 'Analytics', path: '/analytics', icon: <ChartNoAxesCombined /> },
    { label: 'Settings', path: '/settings', icon: <Settings /> },
  ];

  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-600">Super-Memo</h1>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                className={`flex items-center gap-2 px-3 py-2 text-sm ${
                  pathname === item.path
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => router.push(item.path)}
              >
                <span className="text-xs">{item.icon}</span>
                {item.label}
              </Button>
            ))}
          </div>

          {/* User Avatar */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 rounded-full bg-blue-600 text-white hover:bg-blue-700 p-0"
            >
              A
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
