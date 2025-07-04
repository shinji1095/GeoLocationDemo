import { useCallback } from 'react';

export const useAccuratePosition = () => {
  const getAveragePosition = useCallback(async (durationMs = 3000, intervalMs = 500) => {
    const positions: GeolocationPosition[] = [];

    const getOnce = (): Promise<GeolocationPosition> =>
      new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true })
      );

    const endTime = Date.now() + durationMs;
    while (Date.now() < endTime) {
      try {
        const pos = await getOnce();
        positions.push(pos);
      } catch (e) {
        console.warn('GPS取得失敗', e);
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    if (positions.length === 0) throw new Error('位置情報が取得できませんでした');

    const avg = positions.reduce(
      (acc, p) => {
        acc.lat += p.coords.latitude;
        acc.lon += p.coords.longitude;
        return acc;
      },
      { lat: 0, lon: 0 }
    );

    return {
      lat: avg.lat / positions.length,
      lon: avg.lon / positions.length,
    };
  }, []);

  return { getAveragePosition };
};
