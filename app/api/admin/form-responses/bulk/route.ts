import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { success, fail } from '@/lib/apiREsponse';
import { generateFormReceiptPDF } from '@/lib/form-receipt-pdf';
import { generateCandidateReceiptEmail } from '@/lib/email/templates';
import { brevoEmailService } from '@/lib/email/brevo-service';

type BulkAction = 'send-receipts' | 'add-candidates' | 'delete';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return fail('Unauthorized', null, 401);

    const admin = await prisma.admin.findUnique({
      where: { id: session.user.id },
      include: { association: true },
    });
    if (!admin) return fail('Admin not found', null, 404);

    const body = await req.json();
    const { action, ids }: { action: BulkAction; ids: string[] } = body;

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return fail('action and ids[] are required', null, 400);
    }

    if (action === 'delete' && session.user.role !== 'SUPERADMIN') {
      return fail('Forbidden: only SUPERADMIN can delete responses', null, 403);
    }

    const responses = await prisma.candidateFormResponse.findMany({
      where: { id: { in: ids }, associationId: admin.associationId },
      include: {
        position: { select: { id: true, name: true } },
        election: { select: { id: true, title: true } },
      },
    });

    if (responses.length === 0) {
      return fail('No matching responses found', null, 404);
    }

    const results: { id: string; status: 'ok' | 'error'; message?: string }[] = [];

    // ── Delete ──────────────────────────────────────────────────────────────────
    if (action === 'delete') {
      await prisma.candidateFormResponse.deleteMany({
        where: { id: { in: responses.map((r) => r.id) } },
      });
      return success(`Deleted ${responses.length} responses`, null);
    }

    // ── Send Receipts ────────────────────────────────────────────────────────────
    if (action === 'send-receipts') {
      for (const r of responses) {
        try {
          const pdfBuffer = await generateFormReceiptPDF({
            firstName: r.firstName,
            lastName: r.lastName,
            email: r.email,
            phone: r.phone,
            matricNumber: r.matricNumber,
            level: r.level,
            positionName: r.position.name,
            electionTitle: r.election.title,
            associationName: admin.association.name,
            associationDescription: admin.association.description ?? undefined,
            logoUrl: admin.association.logoUrl ?? undefined,
            submittedAt: r.createdAt,
          });

          const emailTemplate = generateCandidateReceiptEmail({
            firstName: r.firstName,
            lastName: r.lastName,
            email: r.email,
            phone: r.phone,
            matricNumber: r.matricNumber,
            level: r.level,
            positionName: r.position.name,
            electionTitle: r.election.title,
            associationName: admin.association.name,
            associationDescription: admin.association.description ?? undefined,
            submittedAt: r.createdAt,
            logoUrl: admin.association.logoUrl,
          });

          const emailResult = await brevoEmailService.sendEmail({
            to: [{ email: r.email, name: `${r.firstName} ${r.lastName}` }],
            subject: emailTemplate.subject,
            htmlContent: emailTemplate.htmlContent,
            textContent: emailTemplate.textContent,
            attachments: [{ name: `electoral-form-receipt.pdf`, content: pdfBuffer.toString('base64') }],
          });

          if (emailResult.success) {
            await prisma.candidateFormResponse.update({
              where: { id: r.id },
              data: { receiptSentAt: new Date() },
            });
            results.push({ id: r.id, status: 'ok' });
          } else {
            results.push({ id: r.id, status: 'error', message: emailResult.error });
          }

          await new Promise((res) => setTimeout(res, 100));
        } catch (err: any) {
          results.push({ id: r.id, status: 'error', message: err.message });
        }
      }
      const succeeded = results.filter((r) => r.status === 'ok').length;
      return success(`Sent ${succeeded}/${responses.length} receipts`, results);
    }

    // ── Add Candidates ───────────────────────────────────────────────────────────
    if (action === 'add-candidates') {
      for (const r of responses) {
        try {
          if (r.addedAsCandidate) {
            results.push({ id: r.id, status: 'ok', message: 'already added' });
            continue;
          }
          const fullName = `${r.firstName} ${r.lastName}`;
          const existing = await prisma.candidate.findFirst({
            where: { name: fullName, electionId: r.electionId, positionId: r.positionId },
          });
          if (!existing) {
            await prisma.candidate.create({
              data: { name: fullName, electionId: r.electionId, positionId: r.positionId },
            });
          }
          await prisma.candidateFormResponse.update({
            where: { id: r.id },
            data: { addedAsCandidate: true },
          });
          results.push({ id: r.id, status: 'ok' });
        } catch (err: any) {
          results.push({ id: r.id, status: 'error', message: err.message });
        }
      }
      const succeeded = results.filter((r) => r.status === 'ok').length;
      return success(`Added ${succeeded}/${responses.length} candidates`, results);
    }

    return fail('Unknown action', null, 400);
  } catch (error) {
    console.error('Bulk action error:', error);
    return fail('Server error', null, 500);
  }
}
