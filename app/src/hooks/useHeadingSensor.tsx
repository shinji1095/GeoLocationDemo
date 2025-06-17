import { useEffect, useState } from 'react';

export const useHeadingSensor = () => {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.absolute && event.alpha != null) {
        // 北を0度とした角度を取得（時計回り）
        const bearing = (360 - event.alpha) % 360;
        setHeading(bearing);
      }
    };

    const requestPermission = async () => {
      // iOS 13+ 対応: ユーザーに許可を要求
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const response = await (DeviceOrientationEvent as any).requestPermission();
          if (response === 'granted') {
            window.addEventListener('deviceorientationabsolute', handleOrientation, true);
          }
        } catch (err) {
          console.error('Permission denied for device orientation', err);
        }
      } else {
        // Androidなどは許可不要
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
    };
  }, []);

  return heading;
};
