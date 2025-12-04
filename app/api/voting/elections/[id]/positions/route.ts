import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { success, fail } from '@/lib/apiREsponse';

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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params first
    const { id: electionId } = await params;

    const session = await getSessionData();
    if (!session) {
      return fail('Session expired. Please login again.', null, 401);
    }

    // Verify election belongs to voter's association and is active
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

    // Get positions with candidates for this specific election
    const positions = await prisma.position.findMany({
      where: {
        associationId: session.associationId,
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

    // Filter out positions with no candidates (optional - you can keep them if you want to show empty positions)
    const positionsWithCandidates = positions.filter((position) => position.candidates.length > 0);

    return success('Positions with candidates retrieved', positionsWithCandidates);
  } catch (error) {
    console.error('Get positions error:', error);
    return fail('Internal server error', null, 500);
  }
}
