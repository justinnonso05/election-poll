import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Election, Candidate, Position, Vote, Voter, Association } from '@prisma/client';
import { formatDateLong } from './timezone';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}

type ElectionWithData = Election & {
  association: Association;
  candidates: (Candidate & {
    position: Position;
    formResponse?: any;
    _count: { votes: number };
  })[];
  votes: (Vote & {
    voter: Voter;
    candidate: Candidate & { position: Position };
  })[];
};

/**
 * Fetch image as Base64 Data URI to embed in PDF
 */
async function getBase64Image(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const base64 = buffer.toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Failed to fetch image for PDF:', error);
    return null;
  }
}

/**
 * Get Theme Color from Env
 */
function getThemeColor(): [number, number, number] {
  const hex = process.env.PDF_THEME_COLOR || '#138c01';
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [19, 140, 1]; // Default #138c01
}

/**
 * Add watermark
 */
function addWatermark(doc: jsPDF, logoDataUri: string | null) {
  if (!logoDataUri) return;
  try {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
    const wmSize = 140;
    doc.addImage({
      imageData: logoDataUri,
      x: (pageWidth - wmSize) / 2,
      y: (pageHeight - wmSize) / 2,
      width: wmSize,
      height: wmSize,
      alias: 'ASSOC_LOGO',
      compression: 'FAST'
    });
    doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
  } catch (e) {
    // Ignore if GState is not supported
  }
}

/**
 * Add customized header
 */
function addHeader(
  doc: jsPDF,
  title: string,
  association: Association,
  logoDataUri: string | null,
  dummyRun = false,
  showDate = true
): number {
  const [r, g, b] = getThemeColor();
  const pageWidth = doc.internal.pageSize.width;

  if (!dummyRun) {
    addWatermark(doc, logoDataUri);
  }

  // 1. Logo Header
  if (!dummyRun && logoDataUri) {
    try {
      doc.addImage({
        imageData: logoDataUri,
        x: 14,
        y: 15,
        width: 25,
        height: 25,
        alias: 'ASSOC_LOGO',
        compression: 'FAST'
      });
    } catch (e) {}
  }

  // 2. Association Description (Now on Top) & Name (Now on Bottom)
  const textX = logoDataUri ? 44 : 14;
  doc.setTextColor(r, g, b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);

  // Use description for the top line
  const topText = (association.description || '').toUpperCase();
  const topLines = doc.splitTextToSize(topText, pageWidth - textX - 14);
  if (!dummyRun) doc.text(topLines, textX, 24);

  let currentY = 24 + ((topLines.length - 1) * 9);
  
  // Use name for the bottom line
  if (association.name) {
    currentY += 7;
    doc.setFontSize(13);
    const bottomLines = doc.splitTextToSize(association.name.toUpperCase(), pageWidth - textX - 14);
    if (!dummyRun) doc.text(bottomLines, textX, currentY);
    currentY += ((bottomLines.length - 1) * 6);
  }

  const headerBottomY = Math.max(42, currentY + 8);

  // 3. Decorations (Lines & Dates & Title)
  if (!dummyRun) {
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.5);
    
    // Double solid line instead of broken lines
    doc.line(14, headerBottomY, pageWidth - 14, headerBottomY);
    doc.line(14, headerBottomY + 1.5, pageWidth - 14, headerBottomY + 1.5);

    let titleY = headerBottomY + 10;
    
    if (showDate) {
      doc.setTextColor(0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const dateStr = `DATE:       ${formatDateLong(new Date())}`;
      doc.text(dateStr, pageWidth - 14, titleY, { align: 'right' });

      const dateWidth = doc.getTextWidth(dateStr);
      doc.setDrawColor(r, g, b);
      doc.line(pageWidth - 14 - dateWidth, titleY + 2, pageWidth - 14, titleY + 2);
      doc.line(pageWidth - 14 - dateWidth, titleY + 3.5, pageWidth - 14, titleY + 3.5);
      titleY += 14;
    } else {
      titleY += 4;
    }

    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), pageWidth / 2, titleY, { align: 'center' });
  }

  return headerBottomY + (showDate ? 34 : 20); // Returns start Y for main content
}

/**
 * Add footer to PDF
 */
