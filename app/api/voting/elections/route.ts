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
export async function GET() {
  try {
    const session = await getSessionData();
    if (!session) {
      return fail('Session expired. Please login again.', null, 401);
    }

    // Get active elections for voter's association
    const elections = await prisma.election.findMany({
      where: {
        associationId: session.associationId,
        isActive: true,
        startAt: { lte: new Date() },
        endAt: { gte: new Date() },
      },
      select: {
        id: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(
      'Elections retrieved',
      elections.map((election) => ({
        ...election,
        startAt: election.startAt.toISOString(),
        endAt: election.endAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Get elections error:', error);
    return fail('Internal server error', null, 500);
  }
}
