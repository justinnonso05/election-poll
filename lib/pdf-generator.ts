import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Election, Candidate, Position, Vote, Voter } from '@prisma/client';
import { formatDateLong } from './timezone';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}

type ElectionWithData = Election & {
  association: { name: string };
  candidates: (Candidate & {
    position: Position;
    _count: { votes: number };
  })[];
  votes: (Vote & {
    voter: Voter;
    candidate: Candidate & { position: Position };
  })[];
};

/**
 * Add header to PDF
 */
function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);

  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(subtitle, 14, 28);
    doc.setTextColor(0);
  }
}

/**
 * Add footer to PDF
 */
function addFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setTextColor(128);
  doc.text(
    `Page ${pageNumber} of ${totalPages}`,
    doc.internal.pageSize.width / 2,
    pageHeight - 10,
    { align: 'center' }
  );
  doc.text(
    `Generated on ${formatDateLong(new Date())}`,
    14,
    pageHeight - 10
  );
  doc.setTextColor(0);
}

/**
 * Generate PDF for election results
 */
export async function generateResultsPDF(election: ElectionWithData): Promise<Buffer> {
  const doc = new jsPDF();

  // Header
  addHeader(doc, 'Election Results Report', election.association.name);

  // Election Info
  doc.setFontSize(11);
  let yPos = 38;

  doc.setFont('helvetica', 'bold');
  doc.text('Election:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(election.title, 50, yPos);

  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Period:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${formatDateLong(election.startAt)} - ${formatDateLong(election.endAt)}`,
    50,
    yPos
  );

  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Votes:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(election.votes.length.toString(), 50, yPos);

  yPos += 12;

  // Group candidates by position
  const positionMap = new Map<string, typeof election.candidates>();
  election.candidates.forEach(candidate => {
    const positionId = candidate.position.id;
    if (!positionMap.has(positionId)) {
      positionMap.set(positionId, []);
    }
    positionMap.get(positionId)!.push(candidate);
  });

  // Results by position
  Array.from(positionMap.entries())
    .sort(([, a], [, b]) => a[0].position.order - b[0].position.order)
    .forEach(([, candidates], index) => {
      const position = candidates[0].position;
      const totalVotes = candidates.reduce((sum, c) => sum + c._count.votes, 0);

      // Sort candidates by votes (descending)
      const sortedCandidates = [...candidates].sort((a, b) => b._count.votes - a._count.votes);

      // Position header
      if (index > 0 && yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(position.name, 14, yPos);
      yPos += 8;

      // Table data
      const tableData = sortedCandidates.map((candidate, idx) => {
        const percentage = totalVotes > 0
          ? ((candidate._count.votes / totalVotes) * 100).toFixed(2)
          : '0.00';

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
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202], fontSize: 10 },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 70 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30, fontStyle: 'bold' },
        },
      });

      yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 50;
    });

  // Add footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generate PDF for voters list
 */
export async function generateVotersPDF(voters: Voter[], election: Election): Promise<Buffer> {
  const doc = new jsPDF();

  // Header
  addHeader(doc, 'Voters List Report', election.title);

  // Summary
  doc.setFontSize(11);
  let yPos = 38;

  doc.setFont('helvetica', 'bold');
  doc.text('Total Voters:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(voters.length.toString(), 50, yPos);

  yPos += 7;
  const votedCount = voters.filter(v => v.hasVoted).length;
  doc.setFont('helvetica', 'bold');
  doc.text('Voted:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${votedCount} (${((votedCount / voters.length) * 100).toFixed(1)}%)`, 50, yPos);

  yPos += 12;

  // Table data
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
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 25 },
      2: { cellWidth: 45 },
      3: { cellWidth: 55 },
      4: { cellWidth: 20 },
      5: { cellWidth: 15 },
    },
  });

  // Add footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generate PDF for candidates
 */
export async function generateCandidatesPDF(election: ElectionWithData): Promise<Buffer> {
  const doc = new jsPDF();

  // Header
  addHeader(doc, 'Candidates Report', election.association.name);

  // Election Info
  doc.setFontSize(11);
  let yPos = 38;

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

  // Group by position
  const positionMap = new Map<string, typeof election.candidates>();
  election.candidates.forEach(candidate => {
    const positionId = candidate.position.id;
    if (!positionMap.has(positionId)) {
      positionMap.set(positionId, []);
    }
    positionMap.get(positionId)!.push(candidate);
  });

  // Candidates by position
  Array.from(positionMap.entries())
    .sort(([, a], [, b]) => a[0].position.order - b[0].position.order)
    .forEach(([, candidates], index) => {
      const position = candidates[0].position;

      if (index > 0 && yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(position.name, 14, yPos);
      yPos += 8;

      const tableData = candidates.map((candidate, idx) => [
        (idx + 1).toString(),
        candidate.name,
        candidate.manifesto ? 'Yes' : 'No',
        formatDateLong(candidate.createdAt),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Candidate Name', 'Has Manifesto', 'Registered']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202], fontSize: 10 },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 70 },
          2: { cellWidth: 35 },
          3: { cellWidth: 55 },
        },
      });

      yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 50;
    });

  // Add footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  return Buffer.from(doc.output('arraybuffer'));
}
