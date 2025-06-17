import { useCallback } from 'react';

type LogEntry = {
  lat: number;
  lon: number;
  bearing: number;
  unitVector: { x: number; y: number };
};

export const useCsvExporter = () => {
  const exportToCsv = useCallback((logs: LogEntry[], filename: string = 'location_log.csv') => {
    if (logs.length === 0) return;

    const header = 'lat,lon,bearing,vector_x,vector_y\n';
    const rows = logs.map(l =>
      `${l.lat},${l.lon},${l.bearing},${l.unitVector.x},${l.unitVector.y}`
    ).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return { exportToCsv };
};
