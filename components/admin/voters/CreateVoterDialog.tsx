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
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface CreateVoterDialogProps {
  associationId: string;
}

export default function CreateVoterDialog({ associationId }: CreateVoterDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    level: '',
    studentId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/voters/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        toast.success(result.message || 'Voter created successfully');
        setOpen(false);
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          level: '',
          studentId: '',
        });
        window.location.reload();
      } else {
        toast.error(result.message || 'Failed to create voter');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Voter
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Voter</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name" className="mb-2">
                First Name
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
                className="h-11"
                required
              />
            </div>

            <div>
              <Label htmlFor="last_name" className="mb-2">
                Last Name
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
                className="h-11"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="mb-2">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              className="h-11"
              required
            />
          </div>

          <div>
            <Label htmlFor="level" className="mb-2">
              Level
            </Label>
            <Input
              id="level"
              value={formData.level}
              onChange={(e) => setFormData((prev) => ({ ...prev, level: e.target.value }))}
              className="h-11"
              placeholder="e.g. 100, 200, 300"
              required
            />
          </div>

          <div>
            <Label htmlFor="studentId" className="mb-2">
              Student ID (Matric Number)
            </Label>
            <Input
              id="studentId"
              value={formData.studentId}
              onChange={(e) => setFormData((prev) => ({ ...prev, studentId: e.target.value }))}
              className="h-11"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" className="h-11" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 h-11">
              {loading ? 'Creating...' : 'Create Voter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
