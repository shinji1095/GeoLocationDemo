import React, { useState, useRef } from 'react';
import { useHeadingSensor } from '../hooks/useHeadingSensor';
import { useAccuratePosition } from '../hooks/useAccuratePosition';
import { useRouteApi } from '../hooks/useRouteApi';

interface Location {
  lat: number;
  lon: number;
}

const NavigationPage: React.FC = () => {
  const [destLat, setDestLat] = useState('');
  const [destLon, setDestLon] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [routeBearing, setRouteBearing] = useState<number | null>(null);
  const [bearingDiff, setBearingDiff] = useState<number | null>(null);
  const heading = useHeadingSensor();
  const { getAveragePosition } = useAccuratePosition();
  const { postRouteRequest } = useRouteApi();
  const intervalId = useRef<NodeJS.Timer | null>(null);

  const speak = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  };

  const distance = (a: Location, b: Location) => {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const aVal =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
    return R * c;
  };

  const computeBearingDiff = (a: number, b: number) => {
    let diff = Math.abs(a - b) % 360;
    return diff > 180 ? 360 - diff : diff;
  };

  const handleNavigationToggle = async () => {
    if (isNavigating) {
      setIsNavigating(false);
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = null;
      }
      return;
    }

    setIsNavigating(true);

    try {
      const origin = await getAveragePosition();
      const destination = { lat: parseFloat(destLat), lon: parseFloat(destLon) };
      const data = await postRouteRequest(origin, destination);
      setRouteInfo(data);

      intervalId.current = setInterval(async () => {
        try {
          const pos = await getAveragePosition();
          setCurrentLocation(pos);

          const closest = data.route_polyline.reduce((prev: any, p: any) => {
            const d1 = distance(prev, pos);
            const d2 = distance(p, pos);
            return d1 < d2 ? prev : p;
          });

          const closestCrosswalk = data.matched_crosswalks.reduce((prev: any, p: any) => {
            const d1 = distance(prev, pos);
            const d2 = distance(p, pos);
            return d1 < d2 ? prev : p;
          });

          const distToRoute = distance(closest, pos);
          const distToXwalk = distance(closestCrosswalk, pos);

          setRouteBearing(closest.bearing);

          if (distToRoute < 10) speak('ステップに到着');
          if (distToXwalk < 20) speak('横断歩道に接近しました');

          if (heading != null && closest.bearing != null) {
            setBearingDiff(computeBearingDiff(heading, closest.bearing));
          }
        } catch (err) {
          console.warn('位置追跡中にエラー:', err);
        }
      }, 3000);
    } catch (e) {
      console.error('ナビ開始失敗:', e);
      setIsNavigating(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>ナビゲーション開始</h2>
      <div>
        <label>目的地 緯度: </label>
        <input
          type="number"
          value={destLat}
          onChange={(e) => setDestLat(e.target.value)}
          step="any"
          required
        />
      </div>
      <div>
        <label>目的地 経度: </label>
        <input
          type="number"
          value={destLon}
          onChange={(e) => setDestLon(e.target.value)}
          step="any"
          required
        />
      </div>
      <button onClick={handleNavigationToggle} style={{ marginTop: '1rem' }}>
        {isNavigating ? 'ナビ中断' : 'ナビ開始'}
      </button>

      <textarea
        readOnly
        style={{ width: '100%', height: '250px', fontFamily: 'monospace', marginTop: '1rem' }}
        value={
          `現在位置: ${currentLocation?.lat?.toFixed(6)}, ${currentLocation?.lon?.toFixed(6)}\n` +
          `スマホ方位: ${heading?.toFixed(2)}°\n` +
          `最近のルートbearing: ${routeBearing?.toFixed(2)}°\n` +
          `bearing差分: ${bearingDiff?.toFixed(2)}°\n` +
          `横断歩道数: ${routeInfo?.num_crosswalks ?? '-'}\n` +
          `所要時間: ${routeInfo?.total_duration ?? '-'}`
        }
      />
    </div>
  );
};

export default NavigationPage;