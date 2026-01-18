import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { brevoEmailService } from '@/lib/email/brevo-service';
import { generateVoterCredentialsEmail } from '@/lib/email/templates';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.user.id },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const body = await request.json();
    const { voterIds } = body;

    if (!voterIds || !Array.isArray(voterIds) || voterIds.length === 0) {
      return NextResponse.json(
        { error: 'Voter IDs are required' },
        { status: 400 }
      );
    }

    // Fetch voters
    const voters = await prisma.voter.findMany({
      where: {
        id: { in: voterIds },
        associationId: admin.associationId, // Ensure admin can only send to their association's voters
      },
    });

    if (voters.length === 0) {
      return NextResponse.json({ error: 'No voters found' }, { status: 404 });
    }

    // Get the login URL (adjust based on your app structure)
    const loginUrl = `${process.env.NEXTAUTH_URL}/voter/login`;

    // Prepare emails
    const emails = voters.map((voter) => {
      const template = generateVoterCredentialsEmail({
        firstName: voter.first_name,
        lastName: voter.last_name,
        email: voter.email,
        studentId: voter.studentId,
        password: voter.password,
        loginUrl,
      });

      return {
        to: [{ email: voter.email, name: `${voter.first_name} ${voter.last_name}` }],
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
      };
    });

    // Send emails
    const result = await brevoEmailService.sendBulkEmails(emails);

    return NextResponse.json({
      message: `Sent credentials to ${result.successful} out of ${result.total} voters`,
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      keyUsageStats: brevoEmailService.getKeyUsageStats(),
    });
  } catch (error: any) {
    console.error('Error sending credentials:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send credentials' },
      { status: 500 }
    );
  }
}
