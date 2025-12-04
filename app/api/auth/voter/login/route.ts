import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { success, fail } from '@/lib/apiREsponse';
import { z } from 'zod';

const loginSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return fail('Invalid input', result.error.issues, 400);
    }

    const { studentId, password } = result.data;

    // Find voter by student ID
    const voter = await prisma.voter.findFirst({
      where: {
        studentId: studentId,
      },
      include: {
        association: {
          select: { name: true },
        },
      },
    });

    if (!voter) {
      return fail('Invalid student ID or password.', null, 401);
    }

    // Check if voter has already voted
    if (voter.hasVoted) {
      return fail('You have already voted. Multiple voting is not allowed.', null, 403);
    }

    // Direct password comparison (no hashing)
    if (voter.password !== password) {
      return fail('Invalid student ID or password.', null, 401);
    }

    // Check for active elections
    const activeElections = await prisma.election.findMany({
      where: {
        associationId: voter.associationId,
        isActive: true,
        startAt: { lte: new Date() },
        endAt: { gte: new Date() },
      },
    });

    if (activeElections.length === 0) {
      // Check if there are upcoming elections
      const upcomingElections = await prisma.election.findMany({
        where: {
          associationId: voter.associationId,
          isActive: true,
          startAt: { gt: new Date() },
        },
        orderBy: { startAt: 'asc' },
      });

      if (upcomingElections.length > 0) {
        const nextElection = upcomingElections[0];
        return fail(
          `Voting has not started yet. The election "${nextElection.title}" will begin on ${nextElection.startAt.toLocaleString()}.`,
          null,
          400
        );
      }

      // Check if there are ended elections
      const endedElections = await prisma.election.findMany({
        where: {
          associationId: voter.associationId,
          endAt: { lt: new Date() },
        },
      });

      if (endedElections.length > 0) {
        return fail('All elections have ended. Voting is no longer available.', null, 400);
      }

      return fail('No active elections found at this time.', null, 400);
    }

    // Create session (15 minutes but don't tell user)
    const sessionData = {
      id: voter.id,
      email: voter.email,
      studentId: voter.studentId,
      firstName: voter.first_name,
      lastName: voter.last_name,
      associationId: voter.associationId,
      association: voter.association.name,
      loginTime: Date.now(),
    };

    // Set HTTP-only cookie with 15-minute expiration
    const cookieStore = await cookies();
    cookieStore.set('voter-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 900, // 15 minutes in seconds
    });

    return success('Login successful.', {
      voter: {
        id: voter.id,
        email: voter.email,
        firstName: voter.first_name,
        lastName: voter.last_name,
        studentId: voter.studentId,
        association: voter.association.name,
      },
    });
  } catch (error) {
    console.error('Voter login error:', error);
    return fail('Internal server error', null, 500);
  }
}
