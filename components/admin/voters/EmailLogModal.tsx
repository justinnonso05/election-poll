'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';

export interface LogEntry {
  message: string;
  status: 'pending' | 'success' | 'error';
  timestamp: number;
}

interface EmailLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logs: LogEntry[];
  isProcessing: boolean;
  onClose: () => void;
  summary?: { total: number; successful: number; failed: number };
}

export default function EmailLogModal({
  open,
  onOpenChange,
  logs,
  isProcessing,
  onClose,
  summary
}: EmailLogModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [logs]);

  return (
    <Dialog open={open} onOpenChange={(val) => {
      // Prevent closing while processing unless explicitly allowed
      if (!isProcessing) onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span>Sending Credentials...</span>
              </>
            ) : (
              <span>Process Complete</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="border rounded-md bg-slate-950 p-4">
          <ScrollArea className="h-[400px] w-full pr-4">
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start gap-3 text-sm font-mono">
                  <div className="mt-0.5 shrink-0">
                    {log.status === 'pending' && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    )}
                    {log.status === 'success' && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {log.status === 'error' && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "break-all",
                      log.status === 'error' ? "text-red-400" :
                        log.status === 'success' ? "text-green-400" :
                          "text-blue-300"
                    )}
                  >
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        </div>

        {summary && !isProcessing && (
          <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg text-sm">
            <div className="flex gap-4">
              <span className="font-medium">Total: {summary.total}</span>
              <span className="text-green-600 font-medium">Success: {summary.successful}</span>
              {summary.failed > 0 && (
                <span className="text-red-600 font-medium">Failed: {summary.failed}</span>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} disabled={isProcessing}>
            {isProcessing ? 'Please Wait...' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
