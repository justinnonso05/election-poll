import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import VotersTable from '@/components/admin/voters/VotersTable';
import VoterUpload from '@/components/admin/voters/VoterUpload';
import CreateVoterDialog from '@/components/admin/voters/CreateVoterDialog';

export default async function VotersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/admin/login');

  const admin = await prisma.admin.findUnique({
    where: { id: session.user.id },
    include: { association: true },
  });

  if (!admin) redirect('/admin/login');

  const voters = await prisma.voter.findMany({
    where: { associationId: admin.associationId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Voters</h1>
          <p className="text-muted-foreground">Manage voter registrations</p>
        </div>
        <div className="flex gap-2">
          <CreateVoterDialog associationId={admin.associationId} />
          <VoterUpload />
        </div>
      </div>

      <VotersTable voters={voters} />
    </div>
  );
}
