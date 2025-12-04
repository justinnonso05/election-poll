import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, fail } from '@/lib/apiREsponse';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const electionId = searchParams.get('electionId');

    if (!electionId) {
      return fail('Election ID is required', null, 400);
    }

    const faqs = await prisma.frequentlyAskedQuestion.findMany({
      where: {
        electionId,
        isActive: true,
      },
      select: {
        id: true,
        question: true,
        answer: true,
        sources: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return success('FAQ retrieved successfully', { faqs });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    return fail('Failed to fetch FAQ', null, 500);
  }
}