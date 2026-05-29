import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateBlankScreeningSheetPDF } from '@/lib/pdf-generator';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'SUPERADMIN') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const election = await prisma.election.findUnique({
    where: { id: params.id },
    include: {
      association: true,
      screeningCriteria: {
        orderBy: { createdAt: 'asc' }
      },
      candidates: {
        where: {
          NOT: {
            name: { contains: 'undecided', mode: 'insensitive' }
          }
        },
        include: {
          position: true
        },
        orderBy: [
          { position: { order: 'asc' } },
          { name: 'asc' }
        ]
      }
    }
  });

  if (!election) {
    return new NextResponse('Election not found', { status: 404 });
  }

  try {
    const pdfBuffer = await generateBlankScreeningSheetPDF(election);
    
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="screening-sheet-${election.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating blank screening sheet PDF:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
