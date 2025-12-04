'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Vote, Eye, Plus, Play, Pause, Square, Clock } from 'lucide-react';
import CreateElectionDialog from './CreateElectionDialog';
import ElectionDetailsModal from './ElectionDetailsModal';
import { toast } from 'sonner';
import type { Election } from '@prisma/client';

// Extend Election type to include _count and positions if needed
type ElectionWithCounts = Election & {
  _count?: {
    candidates?: number;
    votes?: number;
  };
  positions?: unknown[];
};

interface ElectionManagementSectionProps {
  election: ElectionWithCounts | null;
  status: string;
  associationId: string;
  isSuper: boolean;
}

export default function ElectionManagementSection({
  election,
  status,
  associationId,
  isSuper,
}: ElectionManagementSectionProps) {
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const getStatusBadge = () => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-200">
            Active
          </Badge>
        );
      case 'PAUSED':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-200">
            Paused
          </Badge>
        );
      case 'NOT_STARTED':
        return <Badge variant="outline">Not Started</Badge>;
      case 'ENDED':
        return <Badge variant="destructive">Ended</Badge>;
      default:
        return <Badge variant="outline">No Election</Badge>;
    }
  };

  // Accept Date or string for formatting
  const formatDateTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTimeStatus = () => {
    if (!election) return null;

    const now = new Date();
    const start = new Date(election.startAt);
    const end = new Date(election.endAt);

    if (now < start) {
      const timeUntilStart = start.getTime() - now.getTime();
      const hoursUntilStart = Math.ceil(timeUntilStart / (1000 * 60 * 60));
      return { type: 'upcoming', message: `Starts in ${hoursUntilStart} hours` };
    }

    if (now > end) {
      return { type: 'ended', message: 'Election has ended' };
    }

    const timeUntilEnd = end.getTime() - now.getTime();
    const hoursUntilEnd = Math.ceil(timeUntilEnd / (1000 * 60 * 60));
    return { type: 'active', message: `Ends in ${hoursUntilEnd} hours` };
  };

  const handleElectionAction = async (action: 'start' | 'pause' | 'end') => {
    if (!election) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/election/${election.id}/control`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to update election');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleElectionUpdate = () => {
    window.location.reload();
  };

  if (!election) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <Vote className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium text-foreground">No Election Created</h3>
          <p className="text-muted-foreground">Create your first election to get started</p>
        </div>
        {isSuper && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Election
          </Button>
        )}
        <CreateElectionDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          associationId={associationId}
        />
      </div>
    );
  }

  const timeStatus = getTimeStatus();

  return (
    <div className="space-y-4">
      {/* Election Info */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-foreground">{election.title}</h3>
          <p className="text-muted-foreground mb-3">{election.description}</p>

          {/* Time Status with Schedule */}
          <div className="space-y-2">
            {timeStatus && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span
                  className={`font-medium ${
                    timeStatus.type === 'active'
                      ? 'text-green-600 dark:text-green-400'
                      : timeStatus.type === 'upcoming'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {timeStatus.message}
                </span>
              </div>
            )}

            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <span className="min-w-[60px]">Start:</span>
                <span>{formatDateTime(election.startAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="min-w-[60px]">End:</span>
                <span>{formatDateTime(election.endAt)}</span>
              </div>
            </div>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Election Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-none">
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-medium text-foreground">
              {Math.ceil(
                (new Date(election.endAt).getTime() - new Date(election.startAt).getTime()) /
                  (1000 * 60 * 60)
              )}{' '}
              hours
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Candidates</p>
            <p className="text-2xl font-bold text-foreground">{election._count?.candidates || 0}</p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="p-4 text-center">
            <Vote className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Total Votes</p>
            <p className="text-2xl font-bold text-foreground">{election._count?.votes || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" onClick={() => setShowDetailsModal(true)}>
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>

        {/* Election Control Buttons */}
        <div className="flex gap-2">
          {(status === 'NOT_STARTED' || status === 'PAUSED') && (
            <Button
              onClick={() => handleElectionAction('start')}
              disabled={loading}
              variant="default"
            >
              <Play className="h-4 w-4 mr-2" />
              {status === 'PAUSED' ? 'Resume' : 'Start'} Election
            </Button>
          )}

          {status === 'ACTIVE' && (
            <>
              <Button
                onClick={() => handleElectionAction('pause')}
                disabled={loading}
                variant="secondary"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause Election
              </Button>

              <Button
                onClick={() => handleElectionAction('end')}
                disabled={loading}
                variant="destructive"
                className="ml-2"
              >
                <Square className="h-4 w-4 mr-2" />
                End Election
              </Button>
            </>
          )}

          {status === 'ENDED' && (
            <Button variant="secondary" disabled>
              <Square className="h-4 w-4 mr-2" />
              Election Ended
            </Button>
          )}
        </div>
      </div>

      {/* Election Details Modal */}
      <ElectionDetailsModal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        election={election}
        status={status}
        onUpdate={handleElectionUpdate}
      />
    </div>
  );
}
