import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateLong } from './timezone';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReceiptData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  matricNumber: string;
  level: string;
  positionName: string;
  electionTitle: string;
  associationName: string;
  associationDescription?: string;
  logoUrl?: string;
  submittedAt: Date;
}

import sharp from 'sharp';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetches an image URL, resizes it to fit within maxW x maxH pixels,
 * converts to JPEG at 80% quality, and returns a base64 data URI.
 * This keeps PDF attachment size well within email limits.
 */
async function fetchAndResizeImage(
  url: string,
  maxW: number,
  maxH: number,
  background: { r: number; g: number; b: number } = { r: 255, g: 255, b: 255 }
): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const resized = await sharp(buffer)
      .resize(maxW, maxH, { fit: 'inside', withoutEnlargement: true })
      .flatten({ background })          // fills transparent pixels with given colour
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${resized.toString('base64')}`;
  } catch {
    return null;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateFormReceiptPDF(data: ReceiptData): Promise<Buffer> {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 18;
  const dark: [number, number, number] = [8, 12, 24];
  const mid: [number, number, number] = [70, 75, 90];
  const light: [number, number, number] = [200, 202, 210];
  let y = 16;

  // ── Outer border for whole page ───────────────────────────────────────────
  doc.setDrawColor(...light);
  doc.setLineWidth(0.6);
  doc.rect(10, 10, pageW - 20, pageH - 20);

  // ── Header block ──────────────────────────────────────────────────────────
  // Pre-fetch logo so we can calculate exact header height
  const logoBase64 = data.logoUrl
    ? await fetchAndResizeImage(data.logoUrl, 90, 90, { r: 8, g: 12, b: 24 })  // flatten against dark bg
    : null;

  // Header height: logo row (20mm) + optional description line + padding
  const hasDesc = Boolean(data.associationDescription);
  const headerH = hasDesc ? 36 : 30;
  doc.setFillColor(...dark);
  doc.rect(10, 10, pageW - 20, headerH, 'F');

  y = 10 + (headerH / 2) - 4;  // vertically centre the content in the header

  if (logoBase64) {
    doc.addImage(logoBase64, 'JPEG', margin, y - 8, 20, 20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(data.associationName, margin + 24, y);
    if (data.associationDescription) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 185, 200);
      const descLines = doc.splitTextToSize(data.associationDescription, pageW - margin - 24 - margin);
      doc.text(descLines, margin + 24, y + 5.5);
    }
  } else {
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(data.associationName, pageW / 2, y, { align: 'center' });
    if (data.associationDescription) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 185, 200);
      const descLines = doc.splitTextToSize(data.associationDescription, pageW - margin * 2);
      doc.text(descLines, pageW / 2, y + 5.5, { align: 'center' });
    }
  }

  y = 10 + headerH;  // move below header

  // ── Receipt title strip ───────────────────────────────────────────────────
  doc.setFillColor(240, 241, 245);
  doc.rect(10, y, pageW - 20, 12, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text('CANDIDATE ELECTORAL FORM — REGISTRATION RECEIPT', pageW / 2, y + 8, { align: 'center' });

  y += 20;

  // Date right-aligned
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mid);
  doc.text(`Date: ${formatDateLong(data.submittedAt)}`, pageW - margin, y, { align: 'right' });

  y += 10;

  // ── Section: Candidate Details ────────────────────────────────────────────
  // Section label
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.setFillColor(235, 237, 244);
  doc.rect(margin, y, pageW - margin * 2, 7, 'F');
  doc.text('CANDIDATE DETAILS', margin + 4, y + 5);
  y += 10;

  // Details table — bordered, each row with label + value
  autoTable(doc, {
    startY: y,
    head: [],
    body: [
      ['First Name', data.firstName],
      ['Last Name', data.lastName],
      ['Email Address', data.email],
      ['Phone Number', data.phone],
      ['Matric Number', data.matricNumber],
      ['Level', `${data.level} Level`],
    ],
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
      lineColor: light,
      lineWidth: 0.3,
      textColor: dark,
    },
    columnStyles: {
      0: {
        fontStyle: 'bold',
        textColor: mid,
        cellWidth: 52,
        fillColor: [247, 248, 251],
      },
      1: {
        fontStyle: 'bold',
        textColor: dark,
      },
    },
  });

  y = (doc as any).lastAutoTable?.finalY + 8 || y + 70;

  // ── Section: Application Details ──────────────────────────────────────────
  doc.setFillColor(235, 237, 244);
  doc.rect(margin, y, pageW - margin * 2, 7, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text('APPLICATION DETAILS', margin + 4, y + 5);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [],
    body: [
      ['Position Aspired For', data.positionName],
      ['Election', data.electionTitle],
    ],
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
      lineColor: light,
      lineWidth: 0.3,
      textColor: dark,
    },
    columnStyles: {
      0: {
        fontStyle: 'bold',
        textColor: mid,
        cellWidth: 52,
        fillColor: [247, 248, 251],
      },
      1: {
        fontStyle: 'bold',
        textColor: dark,
      },
    },
  });

  y = (doc as any).lastAutoTable?.finalY + 30 || y + 40;

  // ── Signature section ─────────────────────────────────────────────────────
  const signatureUrl = process.env.CHAIRMAN_SIGNATURE_URL;
  if (signatureUrl) {
    // White background flatten ensures no dark artefacts on white paper
    const sigBase64 = await fetchAndResizeImage(signatureUrl, 200, 60, { r: 255, g: 255, b: 255 });
    if (sigBase64) {
      doc.addImage(sigBase64, 'JPEG', margin, y, 48, 14);
      y += 15;
    }
  }

  // Signature line
  doc.setDrawColor(...dark);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 80, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text(data.associationName, margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mid);
  doc.text('Electoral Commission — Chairman', margin, y);
  if (data.associationDescription) {
    y += 4.5;
    doc.setFontSize(8);
    doc.setTextColor(140, 143, 155);
    doc.text(data.associationDescription, margin, y);
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFontSize(7.5);
  doc.setTextColor(160, 163, 175);
  doc.text(
    `This is an auto-generated document. © ${new Date().getFullYear()} ${data.associationName}. All rights reserved.`,
    pageW / 2,
    pageH - 14,
    { align: 'center' }
  );

  return Buffer.from(doc.output('arraybuffer'));
}
