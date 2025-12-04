import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { success, fail } from '@/lib/apiREsponse';
import { prisma } from '@/lib/prisma';
import { generateFAQForElection } from '@/scripts/generate-faq';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return fail('Unauthorized', null, 401);
    }

    const { electionId } = await req.json();

    if (!electionId) {
      return fail('Election ID is required', null, 400);
    }

    // Delete existing FAQ
    await prisma.frequentlyAskedQuestion.deleteMany({
      where: { electionId }
    });

    // Regenerate FAQ
    await generateFAQForElection(electionId);
    
    return success('FAQ regenerated successfully', null);
  } catch (error) {
    console.error('FAQ regeneration error:', error);
    return fail('Failed to regenerate FAQ', null, 500);
  }
}