function addFooter(doc: jsPDF, pageNumber: number) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setTextColor(128);
  doc.text(`Page ${pageNumber}`, doc.internal.pageSize.width / 2, pageHeight - 10, { align: 'center' });
  doc.text(`Generated on ${formatDateLong(new Date())}`, 14, pageHeight - 10);
  doc.setTextColor(0);
}

/**
 * Generate PDF for election results
 */
export async function generateResultsPDF(election: ElectionWithData): Promise<Buffer> {
  const doc = new jsPDF();
  const logoDataUri = await getBase64Image(election.association.logoUrl);
  const [r, g, b] = getThemeColor();
  const reportTitle = 'Election Results Report';
  
  const contentStartY = addHeader(doc, reportTitle, election.association, logoDataUri, true);
  const initializedPages = new Set<number>();

  const initPage = () => {
    const pageNumber = doc.getNumberOfPages();
    if (initializedPages.has(pageNumber)) return;
    initializedPages.add(pageNumber);
    
    // Only print watermark on subsequent pages, as header covers page 1
    if (pageNumber > 1) {
      addWatermark(doc, logoDataUri);
    }
    addFooter(doc, pageNumber);
  };

  addHeader(doc, reportTitle, election.association, logoDataUri, false);
  initializedPages.add(1);
  addFooter(doc, 1);

  let yPos = contentStartY;

  // Summary
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Election:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(election.title, 50, yPos);

  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Period:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatDateLong(election.startAt)} - ${formatDateLong(election.endAt)}`, 50, yPos);

  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Votes:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(election.votes.length.toString(), 50, yPos);

  yPos += 12;

  const positionMap = new Map<string, typeof election.candidates>();
  election.candidates.forEach(candidate => {
    const positionId = candidate.position.id;
    if (!positionMap.has(positionId)) positionMap.set(positionId, []);
    positionMap.get(positionId)!.push(candidate);
  });

  Array.from(positionMap.entries())
    .sort(([, a], [, b]) => a[0].position.order - b[0].position.order)
    .forEach(([, candidates], index) => {
      const position = candidates[0].position;
      const totalVotes = candidates.reduce((sum, c) => sum + c._count.votes, 0);
      const sortedCandidates = [...candidates].sort((a, b) => b._count.votes - a._count.votes);

      if (index > 0 && yPos > doc.internal.pageSize.height - 40) {
        doc.addPage();
        yPos = 20; // reset yPos for new page
        initPage();
      }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(position.name, 14, yPos);
      yPos += 8;

      const tableData = sortedCandidates.map((candidate, idx) => {
        const percentage = totalVotes > 0 ? ((candidate._count.votes / totalVotes) * 100).toFixed(2) : '0.00';
        return [
          (idx + 1).toString(),
          candidate.name,
          candidate._count.votes.toString(),
          `${percentage}%`,
          idx === 0 && candidate._count.votes > 0 ? 'WINNER' : '',
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Rank', 'Candidate', 'Votes', 'Percentage', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [r, g, b], textColor: 255, fontSize: 10, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 70 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30, fontStyle: 'bold' },
        },
        margin: { top: 20, bottom: 20 },
        didDrawPage: initPage,
      });

      yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 30;
    });

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generate PDF for voters list
 */
export async function generateVotersPDF(voters: Voter[], election: Election & { association: Association }): Promise<Buffer> {
  const doc = new jsPDF();
  const logoDataUri = await getBase64Image(election.association.logoUrl);
  const [r, g, b] = getThemeColor();
  const reportTitle = 'Voters List Report';
  
  const contentStartY = addHeader(doc, reportTitle, election.association, logoDataUri, true);
  const initializedPages = new Set<number>();

  const initPage = () => {
    const pageNumber = doc.getNumberOfPages();
    if (initializedPages.has(pageNumber)) return;
    initializedPages.add(pageNumber);
    
    if (pageNumber > 1) {
      addWatermark(doc, logoDataUri);
    }
    addFooter(doc, pageNumber);
  };

  addHeader(doc, reportTitle, election.association, logoDataUri, false);
  initializedPages.add(1);
  addFooter(doc, 1);

  let yPos = contentStartY;

  // Summary
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Election:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(election.title, 50, yPos);

  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Voters:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(voters.length.toString(), 50, yPos);

  yPos += 7;
  const votedCount = voters.filter(v => v.hasVoted).length;
  doc.setFont('helvetica', 'bold');
  doc.text('Voted:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${votedCount} (${voters.length > 0 ? ((votedCount / voters.length) * 100).toFixed(1) : 0}%)`, 50, yPos);

  yPos += 12;

  const tableData = voters.map((voter, idx) => [
    (idx + 1).toString(),
    voter.studentId,
    `${voter.first_name} ${voter.last_name}`,
    voter.email,
    voter.level,
    voter.hasVoted ? 'Yes' : 'No',
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Student ID', 'Name', 'Email', 'Level', 'Voted']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [r, g, b], textColor: 255, fontSize: 9, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 25 },
      2: { cellWidth: 45 },
      3: { cellWidth: 55 },
      4: { cellWidth: 20 },
      5: { cellWidth: 15 },
    },
    margin: { top: 20, bottom: 20 },
    didDrawPage: initPage,
  });

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generate PDF for candidates
 */
