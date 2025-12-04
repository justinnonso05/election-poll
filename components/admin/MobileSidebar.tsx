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
  X,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

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

interface MobileSidebarProps {
  association: Association;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MobileSidebar({ association, open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    signOut({ callbackUrl: '/admin/login' });
  };

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  const handleNavClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0 z-600">
        {/* Hidden title for accessibility */}
        <VisuallyHidden>
          <SheetTitle>Navigation Menu</SheetTitle>
        </VisuallyHidden>
        
        <div className="flex h-full flex-col bg-card">
          {/* Logo */}
          <SheetHeader className="flex h-16 justify-start px-6 pt-4 border-b">
            <div className="flex space-x-3 w-full">
              {association.logoUrl ? (
                <div className="flex h-8 w-8 rounded-full bg-white flex-shrink-0">
                  <Image
                    src={association.logoUrl}
                    alt={`${association.name} logo`}
                    width={32}
                    height={32}
                    className="object-cover rounded-full"
                  />
                </div>
              ) : (
                <div className="flex h-8 w-8 rounded-full bg-primary flex-shrink-0">
                  <Vote className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <div className="flex text-left justify-left align-left flex-col min-w-0 flex-1">
                <div className="font-semibold text-sm leading-tight truncate">
                  {association.name} Poll
                </div>
                <div className="text-xs text-muted-foreground leading-tight">
                  Election Management
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={handleNavClick}>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start mb-4',
                    pathname === item.href && 'bg-secondary'
                  )}
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
                <Label htmlFor="mobile-theme-toggle" className="text-sm">
                  Dark Mode
                </Label>
                <Moon className="h-4 w-4" />
              </div>
              {mounted && (
                <Switch
                  id="mobile-theme-toggle"
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
      </SheetContent>
    </Sheet>
  );
}