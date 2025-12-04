import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateVoterPassword } from '@/lib/utils/password';
import { success, fail } from '@/lib/apiREsponse';
import { voterSchema } from '@/lib/schemas/voter';

export async function POST(req: Request) {
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

  const body = await req.json();
  const result = voterSchema.safeParse(body);

  if (!result.success) {
    return fail('Invalid data', result.error.issues, 400);
  }

  const { first_name, last_name, email, level, studentId } = result.data;

  // Check if voter already exists
  const existingVoter = await prisma.voter.findFirst({
    where: {
      OR: [{ email }, { studentId }],
      associationId: admin.associationId,
    },
  });

  if (existingVoter) {
    return fail('Voter already exists with this email or student ID', null, 409);
  }

  const voter = await prisma.voter.create({
    data: {
      email,
      password: generateVoterPassword(),
      first_name,
      last_name,
      level,
      studentId,
      associationId: admin.associationId,
    },
  });

  return success('Voter created successfully', voter, 201);
}
