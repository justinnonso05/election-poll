import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { success, fail } from '@/lib/apiREsponse';
import type { Prisma } from '@prisma/client';
import { candidateSchema } from '@/lib/schemas/candidate';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail('Unauthorized', null, 401);
    }

    const { searchParams } = new URL(req.url);
    const electionId = searchParams.get('electionId');

    const admin = await prisma.admin.findUnique({
      where: { id: session.user.id },
      select: { associationId: true },
    });

    if (!admin) {
      return fail('Admin not found', null, 404);
    }

    const whereClause: Prisma.CandidateWhereInput = {
      election: {
        associationId: admin.associationId,
      },
    };

    if (electionId) {
      whereClause.electionId = electionId;
    }

    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      include: {
        election: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
            isActive: true,
          },
        },
        position: {
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
        _count: {
          select: { votes: true },
        },
      },
      orderBy: [{ position: { order: 'asc' } }, { name: 'asc' }],
    });

    return success('Candidates fetched successfully', candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return fail('Internal server error', null, 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail('Unauthorized', null, 401);
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.user.id },
      select: { associationId: true },
    });

    if (!admin) {
      return fail('Admin not found', null, 404);
    }

    const body = await req.json();
    const result = candidateSchema.safeParse(body);

    if (!result.success) {
      return fail('Invalid data', result.error.issues, 400);
    }

    const { name, manifesto, photoUrl, electionId, positionId } = result.data;

    // Verify election belongs to admin's association
    const election = await prisma.election.findFirst({
      where: {
        id: electionId,
        associationId: admin.associationId,
      },
    });

    if (!election) {
      return fail('Election not found', null, 404);
    }

    // Verify position belongs to admin's association
    const position = await prisma.position.findFirst({
      where: {
        id: positionId,
        associationId: admin.associationId,
      },
    });

    if (!position) {
      return fail('Position not found', null, 404);
    }

    // Check if candidate name already exists for this position in this election
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        name,
        electionId,
        positionId,
      },
    });

    if (existingCandidate) {
      return fail('Candidate with this name already exists for this position', null, 409);
    }

    // Check if position has reached max candidates
    const candidateCount = await prisma.candidate.count({
      where: { electionId, positionId },
    });

    if (candidateCount >= position.maxCandidates) {
      return fail(
        `Maximum ${position.maxCandidates} candidates allowed for this position`,
        null,
        400
      );
    }

    const candidate = await prisma.candidate.create({
      data: {
        name,
        manifesto,
        photoUrl:
          photoUrl ||
          'https://res.cloudinary.com/dpyxbvcyl/image/upload/v1759396141/UNDECIDED_qsubo3.png',
        electionId,
        positionId,
      },
      include: {
        election: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
            isActive: true,
          },
        },
        position: {
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
        _count: {
          select: { votes: true },
        },
      },
    });

    return success('Candidate created successfully', candidate, 201);
  } catch (error) {
    console.error('Error creating candidate:', error);
    return fail('Internal server error', null, 500);
  }
}
