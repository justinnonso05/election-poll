import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateVoterPassword } from '@/lib/utils/password';
import { success, fail } from '@/lib/apiREsponse';
import type { Voter } from '@prisma/client';

interface UploadResults {
  success: Voter[];
  failed: Array<{ row: Record<string, unknown>; error: string }>;
  total: number;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return fail('Unauthorized', null, 401);
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.user.id },
    select: { associationId: true },
  });

  if (!admin) {
    return fail('Admin not found', null, 404);
  }

  const { voters } = await req.json();

  const results: UploadResults = {
    success: [],
    failed: [],
    total: voters.length,
  };

  // Step 1: Validate and clean data
  const validRows: any[] = [];
  for (const voterData of voters) {
    const cleanedData = {
      first_name: String(voterData.first_name || '').trim(),
      last_name: String(voterData.last_name || '').trim(),
      email: String(voterData.email || '')
        .trim()
        .toLowerCase(),
      level: String(voterData.level || '').trim(),
      studentId: String(voterData.studentId || '').trim(),
    };

    // Validate required fields
    if (
      !cleanedData.first_name ||
      !cleanedData.last_name ||
      !cleanedData.email ||
      !cleanedData.level ||
      !cleanedData.studentId
    ) {
      results.failed.push({
        row: voterData,
        error: 'Missing required fields',
      });
      continue;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanedData.email)) {
      results.failed.push({
        row: voterData,
        error: 'Invalid email format',
      });
      continue;
    }

    validRows.push(cleanedData);
  }

  // Step 2: Check for duplicates in DB
  if (validRows.length > 0) {
    const emails = validRows.map((v) => v.email);
    const studentIds = validRows.map((v) => v.studentId);

    const existingVoters = await prisma.voter.findMany({
      where: {
        associationId: admin.associationId,
        OR: [{ email: { in: emails } }, { studentId: { in: studentIds } }],
      },
      select: { email: true, studentId: true },
    });

    const existingEmails = new Set(existingVoters.map((v) => v.email));
    const existingStudentIds = new Set(existingVoters.map((v) => v.studentId));

    // Step 3: Filter out duplicates
    const rowsToInsert = [];
    for (const row of validRows) {
      if (existingEmails.has(row.email) || existingStudentIds.has(row.studentId)) {
        results.failed.push({
          row,
          error: 'Voter already exists with this email or student ID',
        });
      } else {
        rowsToInsert.push({
          ...row,
          password: generateVoterPassword(),
          associationId: admin.associationId,
        });
      }
    }

    // Step 4: Bulk insert
    if (rowsToInsert.length > 0) {
      await prisma.voter.createMany({
        data: rowsToInsert,
        skipDuplicates: true,
      });

      // Step 5: Fetch inserted voters for success array
      const insertedVoters = await prisma.voter.findMany({
        where: {
          associationId: admin.associationId,
          email: { in: rowsToInsert.map((v) => v.email) },
        },
      });

      results.success = insertedVoters;
    }
  }

  return success('Bulk upload completed', results);
}
