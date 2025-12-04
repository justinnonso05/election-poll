import { prisma } from '@/lib/prisma';
import { success, fail } from '@/lib/apiREsponse';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { updatePositionSchema } from '@/lib/schemas/position';

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

    // Await params before using its properties
    const { id } = await params;

    const body = await req.json();
    const result = updatePositionSchema.safeParse(body);

    if (!result.success) {
      return fail('Invalid data', result.error.issues, 400);
    }

    // Check if position exists and belongs to admin's association
    const existingPosition = await prisma.position.findFirst({
      where: {
        id: id,
        associationId: admin.associationId,
      },
    });

    if (!existingPosition) {
      return fail('Position not found', null, 404);
    }

    // If updating name, check for duplicates
    if (result.data.name && result.data.name !== existingPosition.name) {
      const duplicatePosition = await prisma.position.findFirst({
        where: {
          name: result.data.name,
          associationId: admin.associationId,
          id: { not: id },
        },
      });

      if (duplicatePosition) {
        return fail('Position with this name already exists', null, 409);
      }
    }

    const position = await prisma.position.update({
      where: { id: id },
      data: result.data,
      include: {
        _count: {
          select: { candidates: true },
        },
      },
    });

    return success('Position updated successfully', position);
  } catch (error) {
    console.error('Error updating position:', error);
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

    // Check if position exists and belongs to admin's association
    const existingPosition = await prisma.position.findFirst({
      where: {
        id: id,
        associationId: admin.associationId,
      },
    });

    if (!existingPosition) {
      return fail('Position not found', null, 404);
    }

    // Check if position has candidates
    const candidateCount = await prisma.candidate.count({
      where: { positionId: id },
    });

    if (candidateCount > 0) {
      return fail('Cannot delete position with candidates', null, 400);
    }

    await prisma.position.delete({
      where: { id: id },
    });

    return success('Position deleted successfully', null);
  } catch (error) {
    console.error('Delete position error:', error);
    return fail('Failed to delete position', null, 500);
  }
}
