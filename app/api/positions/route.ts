import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { success, fail } from '@/lib/apiREsponse';
import { positionSchema } from '@/lib/schemas/position';


export async function GET(req: Request) {
  try {
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

    const positions = await prisma.position.findMany({
      where: { associationId: admin.associationId },
      include: {
        _count: {
          select: { candidates: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    return success('Positions fetched successfully', positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    return fail('Internal server error', null, 500);
  }
}

export async function POST(req: Request) {
  try {
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
    const result = positionSchema.safeParse(body);

    if (!result.success) {
      return fail('Invalid data', result.error.issues, 400);
    }

    const { name, description, order, maxCandidates } = result.data;

    // Check if position already exists
    const existingPosition = await prisma.position.findFirst({
      where: {
        name: name,
        associationId: admin.associationId,
      },
    });

    if (existingPosition) {
      return fail('Position already exists', null, 409);
    }

    const position = await prisma.position.create({
      data: {
        name,
        description,
        order,
        maxCandidates,
        associationId: admin.associationId,
      },
      include: {
        _count: {
          select: { candidates: true },
        },
      },
    });

    return success('Position created successfully', position, 201);
  } catch (error) {
    console.error('Error creating position:', error);
    return fail('Internal server error', null, 500);
  }
}
