import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting candidate-to-form-response backfill...');

  const candidates = await prisma.candidate.findMany({
    include: {
      position: true,
      election: true,
    },
  });

  const responses = await prisma.candidateFormResponse.findMany({
    where: {
      addedAsCandidate: true,
    },
  });

  console.log(`Found ${candidates.length} candidates and ${responses.length} approved form responses.`);

  let linkedCount = 0;

  // Track which responses are already matched/linked
  const matchedResponseIds = new Set<string>();

  // Step 1: Match by exact name + election + position
  for (const candidate of candidates) {
    const exactMatch = responses.find((r) => {
      const responseFullName = `${r.firstName} ${r.lastName}`.toLowerCase().trim();
      return (
        candidate.name.toLowerCase().trim() === responseFullName &&
        candidate.electionId === r.electionId &&
        candidate.positionId === r.positionId &&
        !matchedResponseIds.has(r.id)
      );
    });

    if (exactMatch) {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { formResponseId: exactMatch.id },
      });
      matchedResponseIds.add(exactMatch.id);
      linkedCount++;
      console.log(`✅ Exact match: Linked candidate "${candidate.name}" to form response for "${exactMatch.firstName} ${exactMatch.lastName}"`);
    }
  }

  // Step 2: For remaining candidates (e.g. edited ones), match by process-of-elimination
  // within the same election and position
  for (const candidate of candidates) {
    // Skip if already linked
    const current = await prisma.candidate.findUnique({
      where: { id: candidate.id },
      select: { formResponseId: true },
    });
    if (current?.formResponseId) continue;

    const remainingPositionResponses = responses.filter(
      (r) =>
        candidate.electionId === r.electionId &&
        candidate.positionId === r.positionId &&
        !matchedResponseIds.has(r.id)
    );

    // If there is exactly one unlinked response in this position, it's our match!
    if (remainingPositionResponses.length === 1) {
      const singleMatch = remainingPositionResponses[0];
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { formResponseId: singleMatch.id },
      });
      matchedResponseIds.add(singleMatch.id);
      linkedCount++;
      console.log(`ℹ️ Process of Elimination: Linked edited candidate "${candidate.name}" to remaining form response for "${singleMatch.firstName} ${singleMatch.lastName}"`);
    } else {
      console.log(`⚠️ Could not automatically link candidate "${candidate.name}" (Election: ${candidate.election.title}, Position: ${candidate.position.name})`);
    }
  }

  console.log(`\nBackfill complete! Successfully linked ${linkedCount}/${candidates.length} candidates.`);
}

main()
  .catch((e) => {
    console.error('Error during backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
