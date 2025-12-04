import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Document } from '@langchain/core/documents';
import { supabaseAdmin } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACE_API_KEY!,
  model: "sentence-transformers/all-MiniLM-L6-v2",   // 384-dim
});

// Add the interface for type safety
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

export class ManifestoVectorStore {
  static async addManifesto(candidateId: string, electionId: string, manifestoText: string) {
    try {
      // Get candidate info
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        include: { position: true }
      });

      if (!candidate || !manifestoText.trim()) {
        throw new Error('Candidate not found or empty manifesto');
      }

      // Validate text length to prevent memory issues
      const maxTextLength = 100000; // 100KB max
      const processedText = manifestoText.length > maxTextLength 
        ? manifestoText.substring(0, maxTextLength) + "... (truncated)"
        : manifestoText;

      // Split manifesto into chunks with better error handling
      const chunks = this.splitText(processedText, 1000, 200);
      
      if (chunks.length === 0) {
        throw new Error('No valid chunks created from manifesto text');
      }

      // Limit number of chunks to prevent overload
      const maxChunks = 50;
      const limitedChunks = chunks.slice(0, maxChunks);
      
      let successCount = 0;
      
      // Process each chunk
      for (let i = 0; i < limitedChunks.length; i++) {
        const chunk = limitedChunks[i];
        
        if (!chunk || chunk.trim().length < 10) {
          continue; // Skip empty or very short chunks
        }
        
        try {
          // Generate embedding
          const embeddingArray = await embeddings.embedQuery(chunk);
          
          // DIRECT INSERT - This is the key change!
          const { data, error } = await supabaseAdmin
            .from('manifesto_embeddings')
            .insert({
              electionId: electionId,
              candidateId: candidateId,
              chunkText: chunk,
              embedding: embeddingArray,
              metadata: {
                candidate_id: candidateId,
                election_id: electionId,
                candidate_name: candidate.name,
                position: candidate.position.name,
                chunk_index: i,
                total_chunks: limitedChunks.length,
              }
            })
            .select('id');

          if (error) {
            console.error(`Error inserting chunk ${i}:`, error);
            throw error;
          }
          
          successCount++;
          console.log(`✅ Inserted chunk ${i + 1}/${limitedChunks.length} for ${candidate.name}`);
          
        } catch (chunkError) {
          console.error(`❌ Error processing chunk ${i}:`, chunkError);
          // Continue with other chunks even if one fails
        }
      }

      console.log(`🎉 Successfully added ${successCount}/${limitedChunks.length} chunks for candidate ${candidate.name}`);
      return { success: true, chunksAdded: successCount };
    } catch (error) {
      console.error('Error adding manifesto to vector store:', error);
      throw error;
    }
  }

  static async updateManifesto(candidateId: string, electionId: string, manifestoText: string) {
    try {
      console.log(`🔄 Updating manifesto for candidate ${candidateId}`);
      
      // First remove existing manifesto
      await this.removeManifesto(candidateId, electionId);
      
      // Then add the new manifesto
      const result = await this.addManifesto(candidateId, electionId, manifestoText);
      
      console.log(`✅ Successfully updated manifesto for candidate ${candidateId}`);
      return result;
    } catch (error) {
      console.error('Error updating manifesto:', error);
      throw error;
    }
  }

  static async searchManifestos(
    electionId: string, 
    query: string, 
    options: { k?: number; candidateIds?: string[] } = {}
  ): Promise<ManifestoSearchResult[]> {
    try {
      const { k = 4, candidateIds } = options;
      
      // Generate query embedding
      const queryEmbedding = await embeddings.embedQuery(query);
      
      // DIRECT QUERY - Much simpler!
      let supabaseQuery = supabaseAdmin
        .from('manifesto_embeddings')
        .select('chunkText, metadata, embedding')
        .eq('electionId', electionId);

      // Add candidate filter if provided
      if (candidateIds?.length) {
        supabaseQuery = supabaseQuery.in('candidateId', candidateIds);
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('Search error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('No embeddings found for search');
        return [];
      }

      // Calculate similarities and sort
      const results = data.map((row: any) => {
        // Simple cosine similarity calculation
        const similarity = this.cosineSimilarity(queryEmbedding, row.embedding);
        
        return {
          content: row.chunkText,
          metadata: row.metadata,
          similarity: similarity,
        };
      });

      // Sort by similarity and return top k
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, k);
        
    } catch (error) {
      console.error('Error searching manifestos:', error);
      return [];
    }
  }

  static async removeManifesto(candidateId: string, electionId: string) {
    try {
      const { error } = await supabaseAdmin
        .from('manifesto_embeddings')
        .delete()
        .eq('candidateId', candidateId)
        .eq('electionId', electionId);

      if (error) throw error;
      
      console.log(`Removed manifesto chunks for candidate ${candidateId}`);
    } catch (error) {
      console.error('Error removing manifesto:', error);
      throw error;
    }
  }

  // Proper cosine similarity calculation
  private static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Keep your existing splitText methods unchanged
  private static splitText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    
    try {
      // Validate inputs
      if (!text || typeof text !== 'string') {
        console.warn('Invalid text input for splitting');
        return [];
      }

      if (text.length === 0) {
        return [];
      }

      // Prevent infinite loops and memory issues
      if (chunkSize <= 0 || chunkSize > 10000) {
        chunkSize = 1000;
      }

      if (overlap < 0 || overlap >= chunkSize) {
        overlap = Math.min(200, Math.floor(chunkSize * 0.2));
      }

      let start = 0;
      let iterations = 0;
      const maxIterations = Math.ceil(text.length / (chunkSize - overlap)) + 10;
      
      while (start < text.length && iterations < maxIterations) {
        iterations++;
        
        const end = Math.min(start + chunkSize, text.length);
        let chunk = text.slice(start, end);
        
        // Try to break at word boundaries
        if (end < text.length) {
          const lastSpace = chunk.lastIndexOf(' ');
          const lastNewline = chunk.lastIndexOf('\n');
          const lastBoundary = Math.max(lastSpace, lastNewline);
          
          if (lastBoundary > chunkSize * 0.5) {
            chunk = chunk.slice(0, lastBoundary);
          }
        }
        
        const trimmedChunk = chunk.trim();
        if (trimmedChunk.length > 10) {
          chunks.push(trimmedChunk);
        }
        
        // Calculate next start position
        const nextStart = end - overlap;
        if (nextStart <= start) {
          start = start + Math.max(1, Math.floor(chunkSize / 2));
        } else {
          start = nextStart;
        }
      }

      console.log(`Split text into ${chunks.length} chunks (${iterations} iterations)`);
      return chunks;
      
    } catch (error) {
      console.error('Error in splitText:', error);
      if (text.length <= chunkSize) {
        return [text.trim()];
      }
      return this.simpleSplit(text, chunkSize);
    }
  }

  private static simpleSplit(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    
    try {
      for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize).trim();
        if (chunk.length > 10) {
          chunks.push(chunk);
        }
        
        if (chunks.length > 100) {
          console.warn('Too many chunks created, stopping');
          break;
        }
      }
    } catch (error) {
      console.error('Error in simpleSplit:', error);
      return [text.substring(0, chunkSize)];
    }
    
    return chunks;
  }
}