'use client';

import { useEffect, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Eye, Mail, Trash2, MoreHorizontal, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import VoterDetailModal from './VoterDetailModal';
import { toast } from 'sonner';
import type { Voter } from '@prisma/client';

interface VotersTableProps {
  voters: Voter[];
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
}

export default function VotersTable({ voters: initialVoters }: VotersTableProps) {
  const [voters, setVoters] = useState<Voter[]>(initialVoters);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVoters, setSelectedVoters] = useState<string[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // Reduced for mobile

  const isMobile = useIsMobile();

  // Filter voters based on search term FIRST
  const filteredVoters = voters.filter(
    (voter) =>
      voter.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Then apply pagination to filtered results
  const totalPages = Math.ceil(filteredVoters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVoters = filteredVoters.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedVoters([]);
  }, [searchTerm]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVoters(currentVoters.map((voter) => voter.id));
    } else {
      setSelectedVoters([]);
    }
  };

  const handleSelectVoter = (voterId: string, checked: boolean) => {
    if (checked) {
      setSelectedVoters((prev) => [...prev, voterId]);
    } else {
      setSelectedVoters((prev) => prev.filter((id) => id !== voterId));
    }
  };

  const handleViewVoter = (voter: Voter) => {
    setSelectedVoter(voter);
    setShowDetailModal(true);
  };

  const handleSendNotification = (voterIds: string[]) => {
    toast.success(`Sending credentials to ${voterIds.length} voter(s)`);
  };

  const handleDeleteVoters = async (voterIds: string[]) => {
    if (!confirm(`Are you sure you want to delete ${voterIds.length} voter(s)?`)) return;

    try {
      let res;
      if (voterIds.length === 1) {
        res = await fetch(`/api/voters/${voterIds[0]}`, {
          method: 'DELETE',
        });
      } else {
        res = await fetch(`/api/voters/${voterIds[0]}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: voterIds }),
        });
      }
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Deleted ${voterIds.length} voter(s)`);
        setVoters((prev) => prev.filter((voter) => !voterIds.includes(voter.id)));
        setSelectedVoters([]);
      } else {
        toast.error(data.message || 'Failed to delete voters');
      }
    } catch (error) {
      toast.error('Failed to delete voters');
    }
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
    setSelectedVoters([]);
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    setSelectedVoters([]);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedVoters([]);
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Title */}
          <CardTitle className="text-lg sm:text-xl">
            All Voters ({filteredVoters.length})
          </CardTitle>

          {/* Search and Actions Row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search voters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Bulk Actions */}
            {selectedVoters.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendNotification(selectedVoters)}
                  className="w-full sm:w-auto"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Send Credentials</span>
                  <span className="sm:hidden">Send</span> ({selectedVoters.length})
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteVoters(selectedVoters)}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedVoters.length})
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 sm:p-6 sm:pt-0">
        {/* Mobile Card View */}
        <div className="block sm:hidden">
          <div className="space-y-3 p-4">
            {currentVoters.map((voter) => (
              <Card key={voter.id} className="border border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <Checkbox
                        checked={selectedVoters.includes(voter.id)}
                        onCheckedChange={(checked) => handleSelectVoter(voter.id, checked === true)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {voter.first_name} {voter.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {voter.email}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {voter.studentId}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            L{voter.level}
                          </Badge>
                          <Badge variant={voter.hasVoted ? 'default' : 'secondary'} className="text-xs">
                            {voter.hasVoted ? 'Voted' : 'Not Voted'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewVoter(voter)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendNotification([voter.id])}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Credentials
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteVoters([voter.id])}
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
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedVoters.length === currentVoters.length && currentVoters.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead className="hidden lg:table-cell">Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentVoters.map((voter) => (
                <TableRow key={voter.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedVoters.includes(voter.id)}
                      onCheckedChange={(checked) => handleSelectVoter(voter.id, checked === true)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {voter.first_name} {voter.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground truncate md:hidden">
                        {voter.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="truncate max-w-48">{voter.email}</div>
                  </TableCell>
                  <TableCell>{voter.studentId}</TableCell>
                  <TableCell className="hidden lg:table-cell">{voter.level}</TableCell>
                  <TableCell>
                    <Badge variant={voter.hasVoted ? 'default' : 'secondary'} className="text-xs">
                      {voter.hasVoted ? 'Voted' : 'Not Voted'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewVoter(voter)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendNotification([voter.id])}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Credentials
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteVoters([voter.id])}
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

        {currentVoters.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              {searchTerm ? 'No voters found matching your search' : 'No voters found'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 sm:px-0">
            <div className="text-xs sm:text-sm text-muted-foreground">
              <span className="hidden sm:inline">Showing </span>
              {startIndex + 1}-{Math.min(endIndex, filteredVoters.length)} of{' '}
              {filteredVoters.length}
              <span className="hidden sm:inline"> voters</span>
              {searchTerm && <span className="hidden sm:inline"> (filtered from {voters.length} total)</span>}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="h-8 px-2 sm:px-3"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Previous</span>
              </Button>

              {/* Page Numbers - Simplified for mobile */}
              <div className="flex items-center gap-1">
                {/* Show fewer pages on mobile */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Use isMobile instead of window.innerWidth
                    if (isMobile) {
                      return Math.abs(page - currentPage) <= 1;
                    }
                    // On desktop, show more pages
                    return (
                      page === currentPage ||
                      page === currentPage - 1 ||
                      page === currentPage + 1 ||
                      (currentPage <= 3 && page <= 5) ||
                      (currentPage >= totalPages - 2 && page >= totalPages - 4)
                    );
                  })
                  .map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
              </div>

              {/* Next Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
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

      {/* Voter Detail Modal */}
      <VoterDetailModal
        voter={selectedVoter}
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onUpdate={(updatedVoter) => {
          setVoters((prev) => prev.map((v) => (v.id === updatedVoter.id ? updatedVoter : v)));
        }}
      />
    </Card>
  );
}
