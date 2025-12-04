import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import VoterLogin from '@/components/voting/VoterLogin';
import VotingInterface from '@/components/voting/VotingInterface';

async function getVoterSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('voter-session')?.value;
  if (!sessionCookie) return null;

  try {
    const sessionData = JSON.parse(sessionCookie);

    // Check if session has expired (15 minutes)
    if (Date.now() - sessionData.loginTime > 900000) {
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function getActiveElectionData(associationId: string) {
  // Get the single active election with association data
  const election = await prisma.election.findFirst({
    where: {
      associationId: associationId,
      isActive: true,
      startAt: { lte: new Date() },
      endAt: { gte: new Date() },
    },
    include: {
      association: {
        select: {
          name: true,
          logoUrl: true,
        },
      },
    },
  });

  if (!election) return null;

  return {
    id: election.id,
    title: election.title,
    description: election.description,
    startAt: election.startAt.toISOString(),
    endAt: election.endAt.toISOString(),
    association: election.association,
  };
}

async function getElectionPositions(electionId: string, associationId: string) {
  const positions = await prisma.position.findMany({
    where: {
      associationId: associationId,
    },
    include: {
      candidates: {
        where: {
          electionId: electionId,
        },
        select: {
          id: true,
          name: true,
          manifesto: true,
          photoUrl: true,
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  // Filter out positions with no candidates
  return positions.filter((position) => position.candidates.length > 0);
}

export default async function VotingPage() {
  const session = await getVoterSession();

  // If not logged in, show login form
  if (!session) {
    return <VoterLogin />;
  }

  // Check if voter exists and hasn't voted
  const voter = await prisma.voter.findUnique({
    where: { id: session.id },
    include: {
      association: {
        select: {
          name: true,
          logoUrl: true,
        },
      },
    },
  });

  if (!voter) {
    // Invalid session, redirect to logout
    redirect('/logout');
  }

  // If voter has already voted, show thank you message
  if (voter.hasVoted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-2 sm:p-4">
        <div className="text-center max-w-md bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="w-16 h-16 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Vote Submitted!</h1>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            Your vote has been successfully recorded. Thank you for participating in the democratic
            process.
          </p>
          <form action="/logout" method="POST">
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Get active election data
  const election = await getActiveElectionData(session.associationId);

  // If no active election, show message
  if (!election) {
    // Check for upcoming elections
    const upcomingElection = await prisma.election.findFirst({
      where: {
        associationId: session.associationId,
        isActive: true,
        startAt: { gt: new Date() },
      },
      orderBy: { startAt: 'asc' },
    });

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-2 sm:p-4">
        <div className="text-center max-w-md bg-card rounded-lg border border-border p-6 shadow-sm">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
            {upcomingElection ? 'Voting Not Started' : 'No Active Elections'}
          </h1>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            {upcomingElection
              ? `The election "${upcomingElection.title}" will begin on ${upcomingElection.startAt.toLocaleDateString()}.`
              : 'There are no active elections at this time.'}
          </p>
          <form action="/logout" method="POST">
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Get positions for the active election
  const positions = await getElectionPositions(election.id, session.associationId);

  if (positions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-2 sm:p-4">
        <div className="text-center max-w-md bg-card rounded-lg border border-border p-6 shadow-sm">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
            No Candidates Available
          </h1>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            There are no candidates registered for the current election.
          </p>
          <form action="/logout" method="POST">
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </form>
        </div>
      </div>
    );
  }

  const voterData = {
    id: voter.id,
    email: voter.email,
    firstName: voter.first_name,
    lastName: voter.last_name,
    studentId: voter.studentId,
    association: voter.association,
  };

  return <VotingInterface voter={voterData} election={election} positions={positions} />;
}
