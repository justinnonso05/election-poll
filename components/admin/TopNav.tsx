'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import MobileSidebar from '@/components/admin/MobileSidebar';
import { useSession } from 'next-auth/react';

interface Association {
  id: string;
  name: string;
  logoUrl?: string;
}

interface TopNavProps {
  association: Association;
}

export default function TopNav({ association }: TopNavProps) {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!session?.user) return null;

  const initials =
    session.user.email
      ?.split('@')[0]
      .split('.')
      .map((name) => name[0])
      .join('')
      .toUpperCase() || 'AD';

  return (
    <>
      <header className="flex h-14 sm:h-16 items-center justify-between shadow-md border-b bg-card px-3 sm:px-6 z-10">
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <h1 className="text-base sm:text-xl font-semibold truncate">Election Dashboard</h1>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="hidden sm:block">
            <Badge
              variant={session.user.role === 'SUPERADMIN' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {session.user.role}
            </Badge>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer hover:opacity-80 h-8 w-8 sm:h-10 sm:w-10">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem disabled>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session.user.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">{session.user.role}</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {session.user.role === 'SUPERADMIN' && (
                <DropdownMenuItem asChild>
                  <Link href="/admin/manage-admins">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Admins
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <MobileSidebar
        association={association}
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
      />
    </>
  );
}
