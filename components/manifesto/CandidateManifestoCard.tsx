'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  position: string;
  manifestoSummary: string | null;
  manifestoUrl: string | null;
  photoUrl: string | null;
}

interface CandidateManifestoCardProps {
  candidate: Candidate;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatSummaryIntoParagraphs(text: string): string[] {
  // Split on double newlines or numbered points or bullet marks
  const parts = text
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 30);

  // If only one chunk came back, try splitting on sentence boundaries every ~2 sentences
  if (parts.length <= 1) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const chunk = sentences.slice(i, i + 2).join(' ').trim();
      if (chunk) chunks.push(chunk);
    }
    return chunks.length > 0 ? chunks : [text];
  }

  return parts;
}

export function CandidateManifestoCard({ candidate }: CandidateManifestoCardProps) {
  const [expanded, setExpanded] = useState(false);

  const paragraphs = candidate.manifestoSummary
    ? formatSummaryIntoParagraphs(candidate.manifestoSummary)
    : [];

  const visibleParagraphs = expanded ? paragraphs : paragraphs.slice(0, 2);
  const hasMore = paragraphs.length > 2;

  return (
    <div className="rounded-xl border bg-card p-5 flex flex-col gap-4 h-full">
      {/* Candidate Header */}
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          {candidate.photoUrl && (
            <AvatarImage src={candidate.photoUrl} alt={candidate.name} />
          )}
          <AvatarFallback className="text-sm font-medium">
            {getInitials(candidate.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <p className="font-semibold text-sm leading-snug truncate">{candidate.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{candidate.position}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Summary Body */}
      <div className="flex-1">
        {paragraphs.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Manifesto Summary
            </p>
            {visibleParagraphs.map((para, i) => (
              <p key={i} className="text-sm text-foreground leading-relaxed">
                {para}
              </p>
            ))}
            {hasMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" /> Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" /> Read more
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No summary available yet.</p>
        )}
      </div>

      {/* Footer Action */}
      {candidate.manifestoUrl && (
        <>
          <div className="h-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(candidate.manifestoUrl!, '_blank')}
            className="w-full justify-between text-sm font-normal h-8 px-0 hover:bg-transparent hover:text-foreground text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              View full manifesto
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}