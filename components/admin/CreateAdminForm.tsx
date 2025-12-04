'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { AdminCreate } from '@/app/admin/manage-admins/page';

interface CreateAdminFormProps {
  onSuccess: (admin: AdminCreate) => void;
}

export function CreateAdminForm({ onSuccess }: CreateAdminFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'ADMIN',
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      // Fix: Check for 'status' instead of 'success'
      if (data.status === 'success') {
        toast.success('Admin created successfully');
        onSuccess({ ...data.data, password: formData.password });
        setFormData({ email: '', password: '', role: 'ADMIN' });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email" className="mb-2">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="password" className="mb-2">
          Password
        </Label>
        <div className="flex space-x-2">
          <Input
            id="password"
            type="text"
            value={formData.password}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
          <Button type="button" variant="outline" onClick={generatePassword}>
            Generate
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="role" className="mb-2">
          Role
        </Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating...' : 'Create Admin'}
      </Button>
    </form>
  );
}
