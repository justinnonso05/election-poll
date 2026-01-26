import { prisma } from '@/lib/prisma';
import { success, fail } from '@/lib/apiREsponse';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { roleUpdateSchema } from '@/lib/schemas/admin';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return fail('Unauthorized', null, 401);
    }

    if (session.user.role !== 'SUPERADMIN') {
      return fail('Forbidden: Only Super Admins can update roles', null, 403);
    }

    const body = await req.json();

    // Validate the request body
    const validation = roleUpdateSchema.safeParse(body);
    if (!validation.success) {
      return fail('Invalid request data', validation.error.issues, 400);
    }

    const { id, role } = validation.data;

    // Prevent removing own superadmin status if there are no other superadmins (optional safety check, maybe later)
    // For now just update

    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        associationId: true,
      },
    });

    return success('Admin role updated successfully', updatedAdmin);
  } catch (error) {
    console.error('Admin role update error:', error);
    return fail('Failed to update admin role', null, 500);
  }
}
