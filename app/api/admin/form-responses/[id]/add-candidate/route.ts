import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { success, fail } from '@/lib/apiREsponse';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return fail('Unauthorized', null, 401);

    const admin = await prisma.admin.findUnique({
      where: { id: session.user.id },
      select: { associationId: true },
    });
    if (!admin) return fail('Admin not found', null, 404);

    const formResponse = await prisma.candidateFormResponse.findFirst({
      where: { id, associationId: admin.associationId },
      include: {
        position: { select: { id: true } },
        election: { select: { id: true } },
      },
    });
    if (!formResponse) return fail('Response not found', null, 404);

    if (formResponse.addedAsCandidate) {
      return fail('Candidate already added from this response', null, 409);
    }

    const fullName = `${formResponse.firstName} ${formResponse.lastName}`;

    // Check for existing candidate with same name in same election+position
    const existing = await prisma.candidate.findFirst({
      where: {
        name: fullName,
        electionId: formResponse.electionId,
        positionId: formResponse.positionId,
      },
    });
    if (existing) {
      // Mark as added anyway
      await prisma.candidateFormResponse.update({
        where: { id },
        data: { addedAsCandidate: true },
      });
      return success('Candidate already exists (marked as added)', { candidateId: existing.id });
    }

    const candidate = await prisma.candidate.create({
      data: {
        name: fullName,
        electionId: formResponse.electionId,
        positionId: formResponse.positionId,
      },
    });

    await prisma.candidateFormResponse.update({
      where: { id },
      data: { addedAsCandidate: true },
    });

    return success('Candidate added successfully', { candidateId: candidate.id }, 201);
  } catch (error) {
    console.error('Error adding candidate:', error);
    return fail('Server error', null, 500);
  }
}