export async function generateCandidatesPDF(election: ElectionWithData): Promise<Buffer> {
  const doc = new jsPDF();
  const logoDataUri = await getBase64Image(election.association.logoUrl);
  const [r, g, b] = getThemeColor();
  const reportTitle = 'Candidates Report';
  
  const contentStartY = addHeader(doc, reportTitle, election.association, logoDataUri, true);
  const initializedPages = new Set<number>();

  const initPage = () => {
    const pageNumber = doc.getNumberOfPages();
    if (initializedPages.has(pageNumber)) return;
    initializedPages.add(pageNumber);
    
    addFooter(doc, pageNumber);
  };

  // Patch addPage to inject watermark UNDER the tables on new pages
  const originalAddPage = doc.addPage.bind(doc);
  doc.addPage = function (...args: any[]) {
    originalAddPage(...args);
    if (logoDataUri) {
      addWatermark(doc, logoDataUri);
    }
    return this;
  };

  addHeader(doc, reportTitle, election.association, logoDataUri, false);
  initializedPages.add(1);
  addFooter(doc, 1);

  let yPos = contentStartY;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Election:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(election.title, 50, yPos);

  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Candidates:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(election.candidates.length.toString(), 50, yPos);

  yPos += 12;

  const candidates = [...election.candidates].sort((a, b) => {
    // 1. Position Order
    if (a.position.order !== b.position.order) {
      return a.position.order - b.position.order;
    }
    // 2. Registration Date (first to last)
    const timeA = a.formResponse?.createdAt ? new Date(a.formResponse.createdAt).getTime() : new Date(a.createdAt).getTime();
    const timeB = b.formResponse?.createdAt ? new Date(b.formResponse.createdAt).getTime() : new Date(b.createdAt).getTime();
    return timeA - timeB;
  });

  const tableData = candidates.map((candidate, idx) => [
    (idx + 1).toString(),
    candidate.name,
    candidate.formResponse?.level ? `${candidate.formResponse.level} Level` : 'N/A',
    candidate.position.name,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Candidate Name', 'Level', 'Position']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [r, g, b], textColor: 255, fontSize: 10, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 9, cellPadding: 4, fillColor: [255, 255, 255] },
    rowPageBreak: 'avoid',
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 65 },
      2: { cellWidth: 35 },
      3: { cellWidth: 55 },
    },
    margin: { top: 20, bottom: 20 },
    didDrawPage: initPage,
  });

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generate Blank Screening Sheet PDF
 */
