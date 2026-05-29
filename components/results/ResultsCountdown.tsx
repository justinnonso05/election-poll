'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Timer, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function ResultsCountdown({ endAt }: { endAt: string }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const targetDate = new Date(endAt).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setIsFinished(true);
        setTimeLeft(null);
      } else {
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        // Add days to hours if more than 24 hours
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        
        setTimeLeft({
          hours: hours + (days * 24),
          minutes,
          seconds
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [endAt]);

  const handleReload = () => {
    window.location.reload();
  };

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center shadow-md">
        <CardContent className="pt-8 pb-8 px-6">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold mb-3">No Results Available</h1>
          
          {isFinished ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-muted-foreground mb-6 text-sm">
                The election has concluded! Results should now be available to view.
              </p>
              <button
                onClick={handleReload}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page to See Results
              </button>
            </div>
          ) : timeLeft ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-muted-foreground mb-6 text-sm">
                Results will be displayed here once the ongoing election has concluded. Check back when the countdown ends.
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 mb-8 inline-flex flex-col items-center border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-4 text-xs font-bold uppercase tracking-widest">
                  <Timer className="w-4 h-4" />
                  Time Until Results
                </div>
                
                <div className="flex gap-4 sm:gap-6">
                  {/* Hours */}
                  <div className="flex flex-col items-center w-12 sm:w-16">
                    <span className="text-3xl sm:text-4xl font-bold text-foreground font-mono">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Hrs</span>
                  </div>
                  
                  <span className="text-3xl sm:text-4xl font-light text-slate-300 dark:text-slate-700 -mt-1">:</span>
                  
                  {/* Minutes */}
                  <div className="flex flex-col items-center w-12 sm:w-16">
                    <span className="text-3xl sm:text-4xl font-bold text-foreground font-mono">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Min</span>
                  </div>
                  
                  <span className="text-3xl sm:text-4xl font-light text-slate-300 dark:text-slate-700 -mt-1">:</span>
                  
                  {/* Seconds */}
                  <div className="flex flex-col items-center w-12 sm:w-16">
                    <span className="text-3xl sm:text-4xl font-bold text-primary font-mono tabular-nums">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] sm:text-xs text-primary/70 uppercase tracking-wider font-semibold mt-1">Sec</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
                >
                  Go back to Voting
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
