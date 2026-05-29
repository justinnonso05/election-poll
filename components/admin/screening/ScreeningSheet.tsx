'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { submitScores } from '@/app/actions/screening-actions';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

export default function ScreeningSheet({ election, adminId }: { election: any, adminId: string }) {
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<Record<string, Record<string, string>>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const candidates = election.candidates || [];
  const criteria = election.screeningCriteria || [];

  // Pre-fill existing scores if any
  useState(() => {
    const initialScores: Record<string, Record<string, string>> = {};
    candidates.forEach((candidate: any) => {
      initialScores[candidate.id] = {};
      candidate.screeningScores?.forEach((score: any) => {
        if (score.adminId === adminId) {
          initialScores[candidate.id][score.criteriaId] = score.score.toString();
        }
      });
    });
    setScores(initialScores);
  });

  const handleScoreChange = (candidateId: string, criteriaId: string, value: string) => {
    setScores(prev => ({
      ...prev,
      [candidateId]: {
        ...prev[candidateId],
        [criteriaId]: value
      }
    }));
  };

  const handleSave = async (candidateId: string) => {
    const candidateScores = scores[candidateId];
    if (!candidateScores) return;

    const parsedScores: Record<string, number> = {};
    for (const [critId, val] of Object.entries(candidateScores)) {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        parsedScores[critId] = num;
      }
    }

    try {
      setLoading(true);
      await submitScores(candidateId, parsedScores);
      toast.success('Scores saved successfully');
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredAndGroupedCandidates = useMemo(() => {
    // 1. Filter by search query
    const filtered = candidates.filter((c: any) => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.position.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 2. Group by position ID
    const grouped: Record<string, { position: any, candidates: any[] }> = {};
    filtered.forEach((c: any) => {
      if (!grouped[c.position.id]) {
        grouped[c.position.id] = { position: c.position, candidates: [] };
      }
      grouped[c.position.id].candidates.push(c);
    });

    // 3. Sort groups by position.order
    return Object.values(grouped).sort((a, b) => a.position.order - b.position.order);
  }, [candidates, searchQuery]);

  if (criteria.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">No screening criteria configured yet. Contact a Superadmin.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search candidates by name or position..." 
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredAndGroupedCandidates.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No candidates found.</p>
      ) : (
        <div className="space-y-8">
          {filteredAndGroupedCandidates.map((group) => (
            <div key={group.position.id} className="space-y-3">
              <h3 className="font-semibold text-lg border-b pb-2">{group.position.name}</h3>
              <Accordion type="single" collapsible className="w-full space-y-3">
                {group.candidates.map((candidate: any) => {
                  const totalScore = Object.values(scores[candidate.id] || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

                  return (
                    <AccordionItem key={candidate.id} value={candidate.id} className="border rounded-md px-2 sm:px-4 bg-card">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex justify-between items-center w-full pr-2 sm:pr-4">
                          <div className="flex items-center gap-2 sm:gap-4">
                            <div className="text-left">
                              <p className="font-semibold text-sm sm:text-base">{candidate.name}</p>
                            </div>
                          </div>
                          <Badge variant={totalScore > 0 ? "default" : "secondary"} className="text-xs">
                            Total: {totalScore.toFixed(1)} / 100
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <div className="space-y-4">
                          {criteria.map((c: any) => (
                            <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 sm:pb-4 gap-2 sm:gap-0 last:border-0 last:pb-0">
                              <div className="flex-1 pr-0 sm:pr-8">
                                <Label className="text-sm sm:text-base">{c.name}</Label>
                                <p className="text-xs text-muted-foreground">Max score: {c.weight}</p>
                              </div>
                              <div className="w-full sm:w-32">
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max={c.weight} 
                                  step="0.5"
                                  placeholder="0"
                                  className="w-full"
                                  value={scores[candidate.id]?.[c.id] || ''}
                                  onChange={(e) => handleScoreChange(candidate.id, c.id, e.target.value)}
                                />
                              </div>
                            </div>
                          ))}
                          
                          <div className="flex justify-end pt-2 sm:pt-4">
                            <Button className="w-full sm:w-auto" onClick={() => handleSave(candidate.id)} disabled={loading}>
                              Save Scores
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
