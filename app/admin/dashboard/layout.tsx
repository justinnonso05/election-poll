import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import Sidebar from '@/components/admin/Sidebar';
import TopNav from '@/components/admin/TopNav';
import SessionProvider from '@/components/providers/SessionProvider';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/admin/login');
  }

  const rawAssociation = await prisma.association.findUnique({
    where: { id: session.user.associationId },
    select: { id: true, name: true, logoUrl: true },
  });

  if (!rawAssociation) {
    redirect('/admin/login');
  }

  const association = {
    ...rawAssociation,
    logoUrl: rawAssociation.logoUrl ?? undefined,
  };

  return (
    <SessionProvider>
      <div className="flex h-screen bg-background">
        {/* Desktop Sidebar - Hidden on mobile, show on desktop */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <Sidebar association={association} />
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNav association={association} />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 scrollbar-hide md:scrollbar-default">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
