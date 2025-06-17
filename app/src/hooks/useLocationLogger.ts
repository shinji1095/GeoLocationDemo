import { useState, useRef } from 'react';

type Location = { lat: number; lon: number };
type LogEntry = {
  lat: number;
  lon: number;
  bearing: number;
  unitVector: { x: number; y: number };
};

export const useLocationLogger = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tracking, setTracking] = useState(false);
  const prevLocation = useRef<Location | null>(null);
  const watchId = useRef<number | null>(null);

  const toRadians = (deg: number) => deg * (Math.PI / 180);

  const computeBearing = (prev: Location, curr: Location): number => {
    const φ1 = toRadians(prev.lat);
    const φ2 = toRadians(curr.lat);
    const Δλ = toRadians(curr.lon - prev.lon);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);
    const bearing = (θ * 180) / Math.PI;
    return (bearing + 360) % 360;
  };

  const computeUnitVector = (bearing: number) => {
    const rad = toRadians(bearing);
    return { x: Math.cos(rad), y: Math.sin(rad) };
  };

  const startTracking = () => {
    if (tracking) return;
    setTracking(true);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const curr = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        if (prevLocation.current) {
          const bearing = computeBearing(prevLocation.current, curr);
          const unitVector = computeUnitVector(bearing);
          setLogs((prev) => [
            ...prev,
            {
              lat: curr.lat,
              lon: curr.lon,
              bearing,
              unitVector,
            },
          ]);
        }
        prevLocation.current = curr;
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setTracking(false);
    prevLocation.current = null;
  };

  const toggleTracking = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    tracking ? stopTracking() : startTracking();
  };

  return { logs, tracking, toggleTracking };
};
