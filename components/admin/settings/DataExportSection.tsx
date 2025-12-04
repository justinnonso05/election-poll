'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, FileText, Users, Vote } from 'lucide-react';
import { toast } from 'sonner';
import type { Election } from '@prisma/client';

interface DataExportSectionProps {
  election: Election;
  voterCount: number;
}

export default function DataExportSection({ election, voterCount }: DataExportSectionProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (type: string) => {
    setLoading(type);
    try {
      const response = await fetch(`/api/election/${election.id}/export?type=${type}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${election.title}-${type}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`${type} data exported successfully`);
      } else {
        toast.error('Failed to export data');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Data Export</h3>
        <p className="text-muted-foreground">Download election data for analysis or backup</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow shadow-none"
          onClick={() => handleExport('results')}
        >
          <CardContent className="p-4 text-center">
            <Vote className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h4 className="font-medium mb-1">Election Results</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Complete voting results with candidate votes
            </p>
            <Button size="sm" disabled={loading === 'results'} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              {loading === 'results' ? 'Exporting...' : 'Export CSV'}
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow shadow-none"
          onClick={() => handleExport('voters')}
        >
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h4 className="font-medium mb-1">Voter List</h4>
            <p className="text-sm text-muted-foreground mb-3">
              All registered voters ({voterCount} total)
            </p>
            <Button size="sm" disabled={loading === 'voters'} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              {loading === 'voters' ? 'Exporting...' : 'Export CSV'}
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow shadow-none"
          onClick={() => handleExport('candidates')}
        >
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h4 className="font-medium mb-1">Candidates</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Candidate information and manifestos
            </p>
            <Button size="sm" disabled={loading === 'candidates'} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              {loading === 'candidates' ? 'Exporting...' : 'Export CSV'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
