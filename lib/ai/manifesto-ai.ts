import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ManifestoVectorStore } from './supabase-vector-store';

const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
  model: "gemini-pro-latest",
  temperature: 0.3,
});

// Add type definitions for search results
interface ManifestoSearchResult {
  content: string;
  metadata: {
    candidate_id: string;
    candidate_name: string;
    position: string;
    chunk_index: number;
    total_chunks: number;
    election_id: string;
  };
  similarity: number;
}

interface ManifestoQASource {
  candidateId: string;
  candidateName: string;
  position: string;
  content: string;
  similarity: number;
}

interface ManifestoQAResponse {
  answer: string;
  sources: ManifestoQASource[];
  totalSources: number;
}

export async function generateManifestoSummary(manifestoText: string, candidateName: string): Promise<string> {
  try {
    if (!manifestoText || manifestoText.trim().length < 100) {
      throw new Error('Manifesto text too short for meaningful summary');
    }

    const prompt = `Create a comprehensive summary of this candidate's manifesto. Always go straight to the point. no preambles. Focus on:
1. Main policy priorities and promises
2. Key initiatives and programs proposed
3. Vision and goals for the position
4. Specific commitments made to voters

Candidate: ${candidateName}

Manifesto:
${manifestoText.substring(0, 4000)} ${manifestoText.length > 4000 ? '...' : ''}

Summary (3-4 paragraphs, approximately 200-300 words):`;

    const response = await llm.invoke(prompt);
    const summary = response.content as string;

    if (!summary || summary.length < 50) {
      throw new Error('Generated summary is too short');
    }

    return summary;
  } catch (_error) {
    console.error('Error generating manifesto summary:', _error);
    let errorMessage = 'Unknown error';
    if (_error instanceof Error) {
      errorMessage = _error.message;
    }
    throw new Error(`Failed to generate manifesto summary: ${errorMessage}`);
  }
}

export async function askAboutManifestos(
  electionId: string,
  question: string,
  candidateIds?: string[]
): Promise<ManifestoQAResponse> {
  try {
    // Search for relevant manifesto chunks
    const searchResults: ManifestoSearchResult[] = await ManifestoVectorStore.searchManifestos(
      electionId,
      question,
      { k: 6, candidateIds }
    );

    if (searchResults.length === 0) {
      return {
        answer: "I don't have enough information about the candidates' manifestos to answer that question. Please ensure manifestos have been uploaded and processed.",
        sources: [],
        totalSources: 0,
      };
    }

    // Prepare context from search results
    const context = searchResults
      .map((result: ManifestoSearchResult) => 
        `**${result.metadata.candidate_name} (${result.metadata.position})**: ${result.content}`
      )
      .join('\n\n');

    // Generate answer
    const prompt = `Based on the following manifesto excerpts, provide a comprehensive answer to this question: "${question}"

Context from candidates' manifestos:
${context}

Instructions:
- Provide a detailed and accurate answer based only on the information provided
- Quote specific commitments or policies when relevant
- Mention which specific candidate(s) address the topic and how
- If comparing candidates, highlight key differences in their approaches
- If the information is insufficient for any aspect, state this clearly
- Keep the answer informative but well-structured

Answer:`;

    const response = await llm.invoke(prompt);

    return {
      answer: response.content as string,
      sources: searchResults.map((result: ManifestoSearchResult): ManifestoQASource => ({
        candidateId: result.metadata.candidate_id,
        candidateName: result.metadata.candidate_name,
        position: result.metadata.position,
        content: result.content.substring(0, 300) + "...",
        similarity: result.similarity,
      })),
      totalSources: searchResults.length,
    };
  } catch (error) {
    console.error('Error in manifesto Q&A:', error);
    throw new Error('Failed to process question');
  }
}