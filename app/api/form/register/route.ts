import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateFormReceiptPDF } from '@/lib/form-receipt-pdf';
import { generateCandidateReceiptEmail } from '@/lib/email/templates';
import { brevoEmailService } from '@/lib/email/brevo-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, matricNumber, level, positionId } = body;

    // Validate all required fields
    if (!firstName || !lastName || !email || !phone || !matricNumber || !level || !positionId) {
      return NextResponse.json(
        { status: 'fail', message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { status: 'fail', message: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate level
    const validLevels = ['100', '200', '300', '400', '500'];
    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { status: 'fail', message: 'Invalid level' },
        { status: 400 }
      );
    }

    // Get the single association (with description + logo)
    const association = await prisma.association.findFirst({
      select: { id: true, name: true, description: true, logoUrl: true },
    });

    if (!association) {
      return NextResponse.json(
        { status: 'fail', message: 'Association not found' },
        { status: 404 }
      );
    }

    // Get the most recent election
    const election = await prisma.election.findFirst({
      where: { associationId: association.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true },
    });

    if (!election) {
      return NextResponse.json(
        { status: 'fail', message: 'No election found' },
        { status: 404 }
      );
    }

    // Verify position belongs to this association
    const position = await prisma.position.findFirst({
      where: { id: positionId, associationId: association.id },
      select: { id: true, name: true },
    });

    if (!position) {
      return NextResponse.json(
        { status: 'fail', message: 'Invalid position selected' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Save response
    const formResponse = await prisma.candidateFormResponse.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        matricNumber: matricNumber.trim(),
        level,
        positionId,
        electionId: election.id,
        associationId: association.id,
      },
    });

    // Generate PDF receipt
    const pdfBuffer = await generateFormReceiptPDF({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      matricNumber: matricNumber.trim(),
      level,
      positionName: position.name,
      electionTitle: election.title,
      associationName: association.name,
      associationDescription: association.description ?? undefined,
      logoUrl: association.logoUrl ?? undefined,
      submittedAt: now,
    });

    const pdfBase64 = pdfBuffer.toString('base64');

    // Build email
    const emailTemplate = generateCandidateReceiptEmail({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      matricNumber: matricNumber.trim(),
      level,
      positionName: position.name,
      electionTitle: election.title,
      associationName: association.name,
      associationDescription: association.description ?? undefined,
      submittedAt: now,
      logoUrl: association.logoUrl,
    });

    // Send email with PDF attachment
    await brevoEmailService.sendEmail({
      to: [{ email: email.trim().toLowerCase(), name: `${firstName} ${lastName}` }],
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

    // Mark receipt sent
    await prisma.candidateFormResponse.update({
      where: { id: formResponse.id },
      data: { receiptSentAt: now },
    });

    return NextResponse.json({
      status: 'success',
      message: 'Registration submitted successfully',
    });
  } catch (error: any) {
    console.error('Form registration error:', error);
    return NextResponse.json(
      { status: 'fail', message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
