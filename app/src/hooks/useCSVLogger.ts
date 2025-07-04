// hooks/useCSVLogger.ts
import { useRef } from 'react';

export function useCSVLogger() {
  const linesRef = useRef<string[]>([]);
  const t0Ref = useRef<number | null>(null);

  const logEvent = (event: string, phase: string = '-', reactTs: number = Date.now()) => {
    if (!t0Ref.current) t0Ref.current = reactTs;
    const elapsed = t0Ref.current ? reactTs - t0Ref.current : 0;
    const isoTime = new Date(reactTs).toISOString();
    linesRef.current.push(`${isoTime},${event},${phase},${elapsed}`);
  };

  const downloadCSV = (filename: string) => {
    const content = 'timestamp,event,phase,elapsed\n' + linesRef.current.join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetLogger = () => {
    linesRef.current = [];
    t0Ref.current = null;
  };

  return { logEvent, downloadCSV, resetLogger };
}
