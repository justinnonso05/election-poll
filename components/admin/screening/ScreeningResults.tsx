'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, RefreshCw } from 'lucide-react';
import { getComputedResults } from '@/app/actions/screening-actions';
import { toast } from 'sonner';

export default function ScreeningResults({ election }: { election: any }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleCompute = async () => {
    try {
      setLoading(true);
      const res = await getComputedResults(election.id);
      setResults(res);
      toast.success('Results computed successfully');
    } catch (error: any) {
      toast.error('Error computing results', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExportBlank = () => {
    window.open(`/api/screening/${election.id}/export-blank`, '_blank');
  };

  const handleExportResults = () => {
    window.open(`/api/screening/${election.id}/export-results`, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Screening Processing</CardTitle>
          <CardDescription>
            Compute final screening scores by averaging the submissions from all admins.
            You can also export a blank scoring sheet for manual offline scoring.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={handleCompute} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Compute Scores
            </Button>
            <Button variant="outline" onClick={handleExportBlank}>
              <FileText className="h-4 w-4 mr-2" />
              Download Blank Sheet
            </Button>
            <Button variant="secondary" onClick={handleExportResults} disabled={results.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export Final Results PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Computed Results Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Average Score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.position}</TableCell>
                    <TableCell>{r.totalScore.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={r.isQualified ? 'default' : 'destructive'}>
                        {r.isQualified ? 'Qualified' : 'Not Qualified'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
