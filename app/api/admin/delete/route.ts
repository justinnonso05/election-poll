import { prisma } from '@/lib/prisma';
import { success, fail } from '@/lib/apiREsponse';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return fail('Unauthorized', null, 401);
    }

    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('id');

    if (!adminId) {
      return fail('Admin ID is required', null, 400);
    }

    // Prevent superadmin from deleting themselves
    if (session.user.id === adminId) {
      return fail('Cannot delete your own account', null, 400);
    }

    await prisma.admin.delete({
      where: { id: adminId },
    });

    return success('Admin deleted successfully.', null);
  } catch (error) {
    console.error(error);
    return fail('Failed to delete admin.', null, 500);
  }
}
