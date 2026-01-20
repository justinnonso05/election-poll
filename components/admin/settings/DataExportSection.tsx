'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Users, Vote, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import type { Election } from '@prisma/client';

interface DataExportSectionProps {
  election: Election;
  voterCount: number;
}

export default function DataExportSection({ election, voterCount }: DataExportSectionProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (type: string, format: 'csv' | 'pdf') => {
    const loadingKey = `${type}-${format}`;
    setLoading(loadingKey);

    try {
      const response = await fetch(
        `/api/election/${election.id}/export?type=${type}&format=${format}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;

        const fileExtension = format === 'pdf' ? 'pdf' : 'csv';
        const fileName = `${election.title.replace(/\s+/g, '_')}_${type}_${new Date().toISOString().split('T')[0]}.${fileExtension}`;

        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success(`${type} exported as ${format.toUpperCase()} successfully`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to export data');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Something went wrong during export');
    } finally {
      setLoading(null);
    }
  };

  const exportCards = [
    {
      type: 'results',
      icon: Vote,
      title: 'Election Results',
      description: 'Complete voting results with candidate votes',
    },
    {
      type: 'voters',
      icon: Users,
      title: 'Voter List',
      description: `All registered voters (${voterCount} total)`,
    },
    {
      type: 'candidates',
      icon: FileText,
      title: 'Candidates',
      description: 'Candidate information and manifestos',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Data Export</h3>
        <p className="text-muted-foreground">Download election data for analysis or backup</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {exportCards.map(({ type, icon: Icon, title, description }) => (
          <Card key={type} className="shadow-none hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium mb-1">{title}</h4>
              <p className="text-sm text-muted-foreground mb-3">{description}</p>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={loading?.startsWith(type)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {loading?.startsWith(type) ? 'Exporting...' : 'Export'}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  <DropdownMenuItem
                    onClick={() => handleExport(type, 'pdf')}
                    disabled={loading === `${type}-pdf`}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExport(type, 'csv')}
                    disabled={loading === `${type}-csv`}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
