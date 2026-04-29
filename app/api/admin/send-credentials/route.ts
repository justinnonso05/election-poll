import { success, fail } from '@/lib/apiREsponse';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { brevoEmailService } from '@/lib/email/brevo-service';
import { generateAdminCredentialsEmail } from '@/lib/email/templates';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return fail('Unauthorized', null, 401);
    }

    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
      return fail('Missing required fields', null, 400);
    }

    // Fetch association details for the email template
    const association = await prisma.association.findUnique({
      where: { id: session.user.associationId },
      select: { name: true, logoUrl: true }
    });

    const baseUrl = process.env.FRONTEND_BASE_URL || process.env.NEXTAUTH_URL || 'https://nacospoll.vercel.app';
    const loginUrl = `${baseUrl}/admin/login`;

    const emailContent = generateAdminCredentialsEmail({
      email,
      password,
      role,
      loginUrl,
      associationName: association?.name,
      logoUrl: association?.logoUrl,
    });

    const result = await brevoEmailService.sendEmail({
      to: [{ email, name: role }],
      subject: emailContent.subject,
      htmlContent: emailContent.htmlContent,
      textContent: emailContent.textContent,
    });

    if (!result.success) {
      return fail(result.error || 'Failed to send email', null, 500);
    }

    return success('Email sent successfully', null, 200);
  } catch (error) {
    console.error('Error sending credentials email:', error);
    return fail('Failed to send email', null, 500);
  }
}
