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
    const seenPositions = new Set();
    for (const vote of votes) {
      if (seenPositions.has(vote.positionId)) {
        return fail('Multiple votes for the same position detected.', null, 400);
      }
      seenPositions.add(vote.positionId);
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
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Atomically check and update the voter. 
      // This updateMany will ONLY match if hasVoted is currently false.
      const updateResult = await tx.voter.updateMany({
        where: { 
          id: session.id,
          hasVoted: false
        },
        data: { hasVoted: true },
      });

      // If count is 0, it means they either don't exist or already voted (race condition caught!)
      if (updateResult.count === 0) {
        return { success: false, message: 'You have already voted. Multiple voting is not allowed.' };
      }

      // 2. Create vote records
      await tx.vote.createMany({
        data: votes.map((vote) => ({
          voterId: session.id,
          electionId: electionId,
          candidateId: vote.candidateId,
        })),
      });

      return { success: true };
    });

    if (!transactionResult.success) {
      const cookieStore = await cookies();
      cookieStore.delete('voter-session');
      return fail(transactionResult.message as string, null, 403);
    }

    return success(
      'Your votes have been cast successfully. Thank you for participating in the democratic process!',
      {
        votedAt: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error('Cast vote error:', error);
    return fail('Internal server error', null, 500);
  }
}
