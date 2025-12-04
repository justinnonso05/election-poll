import { prisma } from '@/lib/prisma';
import { success, fail } from '@/lib/apiREsponse';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';
import { updateSchema } from '@/lib/schemas/admin';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return fail('Unauthorized', null, 401);
    }

    const body = await req.json();
    const { id, role } = body;

    if (!id || !role) {
      return fail('ID and role are required', null, 400);
    }

    if (!['ADMIN', 'SUPERADMIN'].includes(role)) {
      return fail('Invalid role', null, 400);
    }

    const admin = await prisma.admin.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        associationId: true,
      },
    });

    return success('Admin role updated successfully.', admin);
  } catch (error) {
    console.error(error);
    return fail('Failed to update admin.', null, 500);
  }
}
