'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Copy, Eye, EyeOff, Shield } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CreateAdminForm } from '@/components/admin/CreateAdminForm';

interface Admin {
  id: string;
  email: string;
  role: 'ADMIN' | 'SUPERADMIN';
  associationId: string;
  association: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminCreate {
  id: string;
  email: string;
  role: string;
  associationId: string;
  password: string;
}

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<AdminCreate | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin/list');
      const data = await response.json();
      if (data.status === 'success') {
        setAdmins(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const deleteAdmin = async (adminId: string) => {
    try {
      const response = await fetch(`/api/admin/delete?id=${adminId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast.success('Admin deleted successfully');
        fetchAdmins();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to delete admin');
    }
  };

  const updateAdminRole = async (adminId: string, newRole: 'ADMIN' | 'SUPERADMIN') => {
    try {
      const response = await fetch('/api/admin/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: adminId, role: newRole }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast.success('Admin role updated successfully');
        fetchAdmins();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update admin role');
    }
  };

  const copyCredentials = () => {
    if (createdAdmin) {
      const credentials = `Email: ${createdAdmin.email}\nPassword: ${createdAdmin.password}`;
      navigator.clipboard.writeText(credentials);
      toast.success('Credentials copied to clipboard');
    }
  };

  const handleAdminCreated = (admin: AdminCreate) => {
    setCreatedAdmin(admin);
    setCreateDialogOpen(false);
    fetchAdmins();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Admins</h1>
          <p className="text-muted-foreground">Create and manage admin accounts</p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Admin</DialogTitle>
            </DialogHeader>
            <CreateAdminForm onSuccess={handleAdminCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Created Admin Credentials Dialog */}
      {createdAdmin && (
        <Card className="border-green-200 bg-background-50">
          <CardHeader>
            <CardTitle className="text-green-800">Admin Created Successfully!</CardTitle>
            <CardDescription>
              Share these credentials with the admin. They will not be shown again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm font-medium">Email:</label>
                <div className="flex items-center space-x-2">
                  <code className="bg-background border px-2 py-1 rounded text-sm">{createdAdmin.email}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigator.clipboard.writeText(createdAdmin.email)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Password:</label>
                <div className="flex items-center space-x-2">
                  <code className="bg-background border px-2 py-1 rounded text-sm">
                    {showPassword ? createdAdmin.password : '••••••••••••'}
                  </code>
                  <Button size="sm" variant="ghost" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigator.clipboard.writeText(createdAdmin.password)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={copyCredentials} variant="outline" size="sm">
                <Copy className="mr-2 h-4 w-4" />
                Copy Both
              </Button>
              <Button onClick={() => setCreatedAdmin(null)} variant="ghost" size="sm">
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admins List */}
      <div className="grid gap-4">
        {admins.map((admin) => (
          <Card key={admin.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-medium">{admin.email}</h3>
                    <p className="text-sm text-muted-foreground">{admin.association.name}</p>
                  </div>
                  <Badge variant={admin.role === 'SUPERADMIN' ? 'default' : 'secondary'}>
                    {admin.role}
                  </Badge>
                </div>

                <div className="flex items-center space-x-2">
                  {admin.role === 'ADMIN' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateAdminRole(admin.id, 'SUPERADMIN')}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Make Superadmin
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Admin</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {admin.email}? This action cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteAdmin(admin.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {admins.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No admins found. Create your first admin to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
