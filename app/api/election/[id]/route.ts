import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { success, fail } from '@/lib/apiREsponse';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPERADMIN') {
    return fail('Forbidden: Only superadmins can delete elections.', null, 403);
  }

  try {
    const { id } = await params;

    // Validate id as UUID
    if (!z.uuid().safeParse(id).success) {
      return fail('Invalid election ID', null, 400);
    }

    await prisma.election.delete({
      where: { id },
    });

    return success('Election deleted successfully.', null, 200);
  } catch (error) {
    console.error(error);
    return fail('Failed to delete election.', null, 500);
  }
}
