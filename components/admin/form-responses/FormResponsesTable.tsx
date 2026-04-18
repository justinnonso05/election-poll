'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MoreHorizontal,
  Send,
  UserPlus,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  Loader2,
  AlertTriangle,
  RefreshCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/timezone';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  matricNumber: string;
  level: string;
  position: { id: string; name: string };
  election: { id: string; title: string };
  receiptSentAt: string | null;
  addedAsCandidate: boolean;
  createdAt: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FormResponsesTable() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === 'SUPERADMIN';

  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null); // id or 'bulk'
  const [deleteTarget, setDeleteTarget] = useState<FormResponse | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const fetchResponses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/form-responses');
      const data = await res.json();
      if (data.status === 'success') {
        setResponses(data.data);
      } else {
        toast.error('Failed to load responses');
      }
    } catch {
      toast.error('Network error loading responses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  // ─── Filter ──────────────────────────────────────────────────────────────────

  const filtered = responses.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.firstName.toLowerCase().includes(q) ||
      r.lastName.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.matricNumber.toLowerCase().includes(q) ||
      r.position.name.toLowerCase().includes(q)
    );
  });

  // ─── Selection helpers ───────────────────────────────────────────────────────

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.id)));
    }
  };

  // ─── Per-row actions ─────────────────────────────────────────────────────────

  const sendReceipt = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/form-responses/${id}/send-receipt`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success('Receipt sent successfully');
        setResponses((prev) =>
          prev.map((r) => (r.id === id ? { ...r, receiptSentAt: new Date().toISOString() } : r))
        );
      } else {
        toast.error(data.message || 'Failed to send receipt');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(null);
    }
  };

  const addCandidate = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/form-responses/${id}/add-candidate`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success('Added to candidates');
        setResponses((prev) =>
          prev.map((r) => (r.id === id ? { ...r, addedAsCandidate: true } : r))
        );
      } else {
        toast.error(data.message || 'Failed to add candidate');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteOne = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/form-responses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success('Response deleted');
        setResponses((prev) => prev.filter((r) => r.id !== id));
        setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(null);
      setDeleteTarget(null);
    }
  };

  // ─── Bulk actions ────────────────────────────────────────────────────────────

  const bulkAction = async (action: 'send-receipts' | 'add-candidates' | 'delete') => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setActionLoading('bulk');
    try {
      const res = await fetch('/api/admin/form-responses/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message);
        await fetchResponses();
        setSelected(new Set());
      } else {
        toast.error(data.message || 'Bulk action failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(null);
      setBulkDeleteConfirm(false);
    }
  };

  // ─── Add all (not yet added) ─────────────────────────────────────────────────

  const addAll = async () => {
    const ids = responses.filter((r) => !r.addedAsCandidate).map((r) => r.id);
    if (ids.length === 0) {
      toast.info('All responses are already added as candidates');
      return;
    }
    setActionLoading('bulk');
    try {
      const res = await fetch('/api/admin/form-responses/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-candidates', ids }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(data.message);
        await fetchResponses();
      } else {
        toast.error(data.message || 'Failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const isBulkLoading = actionLoading === 'bulk';
  const hasSelection = selected.size > 0;

  return (
    <>
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl">
                Form Responses
                <Badge variant="secondary" className="ml-2 text-xs">
                  {filtered.length}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Candidate registration submissions
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchResponses}
                disabled={loading}
                className="h-8"
              >
                <RefreshCcw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={addAll}
                disabled={isBulkLoading}
                className="h-8"
              >
                <UserCheck className="h-3.5 w-3.5 mr-1" />
                Add All to Candidates
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-sm mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search responses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </CardHeader>

        {/* Bulk action bar */}
        {hasSelection && (
          <div className="mx-4 sm:mx-6 mb-4 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-4 py-2.5">
            <span className="text-sm font-medium mr-1">{selected.size} selected</span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={isBulkLoading}
              onClick={() => bulkAction('send-receipts')}
            >
              <Send className="h-3 w-3 mr-1" /> Send Receipt
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={isBulkLoading}
              onClick={() => bulkAction('add-candidates')}
            >
              <UserPlus className="h-3 w-3 mr-1" /> Add to Candidates
            </Button>
            {isSuperAdmin && (
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs"
                disabled={isBulkLoading}
                onClick={() => setBulkDeleteConfirm(true)}
              >
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            )}
            {isBulkLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-1" />}
          </div>
        )}

        <CardContent className="p-0 sm:px-6 sm:pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {search ? 'No responses match your search.' : 'No form responses yet.'}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selected.size === filtered.length && filtered.length > 0}
                          onCheckedChange={toggleAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email / Phone</TableHead>
                      <TableHead>Matric</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Candidate</TableHead>
                      <TableHead className="w-14">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id} className={selected.has(r.id) ? 'bg-muted/30' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(r.id)}
                            onCheckedChange={() => toggleOne(r.id)}
                            aria-label={`Select ${r.firstName}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{r.firstName} {r.lastName}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">{r.email}</div>
                          <div className="text-xs text-muted-foreground">{r.phone}</div>
                        </TableCell>
                        <TableCell className="text-sm">{r.matricNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{r.level}L</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{r.position.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(r.createdAt)}
                        </TableCell>
                        <TableCell>
                          {r.receiptSentAt ? (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              Sent
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-300">
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {r.addedAsCandidate ? (
                            <Badge className="text-xs gap-1 bg-green-100 text-green-700 hover:bg-green-100 border-green-200 border">
                              <CheckCircle2 className="h-3 w-3" />
                              Added
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Not added
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                disabled={actionLoading === r.id}
                              >
                                {actionLoading === r.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => sendReceipt(r.id)}>
                                <Send className="h-4 w-4 mr-2" /> Send Receipt
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => addCandidate(r.id)}
                                disabled={r.addedAsCandidate}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                {r.addedAsCandidate ? 'Already Added' : 'Add to Candidates'}
                              </DropdownMenuItem>
                              {isSuperAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setDeleteTarget(r)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3 p-4">
                {filtered.map((r) => (
                  <Card key={r.id} className={`border ${selected.has(r.id) ? 'border-primary' : 'border-border'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Checkbox
                            checked={selected.has(r.id)}
                            onCheckedChange={() => toggleOne(r.id)}
                            className="mt-0.5 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{r.firstName} {r.lastName}</div>
                            <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <Badge variant="outline" className="text-xs">{r.level}L</Badge>
                              <Badge variant="outline" className="text-xs">{r.position.name}</Badge>
                              {r.receiptSentAt ? (
                                <Badge variant="secondary" className="text-xs gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-600" /> Sent
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                  Pending
                                </Badge>
                              )}
                              {r.addedAsCandidate && (
                                <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100 border-green-200 border">
                                  Added
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0" disabled={actionLoading === r.id}>
                              {actionLoading === r.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => sendReceipt(r.id)}>
                              <Send className="h-4 w-4 mr-2" /> Send Receipt
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => addCandidate(r.id)} disabled={r.addedAsCandidate}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              {r.addedAsCandidate ? 'Already Added' : 'Add to Candidates'}
                            </DropdownMenuItem>
                            {isSuperAdmin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(r)}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Single Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Response
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the response from{' '}
              <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={actionLoading === deleteTarget?.id}
              onClick={() => deleteTarget && deleteOne(deleteTarget.id)}
            >
              {actionLoading === deleteTarget?.id ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Deleting…</>
              ) : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirm Dialog */}
      <Dialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Delete {selected.size} Responses
            </DialogTitle>
            <DialogDescription>
              This will permanently delete {selected.size} selected response(s). This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBulkDeleteConfirm(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={isBulkLoading}
              onClick={() => bulkAction('delete')}
            >
              {isBulkLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Deleting…</>
              ) : `Delete ${selected.size}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
