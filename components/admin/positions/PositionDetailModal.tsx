'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Save, X, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Position {
  id: string;
  name: string;
  description: string | null; // Change from undefined to null
  order: number;
  maxCandidates: number;
  _count: {
    candidates: number;
  };
}

interface PositionDetailModalProps {
  position: Position | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (position: Position) => void;
}

export default function PositionDetailModal({
  position,
  open,
  onClose,
  onUpdate,
}: PositionDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 0,
    maxCandidates: 10,
  });

  useEffect(() => {
    if (position) {
      setFormData({
        name: position.name || '',
        description: position.description || '', // Handle null
        order: position.order || 0,
        maxCandidates: position.maxCandidates || 10,
      });
    }
  }, [position]);

  const handleSave = async () => {
    if (!position) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/positions/${position.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        onUpdate({ ...position, ...result.data });
        setIsEditing(false);
        toast.success(result.message || 'Position updated successfully');
      } else {
        toast.error(result.message || 'Failed to update position');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (position) {
      setFormData({
        name: position.name || '',
        description: position.description || '', // Handle null
        order: position.order || 0,
        maxCandidates: position.maxCandidates || 10,
      });
    }
    setIsEditing(false);
  };

  if (!position) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Position Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Basic Information</CardTitle>

                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="mb-2">
                  Position Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="description" className="mb-2">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  disabled={!isEditing}
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
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))
                    }
                    disabled={!isEditing}
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
                    value={formData.maxCandidates}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxCandidates: parseInt(e.target.value) || 10,
                      }))
                    }
                    disabled={!isEditing}
                    min="1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Current Candidates</span>
                </div>
                <span className="font-medium">
                  {position._count.candidates} / {position.maxCandidates}
                </span>
              </div>

              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{
                    width: `${Math.min(100, (position._count.candidates / position.maxCandidates) * 100)}%`,
                  }}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                {position.maxCandidates - position._count.candidates} slots remaining
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