export async function generateBlankScreeningSheetPDF(election: any): Promise<Buffer> {
  const doc = new jsPDF({ orientation: 'landscape' });
  const logoDataUri = await getBase64Image(election.association.logoUrl);
  const [r, g, b] = getThemeColor();
  const reportTitle = 'Blank Screening Score Sheet';
  
  // Patch addPage to inject watermark UNDER the tables on new pages
  const originalAddPage = doc.addPage.bind(doc);
  doc.addPage = function (...args: any[]) {
    originalAddPage(...args);
    if (logoDataUri) {
      addWatermark(doc, logoDataUri);
    }
    return this;
  };

  const contentStartY = addHeader(doc, reportTitle, election.association, logoDataUri, true, false);
  const initializedPages = new Set<number>();

  const initPage = () => {
    const pageNumber = doc.getNumberOfPages();
    if (initializedPages.has(pageNumber)) return;
    initializedPages.add(pageNumber);
    addFooter(doc, pageNumber);
  };

  addHeader(doc, reportTitle, election.association, logoDataUri, false, false);
  initializedPages.add(1);
  addFooter(doc, 1);
  if (logoDataUri) {
    addWatermark(doc, logoDataUri);
  }

  let yPos = contentStartY + 5;
  
  const criteria = election.screeningCriteria || [];
  const headRow = ['Candidate', ...criteria.map((c: any) => `${c.name}\n(${c.weight}%)`), 'Total Score'];
  
  // Group candidates by position
  const candidates = election.candidates || [];
  const positionMap = new Map<string, typeof candidates>();
  candidates.forEach((candidate: any) => {
    const posId = candidate.position.id;
    if (!positionMap.has(posId)) positionMap.set(posId, []);
    positionMap.get(posId)!.push(candidate);
  });

  // Calculate dynamic column widths based on landscape A4 (297mm)
  const usableWidth = doc.internal.pageSize.width - 28;
  const candidateColWidth = 45;
  const totalColWidth = 25;
  const remainingWidth = usableWidth - candidateColWidth - totalColWidth;
  const criteriaColWidth = criteria.length > 0 ? remainingWidth / criteria.length : 0;

  const colStyles: Record<number, any> = {
    0: { cellWidth: candidateColWidth },
  };
  
  criteria.forEach((_: any, idx: number) => {
    colStyles[idx + 1] = { cellWidth: criteriaColWidth, halign: 'center' };
  });
  colStyles[criteria.length + 1] = { cellWidth: totalColWidth, halign: 'center' };

  const allTableData: any[][] = [];
  
  Array.from(positionMap.entries())
    .sort(([, a], [, b]) => b[0].position.order - a[0].position.order)
    .forEach(([, posCandidates]) => {
      const positionName = posCandidates[0].position.name;
      posCandidates.forEach((candidate: any) => {
        allTableData.push([
          `${candidate.name}\n(${positionName})`,
          ...criteria.map(() => ''), // Blank columns for scores
          '' // Blank total
        ]);
      });
    });

  autoTable(doc, {
    startY: yPos,
    head: [headRow],
    body: allTableData,
    theme: 'grid',
    showHead: 'everyPage',
    headStyles: { fillColor: [212, 237, 218], textColor: [0, 0, 0], fontSize: 8, fontStyle: 'bold', halign: 'center', valign: 'middle' },
    styles: { fontSize: 8, cellPadding: 2, minCellHeight: 12, valign: 'middle', fillColor: [255, 255, 255] },
    columnStyles: colStyles,
    margin: { top: 20, bottom: 20, left: 14, right: 14 },
    didDrawPage: initPage,
  });

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generate Screening Results PDF
 */
export async function generateScreeningResultsPDF(election: any, results: any[]): Promise<Buffer> {
  const doc = new jsPDF();
  const logoDataUri = await getBase64Image(election.association.logoUrl);
  const [r, g, b] = getThemeColor();
  const reportTitle = 'Screening Results Report';
  
  const contentStartY = addHeader(doc, reportTitle, election.association, logoDataUri, true);
  const initializedPages = new Set<number>();

  const initPage = () => {
    const pageNumber = doc.getNumberOfPages();
    if (initializedPages.has(pageNumber)) return;
    initializedPages.add(pageNumber);
    if (pageNumber > 1) {
      addWatermark(doc, logoDataUri);
    }
    addFooter(doc, pageNumber);
  };

  addHeader(doc, reportTitle, election.association, logoDataUri, false);
  initializedPages.add(1);
  addFooter(doc, 1);

  let yPos = contentStartY;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Election:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(election.title, 50, yPos);

  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Cutoff Score:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  const cutoff = election.screeningSetting?.qualificationScore || 0;
  doc.text(`${cutoff}%`, 50, yPos);

  yPos += 12;

  const tableData = results.map((r, idx) => [
    (idx + 1).toString(),
    r.name,
    r.position,
    r.totalScore.toFixed(2),
    r.isQualified ? 'Qualified' : 'Not Qualified',
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Candidate', 'Position', 'Avg Score', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [r, g, b], textColor: 255, fontSize: 10, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 9, cellPadding: 4 },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 4) {
        if (data.cell.raw === 'Qualified') {
          data.cell.styles.textColor = [19, 140, 1];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { top: 20, bottom: 20 },
    didDrawPage: initPage,
  });

  return Buffer.from(doc.output('arraybuffer'));
}
