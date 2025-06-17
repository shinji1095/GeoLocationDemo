import React from 'react';
import { useLocationLogger } from '../hooks/useLocationLogger';
import { useCsvExporter } from '../hooks/useCsvExporter';

const HomePage: React.FC = () => {
  const { logs, tracking, toggleTracking } = useLocationLogger();
  const { exportToCsv } = useCsvExporter();

  return (
    <div>
      <h1>GPSロガー</h1>
      <button onClick={toggleTracking}>
        {tracking ? '計測停止' : '計測開始'}
      </button>
      {!tracking && logs.length > 0 && (
        <button onClick={() => exportToCsv(logs)}>記録をCSVに保存</button>
      )}
      <textarea
        readOnly
        style={{ width: '100%', height: '300px', marginTop: '1rem' }}
        value={logs.map((l, i) =>
          `#${i + 1} lat:${l.lat}, lon:${l.lon}, bearing:${l.bearing.toFixed(2)}, vector:(${l.unitVector.x.toFixed(3)}, ${l.unitVector.y.toFixed(3)})`
        ).join('\n')}
      />
    </div>
  );
};

export default HomePage;
