'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, MessageSquare } from 'lucide-react';
import { CandidateManifestoCard } from './CandidateManifestoCard';
import { ManifestoQAChat } from './ManifestoQAChat';

interface Candidate {
  id: string;
  name: string;
  position: string;
  positionId: string;
  manifestoSummary: string | null;
  manifestoUrl: string | null;
  photoUrl: string | null;
}

interface ManifestoQAInterfaceProps {
  electionId: string;
  candidates: Candidate[];
}

export function ManifestoQAInterface({ electionId, candidates }: ManifestoQAInterfaceProps) {
  const groupedCandidates = candidates.reduce((acc, candidate) => {
    const position = candidate.position;
    if (!acc[position]) acc[position] = [];
    acc[position].push(candidate);
    return acc;
  }, {} as Record<string, Candidate[]>);

  return (
    <div className="w-full">
      <Tabs defaultValue="summaries" className="w-full">
        <TabsList className="h-10 p-1 mb-6 w-fit">
          <TabsTrigger value="summaries" className="flex items-center gap-2 px-4 text-sm">
            <BookOpen className="w-3.5 h-3.5" />
            Manifestos
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2 px-4 text-sm">
            <MessageSquare className="w-3.5 h-3.5" />
            Ask AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summaries">
          <div className="space-y-10">
            {Object.entries(groupedCandidates).map(([position, positionCandidates]) => (
              <div key={position}>
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-foreground">{position}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {positionCandidates.length} candidate{positionCandidates.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {positionCandidates.map((candidate) => (
                    <CandidateManifestoCard key={candidate.id} candidate={candidate} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <ManifestoQAChat electionId={electionId} candidates={candidates} />
        </TabsContent>
      </Tabs>
    </div>
  );
}