'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Settings,
  LogOut,
  Vote,
  Sun,
  Moon,
  Crown,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const navItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Voters',
    href: '/admin/dashboard/voters',
    icon: Users,
  },
  {
    title: 'Positions',
    href: '/admin/dashboard/positions',
    icon: Crown,
  },
  {
    title: 'Candidates',
    href: '/admin/dashboard/candidates',
    icon: UserCheck,
  },
  {
    title: 'Settings',
    href: '/admin/dashboard/settings',
    icon: Settings,
  },
];

interface Association {
  id: string;
  name: string;
  logoUrl?: string;
}

interface SidebarProps {
  association: Association;
}

export default function Sidebar({ association }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    signOut({ callbackUrl: '/admin/login' });
  };

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r shadow-md">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-2">
          {association.logoUrl ? (
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white">
              <Image
                src={association.logoUrl}
                alt={`${association.name} logo`}
                width={32}
                height={32}
                className="object-cover rounded-full"
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Vote className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <div>
            <div className="font-semibold text-sm">{association.name} Poll</div>
            <div className="text-xs text-muted-foreground">Election Management</div>
          </div>
        </div>
      </div>

      <Separator className="border-border shadow-md" />

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={pathname === item.href ? 'secondary' : 'ghost'}
              className={cn('w-full justify-start mb-4', pathname === item.href && 'bg-secondary')}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </Button>
          </Link>
        ))}
      </nav>

      <Separator />

      {/* Theme Toggle */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sun className="h-4 w-4" />
            <Label htmlFor="theme-toggle" className="text-sm">
              Dark Mode
            </Label>
            <Moon className="h-4 w-4" />
          </div>
          {mounted && (
            <Switch
              id="theme-toggle"
              checked={theme === 'dark'}
              onCheckedChange={handleThemeToggle}
            />
          )}
        </div>
      </div>

      <Separator />

      {/* Logout */}
      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
