import { prisma } from '@/lib/prisma';
import { success, fail } from '@/lib/apiREsponse';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { updateCandidateSchema } from '@/lib/schemas/candidate';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const result = updateCandidateSchema.safeParse(body);

    if (!result.success) {
      return fail('Invalid data', result.error.issues, 400);
    }

    // Await params before using its properties
    const { id } = await params;

    // Check candidate exists and belongs to admin's association
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        id: id,
        election: {
          associationId: admin.associationId,
        },
      },
      include: {
        election: true,
        position: true,
      },
    });

    if (!existingCandidate) {
      return fail('Candidate not found', null, 404);
    }

    // If updating position, verify it belongs to admin's association
    if (result.data.positionId) {
      const position = await prisma.position.findFirst({
        where: {
          id: result.data.positionId,
          associationId: admin.associationId,
        },
      });

      if (!position) {
        return fail('Position not found', null, 404);
      }

      // Check candidate limit for new position
      const candidateCount = await prisma.candidate.count({
        where: {
          electionId: existingCandidate.electionId,
          positionId: result.data.positionId,
          id: { not: id }, // Exclude current candidate
        },
      });

      if (candidateCount >= position.maxCandidates) {
        return fail(
          `Maximum ${position.maxCandidates} candidates allowed for this position`,
          null,
          400
        );
      }
    }

    // If updating name, check for duplicates
    if (result.data.name && result.data.name !== existingCandidate.name) {
      const duplicateCandidate = await prisma.candidate.findFirst({
        where: {
          name: result.data.name,
          electionId: existingCandidate.electionId,
          positionId: result.data.positionId || existingCandidate.positionId,
          id: { not: id },
        },
      });

      if (duplicateCandidate) {
        return fail('Candidate with this name already exists for this position', null, 409);
      }
    }

    const candidate = await prisma.candidate.update({
      where: { id: id },
      data: result.data,
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

    return success('Candidate updated successfully', candidate);
  } catch (error) {
    console.error('Error updating candidate:', error);
    return fail('Internal server error', null, 500);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Await params before using its properties
    const { id } = await params;

    // Check if candidate exists and belongs to admin's association
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        id: id,
        election: {
          associationId: admin.associationId,
        },
      },
    });

    if (!existingCandidate) {
      return fail('Candidate not found', null, 404);
    }

    // Check if candidate has votes
    const voteCount = await prisma.vote.count({
      where: { candidateId: id },
    });

    if (voteCount > 0) {
      return fail('Cannot delete candidate with votes', null, 400);
    }

    await prisma.candidate.delete({
      where: { id: id },
    });

    return success('Candidate deleted successfully', null);
  } catch (error) {
    console.error('Delete candidate error:', error);
    return fail('Failed to delete candidate', null, 500);
  }
}

// If you have other methods (GET, PUT, etc.), apply the same fix
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return fail('Unauthorized', null, 401);
    }

    const { id } = await params; // Await params here too

    // ... rest of your GET logic
  } catch (error) {
    console.error('Get candidate error:', error);
    return fail('Failed to get candidate', null, 500);
  }
}
