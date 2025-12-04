import { NextRequest, NextResponse } from 'next/server';
import { ManifestoVectorStore } from '@/lib/ai/supabase-vector-store';
import { getServerSession } from 'next-auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { candidateId, electionId, manifestoText, action = 'add' } = await req.json();

    if (!candidateId || !electionId) {
      return NextResponse.json(
        { error: 'Candidate ID and Election ID are required' }, 
        { status: 400 }
      );
    }

    let result;
    switch (action) {
      case 'add':
        result = await ManifestoVectorStore.addManifesto(candidateId, electionId, manifestoText);
        break;
      case 'update':
        result = await ManifestoVectorStore.updateManifesto(candidateId, electionId, manifestoText);
        break;
      case 'remove':
        await ManifestoVectorStore.removeManifesto(candidateId, electionId);
        result = { success: true };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Manifesto indexing error:', error);
    return NextResponse.json(
      { error: 'Failed to process manifesto' },
      { status: 500 }
    );
  }
}