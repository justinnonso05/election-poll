import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import CandidatesTable from '@/components/admin/candidates/CandidatesTable';

export default async function CandidatesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/admin/login');
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.user.id },
    select: { associationId: true },
  });

  if (!admin) {
    redirect('/admin/login');
  }

  // Fetch positions for the current association
  const positions = await prisma.position.findMany({
    where: { associationId: admin.associationId },
    select: {
      id: true,
      name: true,
      order: true,
      maxCandidates: true,
      _count: { select: { candidates: true } },
    },
    orderBy: { order: 'asc' },
  });

  const [candidatesData, elections] = await Promise.all([
    prisma.candidate.findMany({
      where: {
        election: {
          associationId: admin.associationId,
        },
      },
      include: {
        election: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
            isActive: true,
          },
        },
        position: {
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
        _count: {
          select: { votes: true },
        },
      },
      orderBy: [{ position: { order: 'asc' } }, { name: 'asc' }],
    }),

    prisma.election.findMany({
      where: { associationId: admin.associationId },
      select: { id: true, title: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Convert dates to strings to avoid serialization issues
  const candidates = candidatesData.map((candidate) => ({
    ...candidate,
    election: {
      ...candidate.election,
      startAt: candidate.election.startAt.toISOString(),
      endAt: candidate.election.endAt.toISOString(),
    },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
        <p className="text-muted-foreground">Manage candidates for your elections</p>
      </div>

      <CandidatesTable candidates={candidates} elections={elections} positions={positions} />
    </div>
  );
}
