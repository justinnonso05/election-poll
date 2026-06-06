const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const votes = await prisma.vote.findMany({
    include: {
      candidate: {
        include: {
          position: true
        }
      }
    }
  });

  const voterPositionMap = {};
  const duplicates = [];

  for (const vote of votes) {
    const key = `${vote.voterId}-${vote.candidate.positionId}`;
    if (!voterPositionMap[key]) {
      voterPositionMap[key] = [];
    }
    voterPositionMap[key].push(vote);
    if (voterPositionMap[key].length > 1) {
      duplicates.push(voterPositionMap[key]);
    }
  }

  if (duplicates.length > 0) {
    console.log(`Found ${duplicates.length} instances of voters voting multiple times for the same position.`);
    console.log(JSON.stringify(duplicates, null, 2));
    
    // Let's delete the newer duplicates (keep the first vote)
    for (const group of duplicates) {
      // Sort by createdAt ascending
      group.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      // Delete all but the first one
      for (let i = 1; i < group.length; i++) {
        console.log(`Deleting duplicate vote ${group[i].id} for candidate ${group[i].candidateId}`);
        await prisma.vote.delete({ where: { id: group[i].id } });
      }
    }
    console.log('Duplicates deleted successfully.');
  } else {
    console.log('No duplicates found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
