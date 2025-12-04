import { prisma } from '@/lib/prisma';
import { ManifestoQAInterface } from '@/components/manifesto/ManifestoQAInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, MessageSquare } from 'lucide-react';

async function getElectionData() {
  try {
    // Get the active election
    const election = await prisma.election.findFirst({
      where: { isActive: true },
      include: {
        candidates: {
          include: {
            position: true,
          },
          orderBy: [
            { position: { order: 'asc' } },
            { name: 'asc' }
          ]
        },
        association: {
          select: {
            name: true,
            logoUrl: true,
          }
        }
      }
    });

    if (!election) {
      return null;
    }

    // Filter candidates that have manifestos
    const candidatesWithManifestos = election.candidates.filter(
      candidate => candidate.manifestoSummary || candidate.manifesto
    );

    return {
      election: {
        id: election.id,
        title: election.title,
        description: election.description,
        association: election.association,
      },
      candidates: candidatesWithManifestos.map(candidate => ({
        id: candidate.id,
        name: candidate.name,
        position: candidate.position.name,
        positionId: candidate.position.id,
        manifestoSummary: candidate.manifestoSummary,
        manifestoUrl: candidate.manifesto,
        photoUrl: candidate.photoUrl,
      }))
    };
  } catch (error) {
    console.error('Error fetching election data:', error);
    return null;
  }
}

export default async function ManifestoPage() {
  const data = await getElectionData();

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-2 sm:p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold mb-2">No Active Election</h1>
            <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">
              There are no active elections with candidate manifestos available at this time.
            </p>
            <a
              href="/"
              className="inline-flex items-center px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base"
            >
              Go to Voting
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { election, candidates } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Minimal padding on mobile */}
      <div className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-1 sm:px-3 lg:px-8 py-2 sm:py-3 lg:py-6">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            {election.association.logoUrl && (
              <img
                src={election.association.logoUrl}
                alt={election.association.name}
                className="w-7 h-7 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-bold truncate">
                {election.association.name}
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground truncate">
                Candidate Manifestos & Q&A
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Minimal padding and gaps on mobile */}
      <div className="max-w-6xl mx-auto px-2 sm:px-3 lg:px-8 py-2 sm:py-3 lg:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-2 lg:gap-4 mb-3 sm:mb-4 lg:mb-8">
          <Card>
            <CardContent className="p-2 sm:p-3 lg:p-4 flex items-center gap-1 sm:gap-2 lg:gap-3">
              <div className="w-5 h-5 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Manifestos Available</p>
                <p className="text-sm sm:text-base lg:text-lg font-bold">{candidates.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-2 sm:p-3 lg:p-4 flex items-center gap-1 sm:gap-2 lg:gap-3">
              <div className="w-5 h-5 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Positions</p>
                <p className="text-sm sm:text-base lg:text-lg font-bold">
                  {new Set(candidates.map(c => c.positionId)).size}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardContent className="p-2 sm:p-3 lg:p-4 flex items-center gap-1 sm:gap-2 lg:gap-3">
              <div className="w-5 h-5 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Ask Questions</p>
                <p className="text-sm sm:text-base lg:text-lg font-bold">AI Powered</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Q&A Interface */}
        <ManifestoQAInterface 
          electionId={election.id}
          candidates={candidates}
        />
      </div>
    </div>
  );
}