import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Users, Calendar, Clock } from 'lucide-react';
import Image from 'next/image';
import { formatDateLong } from '@/lib/timezone';
import DownloadResultsPDF from '@/components/results/DownloadResultsPDF';

// Force dynamic rendering - fetch fresh data on every request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ElectionResult {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  association: {
    name: string;
    logoUrl: string | null;
  };
}

interface PositionResult {
  id: string;
  name: string;
  order: number;
  candidates: CandidateResult[];
  totalVotes: number;
}

interface CandidateResult {
  id: string;
  name: string;
  photoUrl: string | null;
  votes: number;
  percentage: number;
  isWinner: boolean;
}

async function getElectionResults() {
  // Get the most recent ended election (regardless of isActive status)
  const election = await prisma.election.findFirst({
    where: {
      endAt: { lt: new Date() }, // Election must be ended
    },
    include: {
      association: {
        select: {
          name: true,
          logoUrl: true,
        },
      },
    },
    orderBy: { endAt: 'desc' }, // Get the most recent ended election
  });

  if (!election) {
    return null;
  }

  // Get positions with candidates and vote counts
  const positions = await prisma.position.findMany({
    where: {
      associationId: election.associationId,
      candidates: {
        some: {
          electionId: election.id,
        },
      },
    },
    include: {
      candidates: {
        where: {
          electionId: election.id,
        },
        include: {
          _count: {
            select: {
              votes: true,
            },
          },
        },
        orderBy: {
          votes: {
            _count: 'desc',
          },
        },
      },
    },
    orderBy: { order: 'asc' },
  });

  // Calculate results for each position
  const positionResults: PositionResult[] = positions.map((position) => {
    const totalVotes = position.candidates.reduce(
      (sum, candidate) => sum + candidate._count.votes,
      0
    );

    const candidateResults: CandidateResult[] = position.candidates.map(
      (candidate, index) => ({
        id: candidate.id,
        name: candidate.name,
        photoUrl: candidate.photoUrl,
        votes: candidate._count.votes,
        percentage: totalVotes > 0 ? (candidate._count.votes / totalVotes) * 100 : 0,
        isWinner: index === 0 && candidate._count.votes > 0, // First candidate with votes
      })
    );

    return {
      id: position.id,
      name: position.name,
      order: position.order,
      candidates: candidateResults,
      totalVotes,
    };
  });

  const electionResult: ElectionResult = {
    id: election.id,
    title: election.title,
    description: election.description,
    startAt: election.startAt,
    endAt: election.endAt,
    association: election.association,
  };

  return {
    election: electionResult,
    positions: positionResults,
  };
}

function formatDate(date: Date) {
  return formatDateLong(date);
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default async function ResultsPage() {
  const results = await getElectionResults();

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-bold mb-2">No Results Available</h1>
            <p className="text-muted-foreground mb-4">
              There are no completed elections to display results for at this time.
            </p>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Voting
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { election, positions } = results;
  const totalVoters = positions.reduce((sum, pos) => Math.max(sum, pos.totalVotes), 0);

  return (
    <div className="min-h-screen bg-background p-4">
      <div id="results-container" className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              {election.association.logoUrl && (
                <Image
                  src={election.association.logoUrl}
                  alt={election.association.name}
                  width={60}
                  height={60}
                  className="rounded-lg"
                />
              )}
              <div>
                <CardTitle className="text-2xl sm:text-3xl">
                  {election.association.name}
                </CardTitle>
                <p className="text-lg text-muted-foreground">Election Results</p>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{election.title}</h2>
              {election.description && (
                <p className="text-muted-foreground">{election.description}</p>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mt-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Started: {formatDate(election.startAt)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Ended: {formatDate(election.endAt)}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                Total Votes: {totalVoters}
              </div>
            </div>

            {/* Download PDF Button */}
            <div className="mt-6">
              <DownloadResultsPDF
                electionId={election.id}
                electionTitle={election.title}
                associationName={election.association.name}
              />
            </div>
          </CardHeader>
        </Card>

        {/* Results by Position */}
        <div className="space-y-6">
          {positions.map((position) => (
            <Card key={position.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  {position.name}
                  <Badge variant="secondary" className="ml-auto">
                    {position.totalVotes} total votes
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {position.candidates.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No candidates for this position
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-semibold">Rank</th>
                          <th className="text-left p-3 font-semibold">Candidate</th>
                          <th className="text-center p-3 font-semibold">Votes</th>
                          <th className="text-center p-3 font-semibold">Percentage</th>
                          <th className="text-center p-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {position.candidates.map((candidate, index) => (
                          <tr
                            key={candidate.id}
                            className={`border-b transition-colors hover:bg-muted/30 ${candidate.isWinner
                              ? 'bg-green-50 dark:bg-green-950/20'
                              : ''
                              }`}
                          >
                            {/* Rank */}
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${candidate.isWinner
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                  {index + 1}
                                </div>
                              </div>
                            </td>

                            {/* Candidate */}
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                {candidate.photoUrl ? (
                                  <Image
                                    src={candidate.photoUrl}
                                    alt={candidate.name}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 object-cover rounded-full border"
                                  />
                                ) : (
                                  <Avatar className="w-10 h-10">
                                    <AvatarFallback>
                                      {getInitials(candidate.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <span className="font-medium">{candidate.name}</span>
                              </div>
                            </td>

                            {/* Votes */}
                            <td className="p-3 text-center">
                              <span className="text-lg font-bold">{candidate.votes}</span>
                            </td>

                            {/* Percentage */}
                            <td className="p-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-semibold">
                                  {candidate.percentage.toFixed(1)}%
                                </span>
                                <div className="w-full max-w-[100px] bg-muted rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${candidate.isWinner ? 'bg-green-600' : 'bg-blue-600'
                                      }`}
                                    style={{ width: `${candidate.percentage}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="p-3 text-center">
                              {candidate.isWinner && (
                                <Badge className="bg-green-600 text-white font-semibold">
                                  WINNER
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Results are final and official. Generated on{' '}
              {formatDateLong(new Date())}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}