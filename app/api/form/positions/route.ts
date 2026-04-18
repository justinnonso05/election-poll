import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // There is only one association — fetch it automatically
    const association = await prisma.association.findFirst({
      select: { id: true, name: true, description: true, logoUrl: true },
    });

    if (!association) {
      return NextResponse.json({ status: 'fail', message: 'Association not found' }, { status: 404 });
    }

    // Find the most recent election for this association
    const election = await prisma.election.findFirst({
      where: { associationId: association.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true },
    });

    if (!election) {
      return NextResponse.json({ status: 'fail', message: 'No election found' }, { status: 404 });
    }

    const positions = await prisma.position.findMany({
      where: { associationId: association.id },
      select: { id: true, name: true, order: true },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      status: 'success',
      data: {
        association,
        election,
        positions,
      },
    });
  } catch (error) {
    console.error('Error fetching form positions:', error);
    return NextResponse.json({ status: 'fail', message: 'Server error' }, { status: 500 });
  }
}
