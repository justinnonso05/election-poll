import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { success, fail } from '@/lib/apiREsponse';
import { generateFormReceiptPDF } from '@/lib/form-receipt-pdf';
import { generateCandidateReceiptEmail } from '@/lib/email/templates';
import { brevoEmailService } from '@/lib/email/brevo-service';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return fail('Unauthorized', null, 401);

    const admin = await prisma.admin.findUnique({
      where: { id: session.user.id },
      include: { association: true },
    });
    if (!admin) return fail('Admin not found', null, 404);

    const formResponse = await prisma.candidateFormResponse.findFirst({
      where: { id, associationId: admin.associationId },
      include: {
        position: { select: { name: true } },
        election: { select: { title: true } },
      },
    });
    if (!formResponse) return fail('Response not found', null, 404);

    const now = new Date();

    const pdfBuffer = await generateFormReceiptPDF({
      firstName: formResponse.firstName,
      lastName: formResponse.lastName,
      email: formResponse.email,
      phone: formResponse.phone,
      matricNumber: formResponse.matricNumber,
      level: formResponse.level,
      positionName: formResponse.position.name,
      electionTitle: formResponse.election.title,
      associationName: admin.association.name,
      associationDescription: admin.association.description ?? undefined,
      logoUrl: admin.association.logoUrl ?? undefined,
      submittedAt: formResponse.createdAt,
    });

    const pdfBase64 = pdfBuffer.toString('base64');

    const emailTemplate = generateCandidateReceiptEmail({
      firstName: formResponse.firstName,
      lastName: formResponse.lastName,
      email: formResponse.email,
      phone: formResponse.phone,
      matricNumber: formResponse.matricNumber,
      level: formResponse.level,
      positionName: formResponse.position.name,
      electionTitle: formResponse.election.title,
      associationName: admin.association.name,
      associationDescription: admin.association.description ?? undefined,
      submittedAt: formResponse.createdAt,
      logoUrl: admin.association.logoUrl,
    });

    const result = await brevoEmailService.sendEmail({
      to: [{ email: formResponse.email, name: `${formResponse.firstName} ${formResponse.lastName}` }],
      subject: emailTemplate.subject,
      htmlContent: emailTemplate.htmlContent,
      textContent: emailTemplate.textContent,
      attachments: [
        {
          name: `electoral-form-receipt.pdf`,
          content: pdfBase64,
        },
      ],
    });

    if (!result.success) {
      return fail(`Failed to send email: ${result.error}`, null, 500);
    }

    await prisma.candidateFormResponse.update({
      where: { id },
      data: { receiptSentAt: now },
    });

    return success('Receipt sent successfully', null);
  } catch (error) {
    console.error('Error sending receipt:', error);
    return fail('Server error', null, 500);
  }
}
