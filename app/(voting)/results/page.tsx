import { prisma } from '@/lib/prisma';
import { formatDateLong } from '@/lib/timezone';
import LiveResultsPage from '@/components/results/LiveResultsPage';
import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getResultsData() {
  // 1. Try to find any election with liveResults enabled (not yet ended)
  const liveElection = await prisma.election.findFirst({
    where: { liveResults: true },
    include: {
      association: { select: { name: true, logoUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (liveElection) {
    const positions = await getPositionResults(liveElection.id, liveElection.associationId);
    return {
      election: {
        id: liveElection.id,
        title: liveElection.title,
        description: liveElection.description,
        startAt: liveElection.startAt,
        endAt: liveElection.endAt,
        isActive: liveElection.isActive,
        liveResults: true,
        isEnded: new Date() > new Date(liveElection.endAt),
        association: liveElection.association,
      },
      positions,
    };
  }

  // 2. Fallback: most recent ended election
  const endedElection = await prisma.election.findFirst({
    where: { endAt: { lt: new Date() } },
    include: {
      association: { select: { name: true, logoUrl: true } },
    },
    orderBy: { endAt: 'desc' },
  });

  if (!endedElection) return null;

  const positions = await getPositionResults(endedElection.id, endedElection.associationId);
  return {
    election: {
      id: endedElection.id,
      title: endedElection.title,
      description: endedElection.description,
      startAt: endedElection.startAt,
      endAt: endedElection.endAt,
      isActive: endedElection.isActive,
      liveResults: false,
      isEnded: true,
      association: endedElection.association,
    },
    positions,
  };
}

async function getPositionResults(electionId: string, associationId: string) {
  const positions = await prisma.position.findMany({
    where: {
      associationId,
      candidates: { some: { electionId } },
    },
    include: {
      candidates: {
        where: { electionId },
        include: { _count: { select: { votes: true } } },
        orderBy: { votes: { _count: 'desc' } },
      },
    },
    orderBy: { order: 'asc' },
  });

  return positions.map((position) => {
    const totalVotes = position.candidates.reduce(
      (sum, c) => sum + c._count.votes,
      0
    );
    return {
      id: position.id,
      name: position.name,
      order: position.order,
      totalVotes,
      candidates: position.candidates.map((c, i) => ({
        id: c.id,
        name: c.name,
        photoUrl: c.photoUrl,
        votes: c._count.votes,
        percentage: totalVotes > 0 ? (c._count.votes / totalVotes) * 100 : 0,
        isWinner: i === 0 && c._count.votes > 0,
      })),
    };
  });
}

export default async function ResultsPage() {
  const data = await getResultsData();

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-bold mb-2">No Results Available</h1>
            <p className="text-muted-foreground mb-4">
              Results will be displayed here once an election has concluded or live results are enabled.
            </p>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              Go to Voting
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <LiveResultsPage
      initialData={data}
      formattedDate={formatDateLong(new Date())}
    />
  );
}