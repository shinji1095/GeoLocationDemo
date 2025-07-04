// pages/SufficientAccuracyEvaluationPage.tsx
import React, { useState } from 'react';
import { useCSVLogger } from '../hooks/useCSVLogger';
import { useSufficientAccuracy } from '../hooks/useSufficientAccuracy';

const audioFiles = {
  red: '/audio/red_signal_voice_nanami_speed1.8_highlow_0.mp3',
  green: '/audio/green_signal_voice_nanami_speed1.8_highlow_0.mp3',
  crosswalk: '/audio/crosswalk_voice_nanami_speed1.8_highlow_0.mp3',
};

const Page: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [redDuration, setRedDuration] = useState(30000);
  const [errorRate, setErrorRate] = useState(0.1);
  const [filename, setFilename] = useState('log');
  const [logs, setLogs] = useState<string[]>([]);

  const { logEvent, downloadCSV, resetLogger } = useCSVLogger();

  const { reset } = useSufficientAccuracy({
    enabled,
    redDuration,
    errorRate,
    audioFiles,
    onLog: (event, phase, ts) => {
      setLogs((prev) => [...prev, `${event} [${phase}]`]);
      logEvent(event, phase, ts);
    },
  });

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">十分精度の評価</h1>

      <button
        onClick={() => {
          if (enabled) {
            reset();
            setEnabled(false);
          } else {
            resetLogger();
            setLogs([]);
            setEnabled(true);
          }
        }}
        className={`px-4 py-2 rounded text-white ${
          enabled ? 'bg-red-600' : 'bg-blue-600'
        }`}
      >
        {enabled ? '中断' : '計測開始'}
      </button>

      <div>
        <label>赤信号時間 (ms): </label>
        <input
          type="number"
          value={redDuration}
          onChange={(e) => setRedDuration(Number(e.target.value))}
          className="border px-2 py-1 w-full"
        />
      </div>

      <div>
        <label>誤認識率 (0〜1): </label>
        <input
          type="number"
          step="0.01"
          value={errorRate}
          onChange={(e) => setErrorRate(Number(e.target.value))}
          className="border px-2 py-1 w-full"
        />
      </div>

      <div>
        <label>ファイル名: </label>
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          className="border px-2 py-1 w-full"
        />
      </div>

      <div>
        <label>ログ:</label>
        <textarea
          rows={10}
          value={logs.join('\n')}
          readOnly
          className="w-full border p-2 font-mono"
        />
      </div>

      <button
        onClick={() => downloadCSV(filename || 'log')}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        CSV出力
      </button>
    </div>
  );
};

export default Page;
