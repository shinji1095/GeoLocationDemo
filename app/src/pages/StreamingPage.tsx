import React, { useState, useRef } from 'react';
import { useCrosswalkLogic } from '../hooks/useCrosswalkLogic';

const StreamingPage: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) =>
    setLogs(prev => [new Date().toLocaleTimeString() + ' ' + msg, ...prev].slice(0, 100));

  const { handleToggle } = useCrosswalkLogic({ enabled, onLog: addLog, imgRef });

  const toggleSupport = () => {
    handleToggle();
    setEnabled(prev => !prev);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Crosswalk Support</h2>
      <button onClick={toggleSupport}>
        {enabled ? '支援停止' : '支援開始'}
      </button>

      <img
        ref={imgRef}
        width={640}
        height={480}
        style={{ display: 'block', margin: '1rem auto', border: '1px solid gray' }}
        alt="stream"
      />

      <textarea
        readOnly
        value={logs.join('\n')}
        style={{ width: '100%', height: '200px', marginTop: '1rem', fontFamily: 'monospace' }}
      />
    </div>
  );
};

export default StreamingPage;
