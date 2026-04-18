import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { success, fail } from '@/lib/apiREsponse';

// DELETE /api/admin/form-responses/[id] — SUPERADMIN only
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return fail('Unauthorized', null, 401);
    if (session.user.role !== 'SUPERADMIN') return fail('Forbidden', null, 403);

    const admin = await prisma.admin.findUnique({
      where: { id: session.user.id },
      select: { associationId: true },
    });
    if (!admin) return fail('Admin not found', null, 404);

    // Verify the response belongs to this association
    const existing = await prisma.candidateFormResponse.findFirst({
      where: { id, associationId: admin.associationId },
    });
    if (!existing) return fail('Response not found', null, 404);

    await prisma.candidateFormResponse.delete({ where: { id } });

    return success('Response deleted', null);
  } catch (error) {
    console.error('Error deleting form response:', error);
    return fail('Server error', null, 500);
  }
}
