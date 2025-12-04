'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, MoreHorizontal, Users, Eye, AlertTriangle, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import CreatePositionDialog from './CreatePositionDialog';
import PositionDetailModal from './PositionDetailModal';

interface Position {
  id: string;
  name: string;
  description: string | null;
  order: number;
  maxCandidates: number;
  _count: {
    candidates: number;
  };
}

interface PositionsTableProps {
  positions: Position[];
}

export default function PositionsTable({ positions: initialPositions }: PositionsTableProps) {
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [loading, setLoading] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/positions');
      const result = await response.json();

      if (response.ok && result.status === 'success') {
        setPositions(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    }
  };

  const handleViewPosition = (position: Position) => {
    setSelectedPosition(position);
    setShowDetailModal(true);
  };

  const handleUpdatePosition = (updatedPosition: Position) => {
    setPositions((prev) => prev.map((p) => (p.id === updatedPosition.id ? updatedPosition : p)));
  };

  const handleDeleteClick = (position: Position) => {
    setPositionToDelete(position);
    setShowDeleteDialog(true);
  };

  const handleDeletePosition = async () => {
    if (!positionToDelete) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/positions/${positionToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        toast.success('Position deleted successfully');
        setPositions((prev) => prev.filter((p) => p.id !== positionToDelete.id));
        setShowDeleteDialog(false);
        setPositionToDelete(null);
      } else {
        toast.error(result.message || 'Failed to delete position');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const canDeletePosition = positionToDelete && positionToDelete._count.candidates === 0;

  return (
    <>
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg sm:text-xl">
              Electoral Positions ({positions.length})
            </CardTitle>
            <CreatePositionDialog 
              onPositionCreated={fetchPositions}
              trigger={
                <Button size="sm" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add Position</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              }
            />
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            <div className="space-y-3 p-4">
              {positions
                .sort((a, b) => a.order - b.order)
                .map((position) => (
                  <Card key={position.id} className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Position Name and Order */}
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              #{position.order}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {position.name}
                              </div>
                              {position.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {position.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{position._count.candidates} candidates</span>
                            </div>
                            <div>
                              Max: {position.maxCandidates}
                            </div>
                          </div>
                        </div>

                        {/* Actions Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewPosition(position)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewPosition(position)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(position)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Order</TableHead>
                  <TableHead>Position Name</TableHead>
                  <TableHead className="hidden lg:table-cell">Description</TableHead>
                  <TableHead>Candidates</TableHead>
                  <TableHead className="hidden md:table-cell">Max</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {positions
                  .sort((a, b) => a.order - b.order)
                  .map((position) => (
                    <TableRow key={position.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">#{position.order}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{position.name}</div>
                          {position.description && (
                            <div className="text-sm text-muted-foreground truncate lg:hidden mt-1">
                              {position.description}
                            </div>
                          )}
                          <div className="md:hidden flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            Max: {position.maxCandidates}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {position.description || 'No description'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{position._count.candidates}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {position.maxCandidates}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={loading} className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewPosition(position)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewPosition(position)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Position
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(position)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {positions.length === 0 && (
            <div className="text-center py-8 px-4">
              <p className="text-muted-foreground text-sm">No positions found</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Create your first electoral position to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              {canDeletePosition ? (
                <>
                  <Trash2 className="h-5 w-5 text-destructive" />
                  Delete Position
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Cannot Delete Position
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {canDeletePosition ? (
                <>
                  Are you sure you want to delete the position{' '}
                  <strong>{positionToDelete?.name}</strong>? This action cannot be undone.
                </>
              ) : (
                <>
                  Cannot delete the position <strong>{positionToDelete?.name}</strong> because it
                  has{' '}
                  <strong>
                    {positionToDelete?._count.candidates} candidate
                    {positionToDelete?._count.candidates !== 1 ? 's' : ''}
                  </strong>{' '}
                  assigned to it.
                  <br />
                  <br />
                  Please reassign or remove all candidates from this position before deleting it to
                  maintain election integrity.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setPositionToDelete(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            {canDeletePosition && (
              <Button 
                variant="destructive" 
                onClick={handleDeletePosition} 
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? 'Deleting...' : 'Delete Position'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Position Detail Modal */}
      <PositionDetailModal
        position={selectedPosition}
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onUpdate={handleUpdatePosition}
      />
    </>
  );
}
