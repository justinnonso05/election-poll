'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Save, X, RefreshCw, Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import type { Voter } from '@prisma/client'; // Add this import

interface VoterDetailModalProps {
  voter: Voter | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (voter: Voter) => void;
}

export default function VoterDetailModal({
  voter,
  open,
  onClose,
  onUpdate,
}: VoterDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    level: '',
    studentId: '',
  });

  // Update form data when voter changes
  useEffect(() => {
    if (voter) {
      setFormData({
        first_name: voter.first_name || '',
        last_name: voter.last_name || '',
        email: voter.email || '',
        level: voter.level || '',
        studentId: voter.studentId || '',
      });
    }
  }, [voter]);

  const handleSave = async () => {
    if (!voter) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/voters/${voter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        onUpdate(result.data);
        setIsEditing(false);
        toast.success(result.message || 'Voter updated successfully');
      } else {
        toast.error(result.message || 'Failed to update voter');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleRegeneratePassword = async () => {
    if (!voter) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/voters/${voter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regeneratePassword: true }),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        onUpdate(result.data);
        toast.success(result.message || 'Password regenerated successfully');
      } else {
        toast.error(result.message || 'Failed to regenerate password');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = () => {
    // TODO: Implement send notification API call
    toast.success('Credentials sent to voter');
  };

  const handleCancel = () => {
    if (voter) {
      setFormData({
        first_name: voter.first_name || '',
        last_name: voter.last_name || '',
        email: voter.email || '',
        level: voter.level || '',
        studentId: voter.studentId || '',
      });
    }
    setIsEditing(false);
  };

  if (!voter) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Voter Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Basic Information</CardTitle>

                <div className="flex items-center gap-2">
                  <Badge variant={voter.hasVoted ? 'default' : 'secondary'}>
                    {voter.hasVoted ? 'Voted' : 'Not Voted'}
                  </Badge>

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="mb-2">
                    First Name
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, first_name: e.target.value }))
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="last_name" className="mb-2">
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, last_name: e.target.value }))
                    }
                    disabled={!isEditing}
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
                  disabled={!isEditing}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studentId" className="mb-2">
                    Student ID
                  </Label>
                  <Input
                    id="studentId"
                    value={formData.studentId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, studentId: e.target.value }))
                    }
                    disabled={!isEditing}
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
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credentials Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Login Credentials</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2">Username</Label>
                <Input value={voter.studentId} disabled />
              </div>

              <div>
                <Label className="mb-2">Password</Label>
                <div className="flex gap-2">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={voter.password}
                    disabled
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegeneratePassword}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleSendNotification}>
              <Mail className="h-4 w-4 mr-2" />
              Send Credentials
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
