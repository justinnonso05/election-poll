'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Calendar, Clock, Download, Radio } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import DownloadResultsPDF from '@/components/results/DownloadResultsPDF';

interface CandidateResult {
  id: string;
  name: string;
  photoUrl: string | null;
  votes: number;
  percentage: number;
  isWinner: boolean;
}

interface PositionResult {
  id: string;
  name: string;
  order: number;
  totalVotes: number;
  candidates: CandidateResult[];
}

interface ElectionMeta {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  isActive: boolean;
  liveResults: boolean;
  isEnded: boolean;
  association: { name: string; logoUrl: string | null };
}

interface LiveResultsPageProps {
  initialData: {
    election: ElectionMeta;
    positions: PositionResult[];
  };
  formattedDate: string;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export default function LiveResultsPage({ initialData, formattedDate }: LiveResultsPageProps) {
  const { election } = initialData;
  const [positions, setPositions] = useState<PositionResult[]>(initialData.positions);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchLiveResults = useCallback(async () => {
    try {
      const res = await fetch(`/api/election/${election.id}/results`);
      if (res.ok) {
        const data = await res.json();
        setPositions(data.data);
        setLastUpdated(new Date());
      }
    } catch {
      // Silent fail - keep showing existing data
    }
  }, [election.id]);

  // 10s polling only when live results is enabled and election is still running
  useEffect(() => {
    if (!election.liveResults || election.isEnded) return;

    const interval = setInterval(fetchLiveResults, 10000);
    return () => clearInterval(interval);
  }, [election.liveResults, election.isEnded, fetchLiveResults]);

  const totalVoters = positions.reduce((sum, pos) => Math.max(sum, pos.totalVotes), 0);

  const handleDownloadLocked = () => {
    toast.info('Results PDF is available for download once the election is over.');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div id="results-container" className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              {election.association.logoUrl && (
                <Image
                  src={election.association.logoUrl}
                  alt={election.association.name}
                  width={60}
                  height={60}
                  className="rounded-lg"
                />
              )}
              <div>
                <CardTitle className="text-2xl sm:text-3xl">
                  {election.association.name}
                </CardTitle>
                <p className="text-lg text-muted-foreground">
                  {election.liveResults && !election.isEnded ? 'Live Results' : 'Election Results'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{election.title}</h2>
              {election.description && (
                <p className="text-muted-foreground">{election.description}</p>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-center gap-2 mt-3">
              {election.liveResults && !election.isEnded ? (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                  <Radio className="w-4 h-4 animate-pulse" />
                  Live — updates every 10 seconds
                </div>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Final Results — Election Ended
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mt-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Started: {formatDate(election.startAt)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {election.isEnded ? 'Ended:' : 'Ends:'} {formatDate(election.endAt)}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                Total Votes So Far: {totalVoters}
              </div>
            </div>

            {/* Live last-updated timestamp */}
            {election.liveResults && !election.isEnded && (
              <p className="text-xs text-muted-foreground mt-2">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}

            {/* Download Button */}
            <div className="mt-6">
              {election.isEnded ? (
                <DownloadResultsPDF
                  electionId={election.id}
                  electionTitle={election.title}
                  associationName={election.association.name}
                />
              ) : (
                <Button variant="outline" size="lg" className="gap-2" onClick={handleDownloadLocked}>
                  <Download className="h-4 w-4" />
                  Download Results PDF
                </Button>
              )}
            </div>

            {!election.isEnded && (
              <p className="text-xs text-muted-foreground mt-2">
                PDF download will be available once the election has ended.
              </p>
            )}
          </CardHeader>
        </Card>

        {/* Results by Position */}
        <div className="space-y-6">
          {positions.map((position) => (
            <Card key={position.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  {position.name}
                  <Badge variant="secondary" className="ml-auto">
                    {position.totalVotes} vote{position.totalVotes !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {position.candidates.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No candidates for this position
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-semibold">Rank</th>
                          <th className="text-left p-3 font-semibold">Candidate</th>
                          <th className="text-center p-3 font-semibold">Votes</th>
                          <th className="text-center p-3 font-semibold">Percentage</th>
                          <th className="text-center p-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {position.candidates.map((candidate, index) => (
                          <tr
                            key={candidate.id}
                            className={`border-b transition-colors hover:bg-muted/30 ${
                              candidate.isWinner ? 'bg-green-50 dark:bg-green-950/20' : ''
                            }`}
                          >
                            <td className="p-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                                  candidate.isWinner
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {index + 1}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                {candidate.photoUrl ? (
                                  <Image
                                    src={candidate.photoUrl}
                                    alt={candidate.name}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 object-cover rounded-full border"
                                  />
                                ) : (
                                  <Avatar className="w-10 h-10">
                                    <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                                  </Avatar>
                                )}
                                <span className="font-medium">{candidate.name}</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span className="text-lg font-bold">{candidate.votes}</span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-semibold">
                                  {candidate.percentage.toFixed(1)}%
                                </span>
                                <div className="w-full max-w-[100px] bg-muted rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                      candidate.isWinner ? 'bg-green-600' : 'bg-blue-600'
                                    }`}
                                    style={{ width: `${candidate.percentage}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              {candidate.isWinner && (
                                <Badge className="bg-green-600 text-white font-semibold">
                                  {election.isEnded ? 'WINNER' : 'LEADING'}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {election.isEnded
                ? `Results are final and official. Generated on ${formattedDate}`
                : `Live results — voting is still in progress. Generated on ${formattedDate}`}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
