import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Vote, TrendingUp, Trophy, Calendar } from 'lucide-react';
import TurnoutChart from '@/components/admin/TurnoutChart';
import PositionResultsSlider from '@/components/admin/PositionResultsSlider';
import TurnoutByLevelChart from '@/components/admin/TurnoutByLevelChart';

async function getDashboardData(associationId: string) {
  // Get active election
  const activeElection = await prisma.election.findFirst({
    where: {
      associationId,
      // isActive: true,
      // startAt: { lte: new Date() },
      // endAt: { gte: new Date() }
    },
    include: {
      association: {
        select: { name: true, description: true },
      },
    },
  });

  if (!activeElection) {
    return {
      election: null,
      stats: null,
      positionResults: [],
      turnoutByLevel: [],
    };
  }

  // Get basic stats
  const totalVoters = await prisma.voter.count({
    where: { associationId },
  });

  const totalVotes = await prisma.voter.count({
    where: { associationId, hasVoted: true },
  });

  const totalCandidates = await prisma.candidate.count({
    where: { electionId: activeElection.id },
  });

  // Get positions with candidates and their votes
  const positions = await prisma.position.findMany({
    where: { associationId },
    include: {
      candidates: {
        where: { electionId: activeElection.id },
        include: {
          votes: {
            select: { id: true },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  // Process position results with vote counts and tie detection
  const positionResults = positions
    .filter((position) => position.candidates.length > 0)
    .map((position) => {
      const candidatesWithVotes = position.candidates
        .map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          manifesto: candidate.manifesto,
          photoUrl: candidate.photoUrl,
          votes: candidate.votes.length,
          percentage: totalVotes > 0 ? (candidate.votes.length / totalVotes) * 100 : 0,
        }))
        .sort((a, b) => b.votes - a.votes); // Sort by votes descending

      // Detect ties and assign positions
      const candidatesWithRanks = candidatesWithVotes.map((candidate, index) => {
        let rank = index + 1;
        let isTied = false;

        // Check if tied with previous candidates
        if (index > 0 && candidate.votes === candidatesWithVotes[index - 1].votes) {
          // Find the rank of the first candidate with this vote count
          for (let i = index - 1; i >= 0; i--) {
            if (candidatesWithVotes[i].votes === candidate.votes) {
              rank = i + 1;
            } else {
              break;
            }
          }
          isTied = true;
        }

        // Check if tied with next candidates
        if (
          index < candidatesWithVotes.length - 1 &&
          candidate.votes === candidatesWithVotes[index + 1].votes
        ) {
          isTied = true;
        }

        return {
          ...candidate,
          rank,
          isTied,
        };
      });

      return {
        id: position.id,
        name: position.name,
        description: position.description,
        totalVotes: candidatesWithVotes.reduce((sum, c) => sum + c.votes, 0),
        candidates: candidatesWithRanks,
      };
    });

  // Get turnout by level using the actual level field
  const allVoters = await prisma.voter.findMany({
    where: { associationId },
    select: {
      level: true,
      hasVoted: true,
    },
  });

  // Group voters by their actual level field
  const levelGroups: Record<string, { total: number; voted: number }> = {};

  allVoters.forEach((voter) => {
    const level = voter.level || 'Unknown';

    if (!levelGroups[level]) {
      levelGroups[level] = { total: 0, voted: 0 };
    }

    levelGroups[level].total++;
    if (voter.hasVoted) {
      levelGroups[level].voted++;
    }
  });

  // Convert to array and calculate percentages, sort by level number
  const turnoutByLevelData = Object.entries(levelGroups)
    .map(([level, data]) => ({
      level,
      total: data.total,
      voted: data.voted,
      percentage: data.total > 0 ? (data.voted / data.total) * 100 : 0,
    }))
    .sort((a, b) => {
      // Sort by level number (100, 200, 300, 400, etc.)
      const aNum = parseInt(a.level) || 999999;
      const bNum = parseInt(b.level) || 999999;
      return aNum - bNum;
    });

  const voterTurnout = totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0;

  return {
    election: {
      ...activeElection,
      startAt: activeElection.startAt.toISOString(),
      endAt: activeElection.endAt.toISOString(),
    },
    stats: {
      totalVoters,
      totalVotes,
      totalCandidates,
      voterTurnout: Math.round(voterTurnout * 100) / 100,
      totalPositions: positionResults.length,
    },
    positionResults,
    turnoutByLevel: turnoutByLevelData,
  };
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/admin/login');

  const associationId = session.user.associationId as string;
  const { election, stats, positionResults, turnoutByLevel } =
    await getDashboardData(associationId);

  if (!election || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Active Election</h2>
            <p className="text-muted-foreground mb-4">
              There are no active elections at this time.
            </p>
            <Badge variant="secondary">No Election Running</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full date format for desktop
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Short date format for mobile
  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getElectionStatus = () => {
    const now = new Date();
    const start = new Date(election.startAt);
    const end = new Date(election.endAt);

    if (now < start) return { status: 'Upcoming', variant: 'secondary' as const, isActive: false };
    if (now > end) return { status: 'Ended', variant: 'destructive' as const, isActive: false };
    return { status: 'Active', variant: 'default' as const, isActive: true };
  };

  const electionStatus = getElectionStatus();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header - Responsive */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-row sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Left side - Election Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 sm:mb-2 truncate">
                {election.title}
              </h1>
              <p className="text-sm text-muted-foreground mb-2 truncate">
                {election.association.name}
              </p>
              
              {/* Desktop date format */}
              <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                {formatDate(election.startAt)} - {formatDate(election.endAt)}
              </p>
              
              {/* Mobile date format */}
              <p className="sm:hidden text-xs text-muted-foreground mb-2">
                {formatDateShort(election.startAt)} - {formatDateShort(election.endAt)}
              </p>
              
              <Badge variant={electionStatus.variant} className="text-xs">
                {electionStatus.status}
              </Badge>
            </div>

            {/* Right side - Turnout */}
            <div className="text-left sm:text-right flex-shrink-0">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {stats.voterTurnout}%
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Voter Turnout</p>
            </div>
          </div>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          {/* Registered Voters Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 md:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                <span className="hidden sm:inline">Registered Voters</span>
                <span className="sm:hidden">Voters</span>
              </CardTitle>
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                {stats.totalVoters.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                Total eligible voters
              </p>
            </CardContent>
          </Card>

          {/* Votes Cast Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 md:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Votes Cast
              </CardTitle>
              <Vote className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                {stats.totalVotes.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                {stats.totalVotes > 0 ? '+' : ''}
                {stats.totalVotes} votes recorded
              </p>
            </CardContent>
          </Card>

          {/* Candidates Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 md:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Candidates
              </CardTitle>
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                {stats.totalCandidates}
              </div>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                Across {stats.totalPositions} positions
              </p>
            </CardContent>
          </Card>

          {/* Turnout Rate Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 md:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                <span className="hidden sm:inline">Turnout Rate</span>
                <span className="sm:hidden">Turnout</span>
              </CardTitle>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                {stats.voterTurnout}%
              </div>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                {stats.totalVoters - stats.totalVotes} voters remaining
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Position Results Slider */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <PositionResultsSlider
            positions={positionResults}
            isElectionActive={electionStatus.isActive}
          />
        </div>

        {/* Charts Row - Responsive Grid */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Overall Turnout Chart */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg text-foreground">
                Overall Voter Turnout
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {stats.totalVotes.toLocaleString()} of {stats.totalVoters.toLocaleString()} voters
                have participated
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <TurnoutChart
                voted={stats.totalVotes}
                notVoted={stats.totalVoters - stats.totalVotes}
                votedPercentage={stats.voterTurnout}
              />
            </CardContent>
          </Card>

          {/* Turnout by Level */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg text-foreground">
                <span className="hidden sm:inline">Turnout by Student Level</span>
                <span className="sm:hidden">Turnout by Level</span>
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Participation breakdown by academic level
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <TurnoutByLevelChart data={turnoutByLevel} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
