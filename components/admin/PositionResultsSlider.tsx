'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Trophy, Medal, Award, Equal } from 'lucide-react';
import Image from 'next/image';

interface Candidate {
  id: string;
  name: string;
  manifesto: string | null;
  photoUrl: string | null;
  votes: number;
  percentage: number;
  rank: number;
  isTied: boolean;
}

interface Position {
  id: string;
  name: string;
  description: string | null;
  totalVotes: number;
  candidates: Candidate[];
}

interface PositionResultsSliderProps {
  positions: Position[];
  isElectionActive?: boolean;
}

export default function PositionResultsSlider({
  positions,
  isElectionActive = false,
}: PositionResultsSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (positions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No position results available</p>
        </CardContent>
      </Card>
    );
  }

  const currentPosition = positions[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % positions.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + positions.length) % positions.length);
  };

  const getPositionIcon = (candidate: Candidate, index: number) => {
    if (candidate.isTied) {
      return <Equal className="h-5 w-5 text-orange-600 dark:text-orange-500" />;
    }

    if (candidate.rank === 1)
      return <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />;
    if (candidate.rank === 2) return <Medal className="h-5 w-5 text-muted-foreground" />;
    if (candidate.rank === 3)
      return <Award className="h-5 w-5 text-amber-600 dark:text-amber-500" />;
    return (
      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
        {candidate.rank}
      </div>
    );
  };

  const getPositionBadge = (candidate: Candidate) => {
    if (candidate.isTied) {
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-200">
          Draw -{' '}
          {candidate.rank === 1
            ? '1st'
            : candidate.rank === 2
              ? '2nd'
              : candidate.rank === 3
                ? '3rd'
                : `${candidate.rank}th`}{' '}
          Place
        </Badge>
      );
    }

    if (candidate.rank === 1)
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-200">
          1st Place
        </Badge>
      );
    if (candidate.rank === 2) return <Badge variant="secondary">2nd Place</Badge>;
    if (candidate.rank === 3)
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-200">
          3rd Place
        </Badge>
      );
    return <Badge variant="outline">{candidate.rank}th Place</Badge>;
  };

  const getBackgroundStyle = (candidate: Candidate, index: number) => {
    if (candidate.isTied && candidate.rank === 1) {
      return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20';
    }
    if (candidate.rank === 1) {
      return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
    }
    return 'border-border bg-muted/30';
  };

  const getProgressBarColor = (candidate: Candidate) => {
    if (candidate.isTied && candidate.rank === 1) {
      return 'bg-orange-500 dark:bg-orange-600';
    }
    if (candidate.rank === 1) {
      return 'bg-yellow-500 dark:bg-yellow-600';
    }
    return 'bg-muted-foreground/60';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if tie-breaker message should be shown
  const shouldShowTieBreakerMessage = () => {
    if (!isElectionActive) return false; // Don't show if election is not active

    // Check if there are tied candidates in first place (rank 1)
    const firstPlaceTiedCandidates = currentPosition.candidates.filter(
      (c) => c.rank === 1 && c.isTied
    );
    return firstPlaceTiedCandidates.length > 0;
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-foreground">
              {currentPosition.name} Results
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {currentPosition.totalVotes.toLocaleString()} total votes cast
              {currentPosition.description && ` • ${currentPosition.description}`}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {currentIndex + 1} of {positions.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-2 py-4 sm:px-6 sm:py-6">
        {/* Candidates Results */}
        <div className="space-y-4 mb-6">
          {currentPosition.candidates.map((candidate, index) => (
            <div
              key={candidate.id}
              className={`flex items-center gap-4 p-4 rounded-lg border ${getBackgroundStyle(candidate, index)}`}
            >
              {/* Position Indicator */}
              <div className="flex items-center gap-3">
                {getPositionIcon(candidate, index)}
                <div className="relative">
                  {candidate.photoUrl ? (
                    <div className="w-16 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      <Image
                        src={candidate.photoUrl}
                        alt={candidate.name}
                        width={64}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-20 bg-muted rounded-lg flex items-center justify-center text-muted-foreground font-medium">
                      {getInitials(candidate.name)}
                    </div>
                  )}
                  {candidate.isTied && (
                    <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-1">
                      <Equal className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Candidate Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{candidate.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Running for {currentPosition.name}
                    </p>
                    {candidate.isTied && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1">
                        Tied with{' '}
                        {
                          currentPosition.candidates.filter(
                            (c) => c.votes === candidate.votes && c.id !== candidate.id
                          ).length
                        }{' '}
                        other candidate
                        {currentPosition.candidates.filter(
                          (c) => c.votes === candidate.votes && c.id !== candidate.id
                        ).length !== 1
                          ? 's'
                          : ''}
                      </p>
                    )}
                  </div>
                  {getPositionBadge(candidate)}
                </div>

                {/* Vote Stats */}
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {candidate.votes.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">votes</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {candidate.percentage.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">of total votes</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressBarColor(candidate)}`}
                      style={{ width: `${candidate.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tie-Breaker Message - Only show for active elections with first-place ties */}
        {shouldShowTieBreakerMessage() && (
          <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-2">
              <Equal className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                First Place Tie
              </h4>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Multiple candidates are currently tied for first place. Additional votes may resolve
              this tie, or a tie-breaking mechanism may be required if the election ends with this
              result.
            </p>
          </div>
        )}

        {/* Navigation */}
        {positions.length > 1 && (
          <div className="flex items-center justify-between">
            <Button
              type="button"
              onClick={handlePrevious}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {/* Position Indicators */}
            <div className="items-center gap-2 hidden sm:flex">
              {positions.map((position, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                  title={`View ${position.name} results`}
                  aria-label={`View ${position.name} results`}
                />
              ))}
            </div>

            <Button
              type="button"
              onClick={handleNext}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
