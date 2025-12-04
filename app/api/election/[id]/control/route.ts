import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();
    const { id: electionId } = await params;

    // Validate action
    if (!['start', 'pause', 'end'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get the election
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        association: {
          include: {
            admins: true,
          },
        },
      },
    });

    if (!election) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    }

    // Check if user has permission
    const userAdmin = election.association.admins.find(
      (admin) => admin.email === session?.user?.email
    );
    if (!userAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    let updateData: Prisma.ElectionUpdateInput = {};
    const now = new Date();

    switch (action) {
      case 'start':
        // Start election - set isActive to true
        // Optionally update startAt if election hasn't started yet
        updateData = {
          isActive: true,
          ...(election.startAt > now && { startAt: now }),
        };
        break;

      case 'pause':
        // Pause election - set isActive to false but don't change dates
        updateData = { isActive: false };
        break;

      case 'end':
        // End election - set isActive to false and update endAt
        updateData = {
          isActive: false,
          endAt: now,
        };
        break;
    }

    const updatedElection = await prisma.election.update({
      where: { id: electionId },
      data: updateData,
      include: {
        association: true,
        _count: {
          select: {
            candidates: true,
            votes: true,
          },
        },
      },
    });

    return NextResponse.json({
      election: updatedElection,
      message: `Election ${action}ed successfully`,
    });
  } catch (error) {
    console.error('Election control error:', error);
    return NextResponse.json({ error: 'Failed to control election' }, { status: 500 });
  }
}
