import { GoogleGenerativeAI } from "@google/generative-ai";
import { ManifestoVectorStore } from './supabase-vector-store';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const MODEL_NAME = "gemini-2.5-flash";

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
  if (!manifestoText || manifestoText.trim().length < 100) {
    throw new Error('Manifesto text too short for meaningful summary');
  }

  const model = genAI.getGenerativeModel({ 
    model: MODEL_NAME,
    systemInstruction: "You are an expert political analyst. Your response must be concise, professional, and strictly factual based on the provided text."
  });

  const prompt = `Create a comprehensive summary of this candidate's manifesto. Always go straight to the point without preambles. 

Focus on:
1. Main policy priorities and promises
2. Key initiatives and programs proposed
3. Vision and goals for the position
4. Specific commitments made to voters

Candidate: ${candidateName}

Manifesto Excerpt:
${manifestoText.substring(0, 10000)} ${manifestoText.length > 10000 ? '...' : ''}

Summary (3-4 paragraphs, approximately 200-300 words):`;

  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 Using ${MODEL_NAME} (attempt ${attempt}/${maxRetries})...`);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      if (!summary || summary.length < 50) {
        throw new Error('Generated summary is too short');
      }

      console.log(`✅ Successfully generated summary with ${MODEL_NAME} on attempt ${attempt}`);
      return summary;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`❌ ${MODEL_NAME} attempt ${attempt}/${maxRetries} failed:`, lastError.message);

      if (lastError.message.includes('quota') || lastError.message.includes('429')) {
        break;
      }

      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(`Failed to generate manifesto summary after ${maxRetries} attempts: ${lastError?.message}`);
}

export async function askAboutManifestos(
  electionId: string,
  question: string,
  candidateIds?: string[]
): Promise<ManifestoQAResponse> {
  try {
    const searchResults: ManifestoSearchResult[] = await ManifestoVectorStore.searchManifestos(
      electionId,
      question,
      { k: 8, candidateIds } 
    );

    if (searchResults.length === 0) {
      return {
        answer: "I don't have enough information about the candidates' manifestos to answer that question.",
        sources: [],
        totalSources: 0,
      };
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const context = searchResults
      .map((result: ManifestoSearchResult) =>
        `**[Candidate: ${result.metadata.candidate_name}, Position: ${result.metadata.position}]**: ${result.content}`
      )
      .join('\n\n---\n\n');

    const prompt = `Based on the following candidate manifesto excerpts, answer the question: "${question}"

Context:
${context}

Instructions:
- Provide a detailed and accurate answer based ONLY on the provided context.
- Quote specific commitments or policies.
- Clearly mention which candidate said what.
- If comparing candidates, highlight differences.
- If the context doesn't contain the answer, state that clearly.

Answer:`;

    console.log(`🤖 Consulting ${MODEL_NAME} for Q&A...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;

    return {
      answer: response.text(),
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