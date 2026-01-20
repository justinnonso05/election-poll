'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DownloadResultsPDFProps {
  electionId: string;
  electionTitle: string;
  associationName: string;
}

export default function DownloadResultsPDF({
  electionId,
  electionTitle,
  associationName,
}: DownloadResultsPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);

    try {
      const loadingToast = toast.loading('Generating PDF...');

      const response = await fetch(
        `/api/election/${electionId}/export?type=results&format=pdf`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;

        const fileName = `${associationName.replace(/\s+/g, '_')}_${electionTitle.replace(/\s+/g, '_')}_Results.pdf`;

        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.dismiss(loadingToast);
        toast.success('PDF downloaded successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Something went wrong during PDF generation');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isGenerating}
      variant="default"
      size="lg"
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Download Results PDF
        </>
      )}
    </Button>
  );
}
