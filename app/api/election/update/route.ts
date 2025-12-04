import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { electionUpdateSchema } from '@/lib/schemas/election';
import { success, fail } from '@/lib/apiREsponse';

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  // if (!session?.user || session.user.role !== "SUPERADMIN") {
  //   return fail("Forbidden: Only superadmins can update elections.", null, 403)
  // }

  try {
    const body = await req.json();
    const result = electionUpdateSchema.safeParse(body);
    if (!result.success) {
      return fail('Invalid data', result.error.issues, 400);
    }

    const { id, title, description, startAt, endAt, isActive } = result.data;

    const election = await prisma.election.update({
      where: { id },
      data: {
        title,
        description,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
        isActive,
      },
    });

    return success('Election updated successfully.', election, 200);
  } catch (error) {
    console.error(error);
    return fail('Failed to update election.', null, 500);
  }
}
