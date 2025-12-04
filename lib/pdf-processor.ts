import { PDFParse } from 'pdf-parse';

export interface ProcessedManifesto {
  text: string;
  pageCount: number;
  wordCount: number;
}

export async function extractTextFromPDF(buffer: Buffer): Promise<ProcessedManifesto> {
  try {
    // Initialize parser with buffer
    const parser = new PDFParse({ data: buffer });
    
    // Extract text using getText method
    const textResult = await parser.getText();

    const cleanText = textResult.text
      .replace(/\s+/g, " ")
      .replace(/\n+/g, "\n")
      .trim();

    if (!cleanText || cleanText.length < 50) {
      throw new Error("PDF appears to be empty or contains insufficient text");
    }

    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

    return {
      text: cleanText,
      pageCount: textResult.total,
      wordCount,
    };
  } catch (error: any) {
    console.error("PDF extraction error:", error);
    if (error.message?.includes("Invalid PDF")) {
      throw new Error("Invalid PDF file format");
    }
    throw new Error("Failed to extract text from PDF");
  }
}

export function validatePDF(file: File): { valid: boolean; error?: string } {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { valid: false, error: "File must be a PDF" };
  }

  const maxSize = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxSize) {
    return { valid: false, error: "PDF file must be less than 10MB" };
  }

  if (file.size === 0) {
    return { valid: false, error: "PDF file cannot be empty" };
  }

  return { valid: true };
}