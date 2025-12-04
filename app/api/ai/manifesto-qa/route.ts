import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { success, fail } from '@/lib/apiREsponse';
import { askAboutManifestos } from '@/lib/ai/manifesto-ai';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return fail('Unauthorized', null, 401);
    }

    const { electionId, question, candidateIds } = await req.json();

    if (!electionId || !question) {
      return fail('Election ID and question are required', null, 400);
    }

    if (typeof question !== 'string' || question.trim().length < 3) {
      return fail('Question must be at least 3 characters long', null, 400);
    }

    const result = await askAboutManifestos(electionId, question.trim(), candidateIds);
    
    return success('Question processed successfully', result);
  } catch (_error) {
    console.error('Manifesto Q&A error:', _error);
    if (_error instanceof Error) {
     return fail(`Failed to process question: ${_error.message}`, null, 500);
    }
    return fail('Failed to process question', null, 500);
  }
}