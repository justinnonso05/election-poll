'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Trash2,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Shield,
  Users,
  ShieldCheck,
  Loader2,
  UserCircle2,
  Mail,
} from 'lucide-react';
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
  association: { name: string };
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

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<AdminCreate | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

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
    } catch {
      toast.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const deleteAdmin = async (adminId: string) => {
    try {
      const response = await fetch(`/api/admin/delete?id=${adminId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.status === 'success') {
        toast.success('Admin deleted successfully');
        fetchAdmins();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to delete admin');
    }
  };

  const updateAdminRole = async (adminId: string, newRole: 'ADMIN' | 'SUPERADMIN') => {
    setRoleUpdating(adminId);
    try {
      const response = await fetch('/api/admin/update-role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: adminId, role: newRole }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast.success('Admin role updated successfully');
        fetchAdmins();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to update admin role');
    } finally {
      setRoleUpdating(null);
    }
  };

  const copyCredentials = () => {
    if (createdAdmin) {
      navigator.clipboard.writeText(
        `Email: ${createdAdmin.email}\nPassword: ${createdAdmin.password}`
      );
      toast.success('Credentials copied to clipboard');
    }
  };

  const sendCredentialsEmail = async () => {
    if (!createdAdmin) return;
    setSendingEmail(true);
    try {
      const response = await fetch('/api/admin/send-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: createdAdmin.email,
          password: createdAdmin.password,
          role: createdAdmin.role,
        }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast.success('Credentials sent to email');
      } else {
        toast.error(data.message || 'Failed to send credentials');
      }
    } catch {
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleAdminCreated = (admin: AdminCreate) => {
    setCreatedAdmin(admin);
    setCreateDialogOpen(false);
    fetchAdmins();
  };

  const superAdminCount = admins.filter((a) => a.role === 'SUPERADMIN').length;
  const adminCount = admins.filter((a) => a.role === 'ADMIN').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading admins...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-3 sm:px-4 py-3 sm:py-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Manage Admins</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage administrator accounts for your association.
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto gap-2">
              <Plus className="h-4 w-4" />
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

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
              <p className="text-base sm:text-xl font-bold">{admins.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Superadmins</p>
              <p className="text-base sm:text-xl font-bold">{superAdminCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <UserCircle2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Admins</p>
              <p className="text-base sm:text-xl font-bold">{adminCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Admin Credentials Banner */}
      {createdAdmin && (
        <Card className="border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300 text-sm">
                  Admin created successfully
                </p>
                <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                  Save these credentials — the password won't be shown again.
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-green-700 dark:text-green-400 h-7"
                onClick={() => setCreatedAdmin(null)}
              >
                Dismiss
              </Button>
            </div>

            <Separator className="bg-green-200 dark:bg-green-800" />

            <div className="space-y-3">
              {/* Email */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                <span className="text-xs font-medium text-green-800 dark:text-green-300 w-16">Email</span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <code className="bg-white dark:bg-green-900/40 border border-green-200 dark:border-green-700 px-2.5 py-1.5 rounded text-xs flex-1 truncate">
                    {createdAdmin.email}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => navigator.clipboard.writeText(createdAdmin.email)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                <span className="text-xs font-medium text-green-800 dark:text-green-300 w-16">Password</span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <code className="bg-white dark:bg-green-900/40 border border-green-200 dark:border-green-700 px-2.5 py-1.5 rounded text-xs flex-1 truncate">
                    {showPassword ? createdAdmin.password : '••••••••••••'}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => navigator.clipboard.writeText(createdAdmin.password)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyCredentials} className="gap-2 text-xs flex-1 sm:flex-none">
                <Copy className="h-3.5 w-3.5" />
                Copy Both
              </Button>
              <Button 
                size="sm" 
                variant="default" 
                onClick={sendCredentialsEmail} 
                disabled={sendingEmail}
                className="gap-2 text-xs flex-1 sm:flex-none bg-green-700 hover:bg-green-800 text-white"
              >
                {sendingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                {sendingEmail ? 'Sending...' : 'Send to Email'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admins List */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground px-0.5">
          {admins.length} admin{admins.length !== 1 ? 's' : ''}
        </p>

        {admins.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">No admins yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first admin account to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          admins.map((admin) => (
            <Card key={admin.id}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
                      admin.role === 'SUPERADMIN'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {getInitials(admin.email)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium truncate max-w-[200px] sm:max-w-none">
                        {admin.email}
                      </p>
                      <Badge
                        variant={admin.role === 'SUPERADMIN' ? 'default' : 'secondary'}
                        className="text-xs shrink-0"
                      >
                        {admin.role === 'SUPERADMIN' ? 'Superadmin' : 'Admin'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{admin.association.name}</span>
                      <span>Joined {formatDate(admin.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {admin.role === 'ADMIN' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="hidden sm:flex gap-1.5 text-xs h-8"
                        onClick={() => updateAdminRole(admin.id, 'SUPERADMIN')}
                        disabled={roleUpdating === admin.id}
                      >
                        {roleUpdating === admin.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Shield className="h-3.5 w-3.5" />
                        )}
                        Promote
                      </Button>
                    )}

                    {/* Mobile-only promote icon button */}
                    {admin.role === 'ADMIN' && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="sm:hidden h-8 w-8"
                        onClick={() => updateAdminRole(admin.id, 'SUPERADMIN')}
                        disabled={roleUpdating === admin.id}
                      >
                        {roleUpdating === admin.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Shield className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Admin</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete <strong>{admin.email}</strong>? This action cannot be undone.
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
          ))
        )}
      </div>
    </div>
  );
}
