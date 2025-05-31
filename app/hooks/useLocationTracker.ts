import { useState, useRef } from 'react';

type Location = {
  timestamp: number;
  latitude: number;
  longitude: number;
};

export const useLocationTracker = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [tracking, setTracking] = useState(false);
  const watchId = useRef<number | null>(null);

  const startTracking = () => {
    if (tracking) return;
    setTracking(true);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocations((prev) => [
          ...prev,
          { timestamp: pos.timestamp, latitude, longitude },
        ]);
      },
      (err) => console.error('Geolocation error:', err),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setTracking(false);
  };

  const toggleTracking = () => {
    tracking ? stopTracking() : startTracking();
  };

  return { tracking, locations, toggleTracking };
};