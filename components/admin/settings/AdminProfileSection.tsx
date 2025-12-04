'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Admin } from '@prisma/client'; // Add this import

interface AdminProfileSectionProps {
  admin: Admin;
}

export default function AdminProfileSection({ admin }: AdminProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: admin.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSave = async () => {
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Only include fields that have values
      const payload: {
        email: string;
        newPassword?: string;
        confirmPassword?: string;
        currentPassword?: string;
      } = { email: formData.email };
      if (formData.newPassword) {
        payload.newPassword = formData.newPassword;
        payload.confirmPassword = formData.confirmPassword;
        payload.currentPassword = formData.currentPassword;
      }

      const response = await fetch('/api/admin/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      } else {
        toast.error('Failed to update profile');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      email: admin.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Profile Information</h3>
          <p className="text-muted-foreground">Update your account details and password</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={admin.role === 'SUPERADMIN' ? 'default' : 'secondary'}>
            {admin.role}
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

      <div className="grid gap-4 max-w-md">
        <div>
          <Label htmlFor="email" className="mb-2">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            disabled={!isEditing}
          />
        </div>

        {isEditing && (
          <>
            <div>
              <Label htmlFor="currentPassword" className="mb-2">
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))
                }
                placeholder="Enter current password to make changes"
              />
            </div>

            <div>
              <Label htmlFor="newPassword" className="mb-2">
                New Password (optional)
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="mb-2">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                placeholder="Confirm your new password"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
