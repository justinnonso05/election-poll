import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ElectionManagementSection from '@/components/admin/settings/ElectionManagementSection';
import AdminProfileSection from '@/components/admin/settings/AdminProfileSection';
import AssociationSection from '@/components/admin/settings/AssociationSection';
import DataExportSection from '@/components/admin/settings/DataExportSection';
import DangerZoneSection from '@/components/admin/settings/DangerZoneSection';
import type { Election } from '@prisma/client';

function calculateElectionStatus(election: Election | null) {
  if (!election) return 'NO_ELECTION';

  const now = new Date();
  if (!election.isActive) return 'PAUSED';
  if (now < new Date(election.startAt)) return 'NOT_STARTED';
  if (now > new Date(election.endAt)) return 'ENDED';
  return 'ACTIVE';
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/admin/login');

  // Fetch admin with association
  const admin = await prisma.admin.findUnique({
    where: { id: session.user.id },
    include: { association: true },
  });

  if (!admin) redirect('/admin/login');

  // Fetch current election
  const election = await prisma.election.findFirst({
    where: { associationId: admin.associationId },
    include: {
      candidates: true,
      votes: true,
      _count: {
        select: {
          candidates: true,
          votes: true,
        },
      },
    },
  });

  // Calculate election status
  const electionStatus = calculateElectionStatus(election);

  // Get stats
  const voterCount = await prisma.voter.count({
    where: { associationId: admin.associationId },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your election, profile, and association settings
        </p>
      </div>

      {/* Election Management */}
      <Card>
        <CardHeader>
          <CardTitle>Election Management</CardTitle>
        </CardHeader>
        <CardContent>
          <ElectionManagementSection
            election={election}
            status={electionStatus}
            associationId={admin.associationId}
            isSuper={session.user.role === 'SUPERADMIN'}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Admin Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminProfileSection admin={admin} />
        </CardContent>
      </Card>

      <Separator />

      {/* Association Details */}
      <Card>
        <CardHeader>
          <CardTitle>Association Details</CardTitle>
        </CardHeader>
        <CardContent>
          <AssociationSection association={admin.association} />
        </CardContent>
      </Card>

      <Separator />

      {/* Data Export */}
      {election && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
            </CardHeader>
            <CardContent>
              <DataExportSection election={election} voterCount={voterCount} />
            </CardContent>
          </Card>

          <Separator />
        </>
      )}

      {/* Danger Zone */}
      {session.user.role === 'SUPERADMIN' && election && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <DangerZoneSection election={election} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
