'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ExternalLink, FileText, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

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
  isSelected: boolean;
  onSelectionChange: (selected: boolean) => void;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function CandidateManifestoCard({ 
  candidate, 
  isSelected, 
  onSelectionChange 
}: CandidateManifestoCardProps) {
  const [showFullSummary, setShowFullSummary] = useState(false);

  const handleViewManifesto = () => {
    if (candidate.manifestoUrl) {
      window.open(candidate.manifestoUrl, '_blank');
    }
  };

  const truncatedSummary = candidate.manifestoSummary?.slice(0, 150) + '...';
  const shouldTruncate = candidate.manifestoSummary && candidate.manifestoSummary.length > 150;

  return (
    <Card className={`transition-all duration-200 h-full flex flex-col ${isSelected ? 'ring-2 ring-primary border-primary' : ''}`}>
      {/* Reduced header padding on mobile */}
      <CardHeader className="pb-2 sm:pb-3 px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 flex-shrink-0">
        <div className="flex items-start gap-1 sm:gap-2 lg:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelectionChange}
              className="mt-0.5 w-3 h-3 sm:w-4 sm:h-4"
            />
            {candidate.photoUrl ? (
              <Image
                src={candidate.photoUrl}
                alt={candidate.name}
                width={28}
                height={28}
                className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 object-cover rounded-full border flex-shrink-0"
              />
            ) : (
              <Avatar className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex-shrink-0">
                <AvatarFallback className="text-xs sm:text-sm">
                  {getInitials(candidate.name)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xs sm:text-sm lg:text-base leading-tight line-clamp-2 break-words">
              {candidate.name}
            </CardTitle>
            <Badge variant="secondary" className="text-xs mt-1 max-w-full truncate px-1 sm:px-2 py-0.5">
              {candidate.position}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* Reduced content padding on mobile */}
      <CardContent className="space-y-2 sm:space-y-3 flex-1 flex flex-col pt-0 px-2 sm:px-4 lg:px-6 pb-2 sm:pb-3 lg:pb-4">
        {candidate.manifestoSummary ? (
          <div className="space-y-1 sm:space-y-2 flex-1">
            <h4 className="text-xs font-medium text-muted-foreground">Summary:</h4>
            <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words hyphens-auto">
              {shouldTruncate && !showFullSummary 
                ? truncatedSummary 
                : candidate.manifestoSummary
              }
            </div>
            {shouldTruncate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullSummary(!showFullSummary)}
                className="text-xs p-0 h-auto text-primary hover:text-primary/80 self-start"
              >
                {showFullSummary ? (
                  <>
                    <EyeOff className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                    <span className="text-xs">Less</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                    <span className="text-xs">More</span>
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="text-xs sm:text-sm text-muted-foreground italic flex-1">
            No summary available
          </div>
        )}

        {candidate.manifestoUrl && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewManifesto}
            className="w-full text-xs sm:text-sm mt-auto px-2 sm:px-3 py-1 sm:py-2 h-auto"
          >
            <FileText className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="truncate flex-1">View Manifesto</span>
            <ExternalLink className="w-2 h-2 sm:w-3 sm:h-3 ml-1 sm:ml-2 flex-shrink-0" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}