'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, AlertTriangle, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { Election } from '@prisma/client';

// Extend Election type to include _count if needed
type ElectionWithCounts = Election & {
  _count?: {
    candidates?: number;
    votes?: number;
  };
};

interface DangerZoneSectionProps {
  election: ElectionWithCounts;
}

export default function DangerZoneSection({ election }: DangerZoneSectionProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exportBeforeDelete, setExportBeforeDelete] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) {
      toast.error('Please confirm deletion by checking the checkbox');
      return;
    }

    setLoading(true);

    try {
      // Export data first if requested
      if (exportBeforeDelete) {
        const response = await fetch(`/api/election/${election.id}/export?type=all`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `${election.title}-complete-backup-${new Date().toISOString().split('T')[0]}.zip`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
        }
      }

      // Delete the election
      const deleteResponse = await fetch(`/api/election/${election.id}`, {
        method: 'DELETE',
      });

      if (deleteResponse.ok) {
        toast.success('Election deleted successfully');
        setShowDeleteDialog(false);
        window.location.reload();
      } else {
        toast.error('Failed to delete election');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
          <p className="text-muted-foreground">
            Irreversible actions that affect your election data
          </p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Deleting an election will permanently remove all associated data including votes,
            candidates, and voter records. This action cannot be undone.
          </AlertDescription>
        </Alert>

        <div className="flex justify-start">
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Election
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Election</DialogTitle>
            <DialogDescription>
              You are about to permanently delete &quot;{election.title}&quot; and all associated
              data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will delete:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All votes cast ({election._count?.votes || 0} votes)</li>
                  <li>All candidates ({election._count?.candidates || 0} candidates)</li>
                  <li>All voter records</li>
                  <li>Election settings and data</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="export"
                  checked={exportBeforeDelete}
                  onCheckedChange={(checked) => setExportBeforeDelete(checked === true)}
                />
                <label htmlFor="export" className="text-sm">
                  <Download className="h-4 w-4 inline mr-1" />
                  Export all data before deleting
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirm"
                  checked={confirmDelete}
                  onCheckedChange={(checked) => setConfirmDelete(checked === true)}
                />
                <label htmlFor="confirm" className="text-sm">
                  I understand this action cannot be undone
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!confirmDelete || loading}
                className="flex-1"
              >
                {loading ? 'Deleting...' : 'Delete Election'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
