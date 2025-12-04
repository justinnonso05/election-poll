'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export interface CreatePositionDialogProps {
  onPositionCreated: () => Promise<void>;
  trigger: React.ReactElement;
}

export default function CreatePositionDialog({
  onPositionCreated,
  trigger,
}: CreatePositionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 1,
    maxCandidates: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        toast.success(result.message || 'Position created successfully');
        setOpen(false);
        setFormData({
          name: '',
          description: '',
          order: 1,
          maxCandidates: 1,
        });
        onPositionCreated?.();
      } else {
        toast.error(result.message || 'Failed to create position');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="mx-4 sm:mx-0 max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Position</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="mb-2">
              Position Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. President, Vice President"
              className='h-11'
              required
            />
          </div>

          <div>
            <Label htmlFor="description" className="mb-2">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the position"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="order" className="mb-2">
                Display Order
              </Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                className='h-11'
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))
                }
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="maxCandidates" className="mb-2">
                Max Candidates
              </Label>
              <Input
                id="maxCandidates"
                type="number"
                className='h-11'
                value={formData.maxCandidates}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxCandidates: parseInt(e.target.value) || 10,
                  }))
                }
                min="1"
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Position'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
