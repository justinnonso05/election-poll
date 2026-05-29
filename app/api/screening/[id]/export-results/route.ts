import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateScreeningResultsPDF } from '@/lib/pdf-generator';
import { getComputedResults } from '@/app/actions/screening-actions';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'SUPERADMIN') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const election = await prisma.election.findUnique({
    where: { id: params.id },
    include: {
      association: true,
      screeningSetting: true
    }
  });

  if (!election) {
    return new NextResponse('Election not found', { status: 404 });
  }

  try {
    const results = await getComputedResults(election.id);
    const pdfBuffer = await generateScreeningResultsPDF(election, results);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="screening-results-${election.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating screening results PDF:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
