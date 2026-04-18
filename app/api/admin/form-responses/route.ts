import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { success, fail } from '@/lib/apiREsponse';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return fail('Unauthorized', null, 401);

    const admin = await prisma.admin.findUnique({
      where: { id: session.user.id },
      select: { associationId: true },
    });
    if (!admin) return fail('Admin not found', null, 404);

    const responses = await prisma.candidateFormResponse.findMany({
      where: { associationId: admin.associationId },
      include: {
        position: { select: { id: true, name: true } },
        election: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success('Responses fetched', responses);
  } catch (error) {
    console.error('Error fetching form responses:', error);
    return fail('Server error', null, 500);
  }
}
