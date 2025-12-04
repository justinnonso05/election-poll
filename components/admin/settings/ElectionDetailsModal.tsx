'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, Vote, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Election } from '@prisma/client';

type ElectionWithCounts = Election & {
  _count?: {
    candidates?: number;
    votes?: number;
  };
  positions?: unknown[];
};

interface ElectionDetailsModalProps {
  open: boolean;
  onClose: () => void;
  election: ElectionWithCounts | null;
  status: string;
  onUpdate?: () => void;
}

// ...rest of your component...

export default function ElectionDetailsModal({
  open,
  onClose,
  election,
  status,
  onUpdate,
}: ElectionDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    isActive: false,
  });

  useEffect(() => {
    if (election) {
      setFormData({
        title: election.title || '',
        description: election.description || '',
        startAt: election.startAt ? new Date(election.startAt).toISOString().slice(0, 16) : '',
        endAt: election.endAt ? new Date(election.endAt).toISOString().slice(0, 16) : '',
        isActive: election.isActive || false,
      });
    }
  }, [election]);

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
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

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

  const getDuration = () => {
    if (!election?.startAt || !election?.endAt) return 'N/A';

    const start = new Date(election.startAt);
    const end = new Date(election.endAt);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ${diffHours % 24} hour${diffHours % 24 !== 1 ? 's' : ''}`;
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  };

  const getTimeRemaining = () => {
    if (!election) return null;

    const now = new Date();
    const start = new Date(election.startAt);
    const end = new Date(election.endAt);

    if (now < start) {
      const timeUntilStart = start.getTime() - now.getTime();
      const hoursUntilStart = Math.ceil(timeUntilStart / (1000 * 60 * 60));
      const daysUntilStart = Math.floor(hoursUntilStart / 24);

      if (daysUntilStart > 0) {
        return {
          type: 'upcoming',
          message: `Starts in ${daysUntilStart} day${daysUntilStart !== 1 ? 's' : ''}`,
        };
      }
      return {
        type: 'upcoming',
        message: `Starts in ${hoursUntilStart} hour${hoursUntilStart !== 1 ? 's' : ''}`,
      };
    }

    if (now > end) {
      return { type: 'ended', message: 'Election has ended' };
    }

    const timeUntilEnd = end.getTime() - now.getTime();
    const hoursUntilEnd = Math.ceil(timeUntilEnd / (1000 * 60 * 60));
    const daysUntilEnd = Math.floor(hoursUntilEnd / 24);

    if (daysUntilEnd > 0) {
      return {
        type: 'active',
        message: `${daysUntilEnd} day${daysUntilEnd !== 1 ? 's' : ''} remaining`,
      };
    }
    return {
      type: 'active',
      message: `${hoursUntilEnd} hour${hoursUntilEnd !== 1 ? 's' : ''} remaining`,
    };
  };

  const handleSave = async () => {
    if (!election) return;

    setLoading(true);
    try {
      // Validate dates
      const startDate = new Date(formData.startAt);
      const endDate = new Date(formData.endAt);

      if (endDate <= startDate) {
        toast.error('End date must be after start date');
        return;
      }

      const response = await fetch('/api/election/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: election.id,
          title: formData.title,
          description: formData.description,
          startAt: startDate.toISOString(),
          endAt: endDate.toISOString(),
          isActive: formData.isActive,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Election updated successfully');
        setIsEditing(false);
        onUpdate?.();
      } else {
        toast.error(result.message || 'Failed to update election');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    if (election) {
      setFormData({
        title: election.title || '',
        description: election.description || '',
        startAt: election.startAt ? new Date(election.startAt).toISOString().slice(0, 16) : '',
        endAt: election.endAt ? new Date(election.endAt).toISOString().slice(0, 16) : '',
        isActive: election.isActive || false,
      });
    }
    setIsEditing(false);
  };

  const timeRemaining = getTimeRemaining();

  if (!election) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl">Election Details</DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge()}
              {timeRemaining && (
                <Badge
                  variant="outline"
                  className={`${
                    timeRemaining.type === 'active'
                      ? 'text-green-700 dark:text-green-300'
                      : timeRemaining.type === 'upcoming'
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {timeRemaining.message}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Basic Information */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Basic Information</h3>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Election Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Election title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Election description"
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                      <p className="text-foreground font-medium mt-1">{election.title}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Description
                      </Label>
                      <p className="text-foreground mt-1">
                        {election.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold text-foreground">{getDuration()}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Candidates</p>
                  <p className="text-2xl font-bold text-foreground">
                    {election._count?.candidates || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Vote className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Total Votes</p>
                  <p className="text-2xl font-bold text-foreground">
                    {election._count?.votes || 0}
                  </p>
                </CardContent>
              </Card>

              {/* <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold text-foreground">{status.replace('_', ' ')}</p>
                </CardContent>
              </Card> */}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Election Schedule</h3>

                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startAt">Start Date & Time</Label>
                      <Input
                        id="startAt"
                        type="datetime-local"
                        value={formData.startAt}
                        onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endAt">End Date & Time</Label>
                      <Input
                        id="endAt"
                        type="datetime-local"
                        value={formData.endAt}
                        onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Start Time
                      </Label>
                      <p className="font-medium text-foreground mt-1">
                        {formatDateTime(election.startAt)}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">End Time</Label>
                      <p className="font-medium text-foreground mt-1">
                        {formatDateTime(election.endAt)}
                      </p>
                    </div>
                  </div>
                )}

                {!isEditing && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Timeline</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {timeRemaining ? (
                        <p
                          className={`font-medium ${
                            timeRemaining.type === 'active'
                              ? 'text-green-600 dark:text-green-400'
                              : timeRemaining.type === 'upcoming'
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {timeRemaining.message}
                        </p>
                      ) : (
                        <p>Timeline information unavailable</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Participation</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Candidates:</span>
                      <span className="font-medium">{election._count?.candidates || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Votes Cast:</span>
                      <span className="font-medium">{election._count?.votes || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Positions:</span>
                      <span className="font-medium">{election.positions?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Technical Details</h4>
                  <div className="space-y-3">
                    {/* <div className="flex justify-between">
                      <span className="text-muted-foreground">Election ID:</span>
                      <span className="font-mono text-xs">{election.id}</span>
                    </div> */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="text-sm">
                        {new Date(election.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="text-sm">
                        {new Date(election.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
