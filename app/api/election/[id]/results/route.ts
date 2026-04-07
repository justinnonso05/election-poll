import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, fail } from '@/lib/apiREsponse';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const positions = await prisma.position.findMany({
      where: {
        candidates: { some: { electionId: id } },
      },
      include: {
        candidates: {
          where: { electionId: id },
          include: { _count: { select: { votes: true } } },
          orderBy: { votes: { _count: 'desc' } },
        },
      },
      orderBy: { order: 'asc' },
    });

    const positionResults = positions.map((position) => {
      const totalVotes = position.candidates.reduce((sum, c) => sum + c._count.votes, 0);
      return {
        id: position.id,
        name: position.name,
        order: position.order,
        totalVotes,
        candidates: position.candidates.map((c, i) => ({
          id: c.id,
          name: c.name,
          photoUrl: c.photoUrl,
          votes: c._count.votes,
          percentage: totalVotes > 0 ? (c._count.votes / totalVotes) * 100 : 0,
          isWinner: i === 0 && c._count.votes > 0,
        })),
      };
    });

    return success('Results fetched', positionResults);
  } catch (error) {
    console.error('Results fetch error:', error);
    return fail('Failed to fetch results', null, 500);
  }
}
