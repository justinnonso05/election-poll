import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { generateResultsPDF, generateVotersPDF, generateCandidatesPDF } from '@/lib/pdf-generator';
import { generateResultsCSV, generateVotersCSV, generateCandidatesCSV } from '@/lib/csv-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: electionId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const format = searchParams.get('format') || 'csv';

    if (!type || !['results', 'voters', 'candidates'].includes(type)) {
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    if (!['csv', 'pdf'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    // Get the election with all necessary data
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        association: true,
        candidates: {
          include: {
            position: true,
            _count: {
              select: { votes: true },
            },
          },
          orderBy: {
            position: { order: 'asc' },
          },
        },
        votes: {
          include: {
            voter: true,
            candidate: {
              include: { position: true },
            },
          },
        },
      },
    });

    if (!election) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    }

    // Check if user has permission - use ID from session
    const admin = await prisma.admin.findFirst({
      where: {
        id: session.user.id,
        associationId: election.associationId,
      },
    });

    if (!admin) {
      console.error('Permission denied:', {
        userId: session.user.id,
        userEmail: session.user.email,
        electionAssociationId: election.associationId,
      });
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    // Generate export based on type and format
    if (format === 'pdf') {
      contentType = 'application/pdf';

      switch (type) {
        case 'results':
          buffer = await generateResultsPDF(election);
          filename = `${election.title}_Results.pdf`;
          break;
        case 'voters':
          const voters = await prisma.voter.findMany({
            where: { associationId: election.associationId },
            orderBy: { email: 'asc' },
          });
          buffer = await generateVotersPDF(voters, election);
          filename = `${election.title}_Voters.pdf`;
          break;
        case 'candidates':
          buffer = await generateCandidatesPDF(election);
          filename = `${election.title}_Candidates.pdf`;
          break;
        default:
          return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
      }
    } else {
      // CSV format
      contentType = 'text/csv';

      switch (type) {
        case 'results':
          buffer = Buffer.from(generateResultsCSV(election));
          filename = `${election.title}_Results.csv`;
          break;
        case 'voters':
          const voters = await prisma.voter.findMany({
            where: { associationId: election.associationId },
            orderBy: { email: 'asc' },
          });
          buffer = Buffer.from(generateVotersCSV(voters));
          filename = `${election.title}_Voters.csv`;
          break;
        case 'candidates':
          buffer = Buffer.from(generateCandidatesCSV(election));
          filename = `${election.title}_Candidates.csv`;
          break;
        default:
          return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
      }
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}
