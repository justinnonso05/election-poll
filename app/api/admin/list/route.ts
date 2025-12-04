import { prisma } from '@/lib/prisma';
import { success, fail } from '@/lib/apiREsponse';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return fail('Unauthorized', null, 401);
    }

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        associationId: true,
        association: {
          select: {
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return success('Admins retrieved successfully.', admins);
  } catch (error) {
    console.error(error);
    return fail('Failed to retrieve admins.', null, 500);
  }
}
