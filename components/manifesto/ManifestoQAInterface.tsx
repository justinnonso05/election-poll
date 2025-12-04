'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CandidateManifestoCard } from './CandidateManifestoCard';
import { ManifestoQAChat } from './ManifestoQAChat';
import { FrequentlyAsked } from './FrequentlyAsked';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageSquare, HelpCircle, BookOpen } from 'lucide-react';

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
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  const groupedCandidates = candidates.reduce((acc, candidate) => {
    const position = candidate.position;
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(candidate);
    return acc;
  }, {} as Record<string, Candidate[]>);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs defaultValue="manifestos" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="manifestos" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Manifestos</span>
            <span className="xs:hidden">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="qa" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
            <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Ask Questions</span>
            <span className="xs:hidden">Q&A</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
            <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>FAQ</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manifestos" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {Object.entries(groupedCandidates).map(([position, positionCandidates]) => (
            <Card key={position}>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="truncate">{position}</span>
                  <span className="text-xs sm:text-sm font-normal text-muted-foreground whitespace-nowrap">
                    ({positionCandidates.length} candidate{positionCandidates.length !== 1 ? 's' : ''})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-2">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {positionCandidates.map((candidate) => (
                    <CandidateManifestoCard
                      key={candidate.id}
                      candidate={candidate}
                      isSelected={selectedCandidates.includes(candidate.id)}
                      onSelectionChange={(selected) => {
                        setSelectedCandidates(prev => 
                          selected 
                            ? [...prev, candidate.id]
                            : prev.filter(id => id !== candidate.id)
                        );
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="qa" className="mt-4 sm:mt-6">
          <ManifestoQAChat 
            electionId={electionId}
            candidates={candidates}
            selectedCandidates={selectedCandidates}
            onCandidateSelect={setSelectedCandidates}
          />
        </TabsContent>

        <TabsContent value="faq" className="mt-4 sm:mt-6">
          <FrequentlyAsked 
            electionId={electionId}
            candidates={candidates}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}