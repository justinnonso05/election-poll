'use server';

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

export async function getActiveElection() {
  return await prisma.election.findFirst({
    where: { isActive: true },
    include: {
      screeningSetting: true,
      screeningCriteria: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });
}

export async function addCriteria(electionId: string, name: string, weight: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPERADMIN') throw new Error('Unauthorized');

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    include: { screeningCriteria: true }
  });
  
  if (!election) throw new Error('Election not found');

  const totalWeight = election.screeningCriteria.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight + weight > 100) {
    throw new Error('Total weight cannot exceed 100%');
  }

  await prisma.screeningCriteria.create({
    data: {
      electionId,
      name,
      weight
    }
  });

  revalidatePath('/admin/dashboard/screening');
}

export async function removeCriteria(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPERADMIN') throw new Error('Unauthorized');

  await prisma.screeningCriteria.delete({
    where: { id }
  });

  revalidatePath('/admin/dashboard/screening');
}

export async function setQualificationScore(electionId: string, score: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPERADMIN') throw new Error('Unauthorized');

  await prisma.screeningSetting.upsert({
    where: { electionId },
    update: { qualificationScore: score },
    create: { electionId, qualificationScore: score }
  });

  revalidatePath('/admin/dashboard/screening');
}

export async function submitScores(candidateId: string, scores: Record<string, number>) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('Unauthorized');

  const adminId = session.user.id;

  for (const [criteriaId, score] of Object.entries(scores)) {
    // Validate score vs weight
    const criteria = await prisma.screeningCriteria.findUnique({ where: { id: criteriaId } });
    if (!criteria) continue;
    if (score < 0 || score > criteria.weight) {
      throw new Error(`Score for ${criteria.name} exceeds max weight of ${criteria.weight}`);
    }

    await prisma.screeningScore.upsert({
      where: {
        candidateId_adminId_criteriaId: {
          candidateId,
          adminId,
          criteriaId
        }
      },
      update: { score },
      create: {
        candidateId,
        adminId,
        criteriaId,
        score
      }
    });
  }

  revalidatePath('/admin/dashboard/screening');
}

export async function getComputedResults(electionId: string) {
  const election = await prisma.election.findUnique({
    where: { id: electionId },
    include: {
      candidates: {
        where: {
          NOT: {
            name: { contains: 'undecided', mode: 'insensitive' }
          }
        },
        include: {
          position: true,
          screeningScores: true
        }
      },
      screeningSetting: true,
      association: true
    }
  });

  if (!election) throw new Error('Election not found');

  const adminsCount = await prisma.admin.count({
    where: { associationId: election.associationId }
  });

  if (adminsCount === 0) return [];

  const results = election.candidates.map(candidate => {
    // Group scores by criteria
    const criteriaScores = candidate.screeningScores.reduce((acc, curr) => {
      if (!acc[curr.criteriaId]) acc[curr.criteriaId] = [];
      acc[curr.criteriaId].push(curr.score);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate total average score
    let totalScore = 0;
    Object.values(criteriaScores).forEach(scoresArray => {
      // average score for this criteria across all admins who scored
      const sum = scoresArray.reduce((a, b) => a + b, 0);
      // Wait, should we divide by total admins or just admins who scored? 
      // Usually divide by total admins to avoid missing scores inflating averages, 
      // but let's divide by admins who actually scored this criteria or total admins?
      // "find the average score across all admins". Usually means total admins in the association.
      totalScore += sum / adminsCount; 
    });

    const isQualified = election.screeningSetting 
      ? totalScore >= election.screeningSetting.qualificationScore
      : false;

    return {
      candidateId: candidate.id,
      name: candidate.name,
      position: candidate.position.name,
      totalScore: Number(totalScore.toFixed(2)),
      isQualified,
      scoresCount: candidate.screeningScores.length
    };
  });

  return results.sort((a, b) => b.totalScore - a.totalScore);
}
