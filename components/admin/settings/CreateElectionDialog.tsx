'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CreateElectionDialogProps {
  open: boolean;
  onClose: () => void;
  associationId: string;
}

export default function CreateElectionDialog({
  open,
  onClose,
  associationId,
}: CreateElectionDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate dates
      const startDate = new Date(formData.startAt);
      const endDate = new Date(formData.endAt);
      const now = new Date();

      if (endDate <= startDate) {
        toast.error('End date must be after start date');
        return;
      }

      if (endDate <= now) {
        toast.error('End date must be in the future');
        return;
      }

      const response = await fetch('/api/election/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          associationId,
          startAt: startDate.toISOString(),
          endAt: endDate.toISOString(),
        }),
      });

      if (response.ok) {
        toast.success('Election created successfully');
        onClose();
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create election');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };

  const getMinStartDate = () => {
    return formatDateForInput(new Date());
  };

  const getMinEndDate = () => {
    if (formData.startAt) {
      const startDate = new Date(formData.startAt);
      startDate.setHours(startDate.getHours() + 1); // Minimum 1 hour duration
      return formatDateForInput(startDate);
    }
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return formatDateForInput(now);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Election</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className='mb-2'>Election Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Student Council Elections 2024"
              className='h-11'
              required
            />
          </div>

          <div>
            <Label htmlFor="description" className='mb-2'>Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the election"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="startAt" className='mb-2'>Start Date & Time</Label>
            <Input
              id="startAt"
              type="datetime-local"
              value={formData.startAt}
              onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
              min={getMinStartDate()}
              className='h-11'
              required
            />
            <p className="text-xs text-muted-foreground mt-1">When voting should begin</p>
          </div>

          <div>
            <Label htmlFor="endAt" className='mb-2'>End Date & Time</Label>
            <Input
              id="endAt"
              type="datetime-local"
              value={formData.endAt}
              onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
              min={getMinEndDate()}
              className='h-11voter upload'
              required
            />
            <p className="text-xs text-muted-foreground mt-1">When voting should end</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Election'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
