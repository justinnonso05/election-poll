'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Vote,
  Shield,
  Clock,
  User,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface Candidate {
  id: string;
  name: string;
  manifesto: string | null;
  photoUrl: string | null;
}

interface Position {
  id: string;
  name: string;
  description: string | null;
  order: number;
  candidates: Candidate[];
}

interface Election {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  association: {
    name: string;
    logoUrl: string | null;
  };
}

interface VotingInterfaceProps {
  voter: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    studentId: string;
    association: {
      name: string;
      logoUrl: string | null;
    };
  };
  election: Election;
  positions: Position[];
}

export default function VotingInterface({ voter, election, positions }: VotingInterfaceProps) {
  const router = useRouter();
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [casting, setCasting] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/voter/logout', { method: 'POST' });
    } catch (error) {
      // Ignore error for logout
    } finally {
      router.refresh();
    }
  };

  const handleCandidateSelect = (positionId: string, candidateId: string) => {
    setSelectedCandidates((prev) => ({
      ...prev,
      [positionId]: candidateId,
    }));
  };

  const getCurrentPosition = () => {
    return positions[currentPositionIndex];
  };

  const canProceed = () => {
    const currentPosition = getCurrentPosition();
    return currentPosition && selectedCandidates[currentPosition.id];
  };

  const handleNext = () => {
    if (currentPositionIndex < positions.length - 1) {
      setCurrentPositionIndex((prev) => prev + 1);
    } else {
      setShowPreview(true);
    }
  };

  const handlePrevious = () => {
    if (showPreview) {
      setShowPreview(false);
    } else if (currentPositionIndex > 0) {
      setCurrentPositionIndex((prev) => prev - 1);
    }
  };

  const handleCastVotes = async () => {
    setCasting(true);
    try {
      const votes = Object.entries(selectedCandidates).map(([positionId, candidateId]) => ({
        positionId,
        candidateId,
      }));

      const response = await fetch('/api/voting/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          electionId: election.id,
          votes,
        }),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        toast.success('Your votes have been cast successfully!');
        setTimeout(() => {
          router.refresh();
        }, 2000);
      } else {
        if (response.status === 401) {
          router.refresh();
          return;
        }
        toast.error(result.message || 'Failed to cast votes');
      }
    } catch (error) {
      toast.error('Failed to cast votes');
    } finally {
      setCasting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentPosition = getCurrentPosition();
  const progress = showPreview ? 100 : ((currentPositionIndex + 1) / positions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card shadow-md">
        <div className="max-w-10xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Association Logo */}
              {election.association.logoUrl && (
                <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                  <Image
                    src={election.association.logoUrl}
                    alt={`${election.association.name} Logo`}
                    fill
                    className="object-cover rounded"
                    sizes="40px"
                  />
                </div>
              )}

              {/* Brand and Association Names */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <h1 className="text-sm sm:text-lg font-bold text-foreground">NACOS POLL</h1>
                <span className="hidden sm:inline text-muted-foreground">|</span>
                <span className="text-xs sm:text-sm font-semibold text-muted-foreground">
                  {election.association.name}
                </span>
              </div>
            </div>

            {/* User Info and Logout */}
            <div className="flex items-center gap-1 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>
                  {voter.firstName} {voter.lastName}
                </span>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-15 sm:pt-17">
        {/* Election Info Banner */}
        <div className="bg-card border-b border-none">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-1 sm:py-5 sm:pb-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                {/* <h2 className="text-xl sm:text-3xl font-bold text-foreground">{election.title}</h2> */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Clock className="h-4 w-4" />
                  <span>Ends: {formatDate(election.endAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-foreground">
                {showPreview
                  ? 'Review & Submit Vote'
                  : `${currentPosition?.name} (${currentPositionIndex + 1} of ${positions.length})`}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-10xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
          {/* Vote Preview */}
          {showPreview ? (
            <div className="space-y-6">
              <div className="bg-card rounded-lg border border-border shadow-sm p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-xl font-bold text-foreground">Review Your Selections</h3>
                </div>

                <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50 mb-6">
                  <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                    <strong>Important:</strong> Once submitted, your votes cannot be viewed or
                    changed. You will be automatically logged out for security.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4 mb-8">
                  {positions.map((position) => {
                    const selectedCandidateId = selectedCandidates[position.id];
                    const selectedCandidate = position.candidates?.find(
                      (c) => c.id === selectedCandidateId
                    );

                    return (
                      <div key={position.id} className="border border-border rounded-lg p-4">
                        <h4 className="font-semibold text-foreground mb-3">{position.name}</h4>
                        {selectedCandidate && (
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              {/* Candidate Image in Preview */}
                              {selectedCandidate.photoUrl ? (
                                <div className="w-16 h-16 aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                                  <Image
                                    src={selectedCandidate.photoUrl}
                                    alt={selectedCandidate.name}
                                    width={64}
                                    height={64}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground font-medium">
                                  {getInitials(selectedCandidate.name)}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">
                                {selectedCandidate.name}
                              </div>
                              <Badge className="mt-1 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50">
                                Selected
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={handlePrevious} variant="outline" className="flex-1 h-12">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Edit
                  </Button>
                  <Button onClick={handleCastVotes} disabled={casting} className="flex-1 h-12">
                    {casting ? 'Submitting...' : 'Submit Vote'}
                    <Vote className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Current Position Voting */
            currentPosition && (
              <div className="space-y-6">
                {/* Position Header */}
                <div className="bg-card rounded-lg border border-border shadow-sm p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        {currentPosition.name}
                      </h3>
                      {currentPosition.description && (
                        <p className="text-muted-foreground">{currentPosition.description}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="w-fit">
                      {currentPosition.candidates?.length || 0} Candidate
                      {(currentPosition.candidates?.length || 0) !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                {!currentPosition.candidates || currentPosition.candidates.length === 0 ? (
                  <div className="bg-card rounded-lg border border-border shadow-lg p-8 text-center">
                    <p className="text-muted-foreground mb-6">
                      No candidates available for this position.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                      <Button
                        onClick={handlePrevious}
                        variant="outline"
                        disabled={currentPositionIndex === 0}
                        className="flex-1 h-12"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      <Button onClick={handleNext} className="flex-1 h-12">
                        {currentPositionIndex === positions.length - 1
                          ? 'Review Votes'
                          : 'Skip Position'}
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Candidates Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {currentPosition.candidates.map((candidate) => (
                        <div
                          key={candidate.id}
                          className={`group cursor-pointer transition-all duration-200 rounded-lg border-2 p-4 hover:shadow-lg ${
                            selectedCandidates[currentPosition.id] === candidate.id
                              ? 'border-primary shadow-lg'
                              : 'shadow-md hover:border-primary/50'
                          }`}
                          onClick={() => handleCandidateSelect(currentPosition.id, candidate.id)}
                        >
                          {/* Candidate Image in Grid */}
                          {candidate.photoUrl ? (
                            <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                              <Image
                                src={candidate.photoUrl}
                                alt={candidate.name}
                                width={192}
                                height={192}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-2xl font-medium">
                              {getInitials(candidate.name)}
                            </div>
                          )}
                          {selectedCandidates[currentPosition.id] === candidate.id && (
                            <div className="absolute -top-2 -right-2 bg-primary rounded-full p-2">
                              <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                            </div>
                          )}

                          {/* Candidate Info */}
                          <div className="text-center">
                            <h4 className="font-semibold text-lg text-foreground mb-1">
                              {candidate.name}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              Running for {currentPosition.name}
                            </p>

                            {/* Manifesto */}
                            {candidate.manifesto && (
                              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed text-left">
                                {candidate.manifesto}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Navigation */}
                    <div className="bg-card rounded-lg border border-border shadow-sm p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          onClick={handlePrevious}
                          variant="outline"
                          disabled={currentPositionIndex === 0}
                          className="flex-1 h-12"
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Previous Position
                        </Button>

                        <Button
                          onClick={handleNext}
                          disabled={!canProceed()}
                          className="flex-1 h-12"
                        >
                          {currentPositionIndex === positions.length - 1
                            ? 'Review Votes'
                            : 'Next Position'}
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>

                      {!canProceed() && (
                        <p className="text-center text-sm text-muted-foreground mt-4">
                          Please select a candidate to continue
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
