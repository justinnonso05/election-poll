import cloudinary from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';
import { extractTextFromPDF, validatePDF } from '@/lib/pdf-processor';
import { generateManifestoSummary } from '@/lib/ai/manifesto-ai';
import { ManifestoVectorStore } from '@/lib/ai/supabase-vector-store';
import { success, fail } from '@/lib/apiREsponse';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // "candidate" or "manifesto"
    const candidateId = formData.get('candidateId') as string; // for DB update

    if (!file) {
      return fail('No file uploaded', null, 400);
    }

    if (file.size > MAX_SIZE) {
      return fail('File too large (max 10MB)', null, 413);
    }

    // Handle different file types
    if (type === 'manifesto') {
      // Validate PDF for manifesto uploads
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        return fail(
          'Only PDF files are allowed for manifesto uploads. Please convert your document to PDF before uploading.',
          null,
          415
        );
      }

      const validation = validatePDF(file);
      if (!validation.valid) {
        return fail(validation.error!, null, 400);
      }

      return await processManifestoPDF(file, candidateId);
    } else {
      // Handle image uploads (existing logic)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return fail(
          'Only JPEG, PNG, and WebP images are allowed for photo uploads.',
          null,
          415
        );
      }

      return await processImageUpload(file, type, candidateId);
    }
  } catch (error: unknown) {
    console.error('Upload error:', error);
    let errorMessage = 'Unknown error occurred during upload';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return fail(errorMessage, null, 500);
  }
}

async function processImageUpload(file: File, type: string, candidateId: string) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get original filename and extension
    const originalFilename = file.name;
    const extension = originalFilename.split('.').pop();
    const publicId = originalFilename.replace(/\.[^/.]+$/, '');

    // Upload to Cloudinary
    const uploadRes = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'evoting/images',
          resource_type: 'image',
          public_id: publicId,
          format: extension,
          timeout: 60000,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    // @ts-expect-error
    const secureUrl = uploadRes.secure_url;

    // Save to DB if candidateId provided
    if (candidateId && type === 'candidate') {
      await prisma.candidate.update({
        where: { id: candidateId },
        data: { photoUrl: secureUrl },
      });
    }

    return success('Image uploaded successfully', { url: secureUrl });
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Failed to upload image');
  }
}

async function processManifestoPDF(file: File, candidateId: string) {
  try {
    if (!candidateId) {
      return fail('Candidate ID is required for manifesto uploads', null, 400);
    }

    // Get candidate info
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { position: true },
    });

    if (!candidate) {
      return fail('Candidate not found', null, 404);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 1: Extract text from PDF
    const extracted = await extractTextFromPDF(buffer);

    // Step 2: Upload PDF to Cloudinary
    const originalFilename = file.name;
    const extension = originalFilename.split('.').pop();
    const publicId = `manifesto-${candidateId}-${Date.now()}`;

    const uploadRes = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'evoting/manifestos',
          resource_type: 'auto', // Let Cloudinary detect the type
          public_id: publicId,
          format: extension,
          timeout: 60000,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    // @ts-expect-error
    const secureUrl = uploadRes.secure_url;

    // Step 3: Generate AI summary
    const summary = await generateManifestoSummary(extracted.text, candidate.name);

    // Step 4: Update candidate in database
    const updatedCandidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        manifesto: secureUrl,          // PDF URL in Cloudinary
        manifestoText: extracted.text, // Extracted text
        manifestoSummary: summary,     // AI-generated summary
      },
    });

    // Step 5: Index manifesto in vector store for Q&A
    await ManifestoVectorStore.addManifesto(
      candidateId,
      candidate.electionId,
      extracted.text
    );

    return success('Manifesto uploaded, processed, and indexed successfully', {
      candidate: {
        id: updatedCandidate.id,
        name: updatedCandidate.name,
        manifestoUrl: updatedCandidate.manifesto,
        summary: updatedCandidate.manifestoSummary,
      },
      upload: {
        url: secureUrl,
        cloudinaryPublicId: publicId,
      },
      extraction: {
        pageCount: extracted.pageCount,
        wordCount: extracted.wordCount,
        textLength: extracted.text.length,
      },
    });

  } catch (error: unknown) { // Fixed: proper error typing
    console.error('Manifesto processing error:', error);
    
    let errorMessage = 'Failed to process manifesto';
    
    if (error instanceof Error) {
      if (error.message.includes('PDF')) {
        errorMessage = `PDF Processing Error: ${error.message}`;
      } else if (error.message.includes('summary')) {
        errorMessage = 'Failed to generate manifesto summary';
      } else if (error.message.includes('vector')) {
        errorMessage = 'Failed to index manifesto for search';
      } else {
        errorMessage = error.message;
      }
    }
    
    return fail(errorMessage, null, 500);
  }
}