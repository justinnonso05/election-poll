import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only superadmins can toggle live results.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { liveResults } = await req.json();

    if (typeof liveResults !== 'boolean') {
      return NextResponse.json({ error: 'liveResults must be a boolean' }, { status: 400 });
    }

    const election = await prisma.election.update({
      where: { id },
      data: { liveResults },
    });

    return NextResponse.json({
      message: `Live results ${liveResults ? 'enabled' : 'disabled'} successfully.`,
      election,
    });
  } catch (error) {
    console.error('Live results toggle error:', error);
    return NextResponse.json({ error: 'Failed to update live results setting.' }, { status: 500 });
  }
}
