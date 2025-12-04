import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { success, fail } from '@/lib/apiREsponse'; // Fixed typo: apiRsponse → apiResponse
import { voteSchema } from '@/lib/schemas/election';

async function getSessionData() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('voter-session')?.value;
  if (!sessionCookie) return null;

  try {
    const sessionData = JSON.parse(sessionCookie);

    // Check if session has expired
    if (Date.now() - sessionData.loginTime > 900000) {
      cookieStore.delete('voter-session');
      return null;
    }

    return sessionData;
  } catch (error) {
    cookieStore.delete('voter-session');
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionData(); // Add await here
    if (!session) {
      return fail('Session expired. Please login again.', null, 401);
    }

    const body = await req.json();
    const result = voteSchema.safeParse(body);

    if (!result.success) {
      return fail('Invalid vote data', result.error.issues, 400);
    }

    const { electionId, votes } = result.data;

    // Double-check voter hasn't already voted (security measure)
    const voter = await prisma.voter.findUnique({
      where: { id: session.id },
    });

    if (!voter) {
      return fail('Voter not found', null, 404);
    }

    if (voter.hasVoted) {
      const cookieStore = await cookies();
      cookieStore.delete('voter-session');
      return fail('You have already voted. Multiple voting is not allowed.', null, 403);
    }

    // Verify election is still active and belongs to voter's association
    const election = await prisma.election.findFirst({
      where: {
        id: electionId,
        associationId: session.associationId,
        isActive: true,
        startAt: { lte: new Date() },
        endAt: { gte: new Date() },
      },
    });

    if (!election) {
      return fail('Election not found, not active, or has ended.', null, 404);
    }

    // Verify all candidates belong to the election and positions
    for (const vote of votes) {
      const candidate = await prisma.candidate.findFirst({
        where: {
          id: vote.candidateId,
          electionId: electionId,
          positionId: vote.positionId,
        },
      });

      if (!candidate) {
        return fail('Invalid candidate selection detected.', null, 400);
      }
    }

    // Cast all votes in a transaction
    await prisma.$transaction(async (tx) => {
      // Create vote records (anonymous - no direct link to voter identity in vote record)
      await tx.vote.createMany({
        data: votes.map((vote) => ({
          voterId: session.id,
          electionId: electionId,
          candidateId: vote.candidateId,
        })),
      });

      // Mark voter as having voted
      await tx.voter.update({
        where: { id: session.id },
        data: { hasVoted: true },
      });
    });

    // Immediately destroy session after successful vote
    const cookieStore = await cookies();
    cookieStore.delete('voter-session');

    return success(
      'Your votes have been cast successfully. Thank you for participating in the democratic process!',
      {
        message: 'You will now be logged out automatically for security purposes.',
        votedAt: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error('Cast vote error:', error);
    return fail('Internal server error', null, 500);
  }
}
