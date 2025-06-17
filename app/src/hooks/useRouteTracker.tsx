import { useState, useRef } from 'react';

type Point = {
  lat: number;
  lon: number;
  bearing: number;
  v_bearing: [number, number];
};

type RouteResponse = {
  origin: [number, number];
  destination: [number, number];
  total_duration: string;
  num_crosswalks: number;
  route_polyline: Point[];
  matched_crosswalks: Point[];
};

type Location = {
  lat: number;
  lon: number;
};

export const useRouteTracker = () => {
  const [routeInfo, setRouteInfo] = useState<RouteResponse | null>(null);
  const [closestRouteBearing, setClosestRouteBearing] = useState<number | null>(null);
  const [bearingDiff, setBearingDiff] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const intervalId = useRef<NodeJS.Timer | null>(null);

  const speak = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  };

  const distance = (a: Point, b: Location) => {
    const R = 6371000;
    const φ1 = (a.lat * Math.PI) / 180;
    const φ2 = (b.lat * Math.PI) / 180;
    const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
    const Δλ = ((b.lon - a.lon) * Math.PI) / 180;

    const d =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(d), Math.sqrt(1 - d));
    return R * c;
  };

  const computeBearingDiff = (a: number, b: number) => {
    const diff = Math.abs(a - b) % 360;
    return diff > 180 ? 360 - diff : diff;
  };

  const startTracking = async (destLat: number, destLon: number) => {
    // 1. 現在地取得
    const geo = await new Promise<Location>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        reject,
        { enableHighAccuracy: true }
      );
    });

    const originStr = `${geo.lat},${geo.lon}`;
    const destStr = `${destLat},${destLon}`;

    // 2. APIへPOSTリクエスト
    const res = await fetch(
      `https://kusukusumapproject-46431021282.asia-northeast2.run.app/route/crosswalk/?origin=${originStr}&destination=${destStr}`,
      { method: 'POST' }
    );
    const data: RouteResponse = await res.json();
    setRouteInfo(data);

    // 3. 定期追跡開始
    intervalId.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        const curr = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setCurrentLocation(curr);

        // 最も近い route point を探す
        const closestRoute = data.route_polyline.reduce((prev, p) =>
          distance(p, curr) < distance(prev, curr) ? p : prev
        );
        const closestXwalk = data.matched_crosswalks.reduce((prev, p) =>
          distance(p, curr) < distance(prev, curr) ? p : prev
        );

        const distToRoute = distance(closestRoute, curr);
        const distToXwalk = distance(closestXwalk, curr);
        setClosestRouteBearing(closestRoute.bearing);

        if (distToRoute < 10) speak('ステップに到着');
        if (distToXwalk < 20) speak('横断歩道に接近しました');

        if ('DeviceOrientationEvent' in window) {
          window.addEventListener('deviceorientationabsolute', (e) => {
            const heading = (360 - (e.alpha ?? 0)) % 360;
            const diff = computeBearingDiff(heading, closestRoute.bearing);
            setBearingDiff(diff);
          }, { once: true });
        }
      });
    }, 3000);
  };

  return {
    startTracking,
    routeInfo,
    closestRouteBearing,
    bearingDiff,
    currentLocation,
  };
};
