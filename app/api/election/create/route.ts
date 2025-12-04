import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { electionSchema } from '@/lib/schemas/election';
import { success, fail } from '@/lib/apiREsponse';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPERADMIN') {
    return fail('Forbidden: Only superadmins can create elections.', null, 403);
  }

  try {
    const body = await req.json();
    const result = electionSchema.safeParse(body);
    if (!result.success) {
      return fail('Invalid data', result.error.issues, 400);
    }

    const { title, description, associationId, startAt, endAt } = result.data;

    const election = await prisma.election.create({
      data: {
        title,
        description,
        associationId,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
      },
    });

    return success('Election created successfully.', election, 201);
  } catch (error) {
    console.error(error);
    return fail('Failed to create election.', null, 500);
  }
}
