'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, User, Clock, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface QASource {
  candidateId: string;
  candidateName: string;
  position: string;
  content: string;
  similarity: number;
}

interface QAResult {
  answer: string;
  sources: QASource[];
  totalSources: number;
  question: string;
  timestamp: Date;
}

interface QAResponseProps {
  qa: QAResult;
}

export function QAResponse({ qa }: QAResponseProps) {
  const copyToClipboard = () => {
    const text = `Q: ${qa.question}\n\nA: ${qa.answer}`;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {qa.question}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatTime(qa.timestamp)}
              <Badge variant="secondary" className="text-xs">
                {qa.totalSources} source{qa.totalSources !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex-shrink-0"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Answer */}
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {qa.answer}
          </div>
        </div>

        {/* Sources */}
        {qa.sources.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Sources from candidate manifestos:
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {qa.sources.map((source, index) => (
                <Card key={index} className="border-l-4 border-l-primary/20">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        <span className="text-sm font-medium">{source.candidateName}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {source.position}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      "{source.content}"
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Relevance: {Math.round(source.similarity * 100)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}