import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { brevoEmailService } from '@/lib/email/brevo-service';
import { generateVoterCredentialsEmail } from '@/lib/email/templates';

// Helper to format data for the stream
function encodeChunk(data: any) {
  return new TextEncoder().encode(JSON.stringify(data) + '\n');
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication & Validation (Same as before)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.user.id },
      include: { association: true },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const election = await prisma.election.findFirst({
      where: { associationId: admin.associationId },
      orderBy: { createdAt: 'desc' },
    });

    const body = await request.json();
    const { voterIds } = body;

    if (!voterIds || !Array.isArray(voterIds) || voterIds.length === 0) {
      return NextResponse.json({ error: 'Voter IDs are required' }, { status: 400 });
    }

    const voters = await prisma.voter.findMany({
      where: {
        id: { in: voterIds },
        associationId: admin.associationId,
      },
    });

    if (voters.length === 0) {
      return NextResponse.json({ error: 'No voters found' }, { status: 404 });
    }

    // Default to platform base URL, but template uses hardcoded naosspoll.vercel.app as requested
    const loginUrl = `${process.env.NEXTAUTH_URL}/voter/login`;

    // 2. Setup Streaming Response
    const stream = new ReadableStream({
      async start(controller) {
        let successCount = 0;
        let failedCount = 0;

        try {
          for (const [index, voter] of voters.entries()) {
            // Send pending status
            controller.enqueue(encodeChunk({
              type: 'progress',
              status: 'pending',
              message: `[${index + 1}/${voters.length}] Preparing email for ${voter.first_name} (${voter.email})...`,
            }));

            try {
              const template = generateVoterCredentialsEmail({
                firstName: voter.first_name,
                lastName: voter.last_name,
                email: voter.email,
                studentId: voter.studentId,
                password: voter.password,
                loginUrl,
                // Add new fields
                logoUrl: admin.association.logoUrl,
                associationName: admin.association.name,
                startDate: election?.startAt,
                endDate: election?.endAt,
              });

              const emailData = {
                to: [{ email: voter.email, name: `${voter.first_name} ${voter.last_name}` }],
                subject: template.subject,
                htmlContent: template.htmlContent,
                textContent: template.textContent,
              };

              // Send using your existing service (handles key rotation)
              const result = await brevoEmailService.sendEmail(emailData);

              if (result.success) {
                successCount++;
                controller.enqueue(encodeChunk({
                  type: 'progress',
                  status: 'success',
                  message: `[${index + 1}/${voters.length}] Sent successfully to ${voter.email}`,
                }));
              } else {
                failedCount++;
                controller.enqueue(encodeChunk({
                  type: 'progress',
                  status: 'error',
                  message: `[${index + 1}/${voters.length}] Failed: ${voter.email} - ${result.error}`,
                }));
              }
            } catch (err: any) {
              failedCount++;
              controller.enqueue(encodeChunk({
                type: 'progress',
                status: 'error',
                message: `[${index + 1}/${voters.length}] Error processing ${voter.email}: ${err.message}`,
              }));
            }

            // Tiny delay to be safe, matching your original "bulk" logic
            await new Promise(r => setTimeout(r, 100)); // 100ms
          }

          // Final summary
          controller.enqueue(encodeChunk({
            type: 'summary',
            total: voters.length,
            successful: successCount,
            failed: failedCount,
          }));

        } catch (error: any) {
          controller.enqueue(encodeChunk({
            type: 'error',
            message: error.message || 'Critical error in email process',
          }));
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked'
      },
    });

  } catch (error: any) {
    console.error('Error sending credentials:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send credentials' },
      { status: 500 }
    );
  }
}
