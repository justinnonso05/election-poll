'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Users, User, Sparkles, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { QAResponse } from '@/components/manifesto/QAResponse';

interface Candidate {
  id: string;
  name: string;
  position: string;
}

interface ManifestoQAChatProps {
  electionId: string;
  candidates: Candidate[];
  selectedCandidates: string[];
  onCandidateSelect: (candidateIds: string[]) => void;
}

interface QAResult {
  answer: string;
  sources: Array<{
    candidateId: string;
    candidateName: string;
    position: string;
    content: string;
    similarity: number;
  }>;
  totalSources: number;
  question: string;
  timestamp: Date;
}

// Create a global state for QA history to persist across tab switches
const qaHistoryStore = new Map<string, QAResult[]>();

export function ManifestoQAChat({ 
  electionId, 
  candidates, 
  selectedCandidates, 
  onCandidateSelect 
}: ManifestoQAChatProps) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [qaHistory, setQaHistory] = useState<QAResult[]>(() => {
    // Initialize from stored history
    return qaHistoryStore.get(electionId) || [];
  });

  // Persist history when it changes
  useEffect(() => {
    qaHistoryStore.set(electionId, qaHistory);
  }, [qaHistory, electionId]);

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/manifesto-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          electionId,
          question: question.trim(),
          candidateIds: selectedCandidates.length > 0 ? selectedCandidates : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to process question');
      }

      const qaResult: QAResult = {
        ...result.data,
        question: question.trim(),
        timestamp: new Date(),
      };

      setQaHistory(prev => [qaResult, ...prev]);
      setQuestion('');
      toast.success('Question processed successfully!');

    } catch (error) {
      console.error('Error asking question:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process question');
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setQaHistory([]);
    qaHistoryStore.delete(electionId);
    toast.success('Chat history cleared');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  const selectAllCandidates = () => {
    onCandidateSelect(candidates.map(c => c.id));
  };

  const clearSelection = () => {
    onCandidateSelect([]);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Question Input */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Ask About Candidate Manifestos</span>
            </CardTitle>
            {qaHistory.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
                className="flex items-center gap-2 text-xs sm:text-sm self-start sm:self-auto"
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                Clear History
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Candidate Selection */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-xs sm:text-sm font-medium">
                Ask about specific candidates (optional):
              </label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllCandidates}
                  disabled={selectedCandidates.length === candidates.length}
                  className="text-xs"
                >
                  <Users className="w-3 h-3 mr-1" />
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  disabled={selectedCandidates.length === 0}
                  className="text-xs"
                >
                  Clear
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {selectedCandidates.length === 0 ? (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <Users className="w-3 h-3" />
                  All Candidates
                </Badge>
              ) : (
                selectedCandidates.map(candidateId => {
                  const candidate = candidates.find(c => c.id === candidateId);
                  return candidate ? (
                    <Badge key={candidateId} variant="default" className="flex items-center gap-1 text-xs max-w-full">
                      <User className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{candidate.name}</span>
                    </Badge>
                  ) : null;
                })
              )}
            </div>
          </div>

          {/* Question Input */}
          <div className="space-y-3">
            <Textarea
              placeholder="Ask anything about the candidates' manifestos... (e.g., 'What are their positions on student housing?', 'How do they plan to improve campus facilities?')"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyPress}
              className="min-h-[80px] sm:min-h-[100px] resize-none text-sm"
              disabled={isLoading}
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Press Ctrl+Enter or Cmd+Enter to submit
              </p>
              <Button 
                onClick={handleAskQuestion}
                disabled={isLoading || !question.trim()}
                className="min-w-[100px] text-sm self-start sm:self-auto"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Ask
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Q&A History */}
      {qaHistory.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold">Recent Questions & Answers</h3>
            <Badge variant="secondary" className="text-xs self-start sm:self-auto">
              {qaHistory.length} question{qaHistory.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          {qaHistory.map((qa, index) => (
            <QAResponse key={index} qa={qa} />
          ))}
        </div>
      )}
    </div>
  );
}