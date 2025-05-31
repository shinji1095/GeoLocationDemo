import React from 'react';
import { useLocationTracker } from '../hooks/useLocationTracker';

const App: React.FC = () => {
  const { tracking, locations, toggleTracking } = useLocationTracker();

  const downloadCSV = () => {
    const header = 'timestamp,latitude,longitude\n';
    const rows = locations.map(
      ({ timestamp, latitude, longitude }) =>
        `${timestamp},${latitude},${longitude}`
    );
    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'locations.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClick = () => {
    if (tracking) {
      toggleTracking();
      downloadCSV();
    } else {
      toggleTracking();
    }
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>GPS位置情報記録アプリ</h1>
      <button onClick={handleClick} style={{ fontSize: '1.5rem', padding: '1rem 2rem' }}>
        {tracking ? '計測中（タップして保存）' : '計測開始'}
      </button>
    </div>
  );
};

export default App;
