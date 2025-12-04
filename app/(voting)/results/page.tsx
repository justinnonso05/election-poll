import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Users, Calendar, Clock } from 'lucide-react';
import Image from 'next/image';

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
  // Get the most recent ended election
  const election = await prisma.election.findFirst({
    where: {
      isActive: true,
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
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
      <div className="max-w-4xl mx-auto space-y-6">
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
                <div className="space-y-4">
                  {position.candidates.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No candidates for this position
                    </p>
                  ) : (
                    position.candidates.map((candidate, index) => (
                      <div
                        key={candidate.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                          candidate.isWinner
                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                            : 'bg-card'
                        }`}
                      >
                        {/* Ranking */}
                        <div className="flex-shrink-0">
                          {candidate.isWinner ? (
                            <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold">
                              👑
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center font-semibold">
                              {index + 1}
                            </div>
                          )}
                        </div>

                        {/* Candidate Photo */}
                        <div className="flex-shrink-0">
                          {candidate.photoUrl ? (
                            <Image
                              src={candidate.photoUrl}
                              alt={candidate.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-cover rounded-full border"
                            />
                          ) : (
                            <Avatar className="w-12 h-12">
                              <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>

                        {/* Candidate Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{candidate.name}</h3>
                            {candidate.isWinner && (
                              <Badge className="bg-green-600 text-white">Winner</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">
                              {candidate.votes} votes ({candidate.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>

                        {/* Vote Bar */}
                        <div className="flex-shrink-0 w-32">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                candidate.isWinner
                                  ? 'bg-green-600'
                                  : 'bg-blue-600'
                              }`}
                              style={{ width: `${candidate.percentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Vote Count */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-lg font-bold">{candidate.votes}</div>
                          <div className="text-xs text-muted-foreground">
                            {candidate.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Results are final and official. Generated on{' '}
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}