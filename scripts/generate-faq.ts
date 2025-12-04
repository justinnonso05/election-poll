import { PrismaClient } from '@prisma/client';
import { askAboutManifestos } from '../lib/ai/manifesto-ai';

const prisma = new PrismaClient();

const FREQUENT_QUESTIONS = [
  "What are the candidates' positions on student housing and accommodation?",
  "How do candidates plan to improve campus facilities and infrastructure?",
  "What are their proposals for student financial support and scholarships?",
  "How will they enhance student mental health and wellbeing services?",
  "What are their plans for improving academic support and library services?",
  "How do they plan to increase student engagement and campus activities?",
  "What are their positions on student transportation and parking?",
  "How will they improve communication between students and administration?",
  "What are their plans for sustainability and environmental initiatives?",
  "How will they support international students and diversity initiatives?",
];

async function generateFAQForElection(electionId: string) {
  console.log(`🚀 Starting FAQ generation for election: ${electionId}`);
  
  // Check if FAQ already exists
  const existingFAQ = await prisma.frequentlyAskedQuestion.findFirst({
    where: { electionId },
  });

  if (existingFAQ) {
    console.log(`⚠️  FAQ already exists for election ${electionId}. Use --force to regenerate.`);
    return;
  }

  let generatedCount = 0;

  for (const question of FREQUENT_QUESTIONS) {
    try {
      console.log(`📝 Processing: ${question.substring(0, 50)}...`);
      
      const result = await askAboutManifestos(electionId, question);
      
      if (result.answer && result.answer.length > 50) {
        await prisma.frequentlyAskedQuestion.create({
          data: {
            electionId,
            question,
            answer: result.answer,
            sources: JSON.parse(JSON.stringify(result.sources)), // Convert to plain JSON
          },
        });
        generatedCount++;
        console.log(`✅ Generated FAQ ${generatedCount}/${FREQUENT_QUESTIONS.length}`);
      }

      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (questionError) {
      console.error(`❌ Error processing question: ${question}`, questionError);
    }
  }

  console.log(`🎉 FAQ generation completed: ${generatedCount} questions processed`);
}

async function generateFAQForAllActiveElections(force = false) {
  try {
    // Get all active elections with manifestos
    const elections = await prisma.election.findMany({
      where: { 
        isActive: true,
        candidates: {
          some: {
            OR: [
              { manifestoText: { not: null } },
              { manifestoSummary: { not: null } }
            ]
          }
        }
      },
      include: {
        candidates: {
          where: {
            OR: [
              { manifestoText: { not: null } },
              { manifestoSummary: { not: null } }
            ]
          }
        }
      }
    });

    if (elections.length === 0) {
      console.log('❌ No active elections with manifestos found');
      return;
    }

    for (const election of elections) {
      if (force) {
        // Delete existing FAQ if force flag is used
        await prisma.frequentlyAskedQuestion.deleteMany({
          where: { electionId: election.id }
        });
      }

      await generateFAQForElection(election.id);
    }

  } catch (error) {
    console.error('❌ Error generating FAQ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const electionId = args.find(arg => arg.startsWith('--election='))?.split('=')[1];
  const force = args.includes('--force');

  if (electionId) {
    if (force) {
      // Delete existing FAQ if force flag is used
      await prisma.frequentlyAskedQuestion.deleteMany({
        where: { electionId }
      });
    }
    await generateFAQForElection(electionId);
  } else {
    await generateFAQForAllActiveElections(force);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { generateFAQForElection, generateFAQForAllActiveElections };