import React, { useState } from 'react';

const FetchPage: React.FC = () => {
  const [log, setLog] = useState('');

  const fetchData = async () => {
    setLog('Fetching...');
    const url = 'https://kusukusumapproject-46431021282.asia-northeast2.run.app/route/crosswalk/?origin=33.888729722026795,130.7108332758082&destination=33.891079,130.703475';

    try {
      const res = await fetch(url, {
        method: 'POST'
      });

      if (!res.ok) {
        const text = await res.text();
        setLog(`HTTP ${res.status}: ${text}`);
        return;
      }

      const json = await res.json();
      setLog(`Success:\n${JSON.stringify(json, null, 2)}`);
    } catch (err: any) {
      setLog(`Fetch error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>ルート取得テスト</h2>
      <button onClick={fetchData}>実行</button>
      <textarea
        style={{ width: '100%', height: '300px', marginTop: '1rem', fontFamily: 'monospace' }}
        readOnly
        value={log}
      />
    </div>
  );
};

export default FetchPage;
