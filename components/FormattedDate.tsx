'use client';

import { useEffect, useState } from 'react';

interface FormattedDateProps {
  date: string | Date;
  format?: 'full' | 'short';
  className?: string;
}

export default function FormattedDate({ date, format = 'full', className }: FormattedDateProps) {
  const [formatted, setFormatted] = useState<string>('');

  useEffect(() => {
    const d = new Date(date);
    if (format === 'full') {
      setFormatted(
        d.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    } else {
      setFormatted(
        d.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }
  }, [date, format]);

  // Use a skeleton or empty state to prevent hydration mismatch
  if (!formatted) {
    return <span className={`animate-pulse bg-muted rounded w-24 h-4 inline-block ${className || ''}`} />;
  }

  return <span className={className}>{formatted}</span>;
}
