'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Vote,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileText,
  FileType2,
  Plus,
} from 'lucide-react';
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
import CreateCandidateDialog from './CreateCandidateDialog';
import CandidateDetailModal from './CandidateDetailModal';

interface Candidate {
  id: string;
  name: string;
  manifesto: string | null;
  photoUrl: string | null;
  election: {
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    isActive: boolean;
  };
  position: {
    id: string;
    name: string;
    order: number;
  };
  _count: {
    votes: number;
  };
}

interface Election {
  id: string;
  title: string;
}

interface Position {
  id: string;
  name: string;
  order: number;
  maxCandidates: number;
  _count: {
    candidates: number;
  };
}

interface CandidatesTableProps {
  candidates: Candidate[];
  elections: Election[];
  positions: Position[];
}

export default function CandidatesTable({
  candidates: initialCandidates,
  elections,
  positions,
}: CandidatesTableProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedElection, setSelectedElection] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);

  // Pagination - Reduced for mobile
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filter candidates
  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.position.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.election.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesElection =
      selectedElection === 'all' || candidate.election.id === selectedElection;

    return matchesSearch && matchesElection;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCandidates = filteredCandidates.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedElection]);

  const fetchCandidates = async (electionId?: string) => {
    try {
      const url = electionId ? `/api/candidates?electionId=${electionId}` : '/api/candidates';
      const response = await fetch(url);
      const result = await response.json();

      if (response.ok && result.status === 'success') {
        setCandidates(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    }
  };

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowDetailModal(true);
  };

  const handleUpdateCandidate = (updatedCandidate: Candidate) => {
    setCandidates((prev) => prev.map((c) => (c.id === updatedCandidate.id ? updatedCandidate : c)));
  };

  const handleDeleteClick = (candidate: Candidate) => {
    setCandidateToDelete(candidate);
    setShowDeleteDialog(true);
  };

  const handleDeleteCandidate = async () => {
    if (!candidateToDelete) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/candidates/${candidateToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        toast.success('Candidate deleted successfully');
        setCandidates((prev) => prev.filter((c) => c.id !== candidateToDelete.id));
        setShowDeleteDialog(false);
        setCandidateToDelete(null);
      } else {
        toast.error(result.message || 'Failed to delete candidate');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const canDeleteCandidate = candidateToDelete && candidateToDelete._count.votes === 0;
  const currentElection = elections.length > 0 ? elections[0] : null;

  // State for manifesto preview modal
  const [showManifestoModal, setShowManifestoModal] = useState(false);
  const [manifestoUrl, setManifestoUrl] = useState<string | null>(null);

  // "Warm up" the manifesto file before showing the iframe
  useEffect(() => {
    if (showManifestoModal && manifestoUrl && manifestoUrl.startsWith('http')) {
      fetch(manifestoUrl, { method: 'GET', mode: 'no-cors' }).catch(() => {});
    }
  }, [showManifestoModal, manifestoUrl]);

  // Helper to get file type icon
  const getManifestoIcon = (url: string) => {
    if (!url) return null;
    if (url.endsWith('.pdf')) return <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />;
    if (url.endsWith('.doc') || url.endsWith('.docx'))
      return <FileType2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />;
    return <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />;
  };

  return (
    <>
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg sm:text-xl">
              Candidates ({filteredCandidates.length})
            </CardTitle>
            {currentElection ? (
              <CreateCandidateDialog
                election={currentElection}
                positions={positions} // Pass positions here
                onCandidateCreated={() => fetchCandidates(currentElection.id)}
                trigger={
                  <Button size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Candidate</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                }
              />
            ) : (
              <span className="text-muted-foreground text-xs sm:text-sm">No election available</span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {/* Search Filter */}
          <div className="px-4 sm:px-0 mb-4 sm:mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden">
            <div className="space-y-3 p-4">
              {currentCandidates
                .sort((a, b) => a.position.order - b.position.order)
                .map((candidate) => (
                  <Card key={candidate.id} className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={candidate.photoUrl || undefined} alt={candidate.name} />
                            <AvatarFallback className="text-xs">
                              {getInitials(candidate.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{candidate.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {candidate.position.name}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Vote className="h-3 w-3" />
                                <span>{candidate._count.votes}</span>
                              </div>
                            </div>
                            {candidate.manifesto && (
                              <div className="mt-2">
                                {candidate.manifesto.startsWith('http') ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => {
                                      setManifestoUrl(candidate.manifesto);
                                      setShowManifestoModal(true);
                                    }}
                                  >
                                    {getManifestoIcon(candidate.manifesto)}
                                    <span className="ml-1">View Manifesto</span>
                                  </Button>
                                ) : (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {candidate.manifesto}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCandidate(candidate)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewCandidate(candidate)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(candidate)}
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
                  <TableHead>Candidate</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="hidden lg:table-cell">Votes</TableHead>
                  <TableHead className="hidden md:table-cell">Manifesto</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentCandidates
                  .sort((a, b) => a.position.order - b.position.order)
                  .map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={candidate.photoUrl || undefined} alt={candidate.name} />
                            <AvatarFallback className="text-xs">
                              {getInitials(candidate.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{candidate.name}</div>
                            <div className="lg:hidden flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Vote className="h-3 w-3" />
                              <span>{candidate._count.votes} votes</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {candidate.position.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <Vote className="h-4 w-4 text-muted-foreground" />
                          <span>{candidate._count.votes}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {candidate.manifesto && candidate.manifesto.startsWith('http') ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2 h-8"
                            onClick={() => {
                              setManifestoUrl(candidate.manifesto);
                              setShowManifestoModal(true);
                            }}
                            title="View Manifesto"
                          >
                            {getManifestoIcon(candidate.manifesto)}
                            <span className="sr-only">View Manifesto</span>
                          </Button>
                        ) : (
                          <div className="text-sm text-muted-foreground max-w-xs truncate">
                            {candidate.manifesto || 'No manifesto'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={loading} className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCandidate(candidate)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewCandidate(candidate)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Candidate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(candidate)}
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

          {currentCandidates.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                {searchTerm || selectedElection !== 'all'
                  ? 'No candidates found matching your criteria'
                  : 'No candidates found'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 sm:px-0">
              <div className="text-xs sm:text-sm text-muted-foreground">
                <span className="hidden sm:inline">Showing </span>
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCandidates.length)} of{' '}
                {filteredCandidates.length}
                <span className="hidden sm:inline"> candidates</span>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2 sm:px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Previous</span>
                </Button>

                <span className="text-xs sm:text-sm px-2">
                  <span className="hidden sm:inline">Page </span>
                  {currentPage}
                  <span className="hidden sm:inline"> of {totalPages}</span>
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2 sm:px-3"
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              {canDeleteCandidate ? (
                <>
                  <Trash2 className="h-5 w-5 text-destructive" />
                  Delete Candidate
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Cannot Delete Candidate
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {canDeleteCandidate ? (
                <>
                  Are you sure you want to delete <strong>{candidateToDelete?.name}</strong>? This
                  action cannot be undone.
                </>
              ) : (
                <>
                  Cannot delete <strong>{candidateToDelete?.name}</strong> because they have
                  received{' '}
                  <strong>
                    {candidateToDelete?._count.votes} vote
                    {candidateToDelete?._count.votes !== 1 ? 's' : ''}
                  </strong>
                  .
                  <br />
                  <br />
                  Candidates who have received votes cannot be deleted to maintain election
                  integrity.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setCandidateToDelete(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            {canDeleteCandidate && (
              <Button
                variant="destructive"
                onClick={handleDeleteCandidate}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? 'Deleting...' : 'Delete Candidate'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onUpdate={handleUpdateCandidate}
        positions={positions}
      />

      {/* Manifesto Preview Modal */}
      <Dialog open={showManifestoModal} onOpenChange={setShowManifestoModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Manifesto Preview</DialogTitle>
          </DialogHeader>
          {manifestoUrl ? (
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(manifestoUrl)}&embedded=true`}
              width="100%"
              height="500px"
              frameBorder="0"
              title="Manifesto Preview"
              className="rounded border"
            />
          ) : (
            <div className="text-muted-foreground text-center py-8 text-sm">No manifesto available</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
