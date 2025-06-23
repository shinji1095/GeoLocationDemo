import React, { useState, useRef } from 'react';
import { useImageStream } from '../hooks/useImageStream';
import { useSpeak } from '../hooks/useSpeak';
import { useVibrationCommand } from '../hooks/useVibrationCommand';
import { useWorkerClassifier } from '../hooks/useClassifierWorker';

const StreamingPage: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const isClassifying = useRef(false);

  const { speak } = useSpeak();
  const { evaluateAndSendVibration, resetState } = useVibrationCommand(enabled);
  const { classify } = useWorkerClassifier();

  const addLog = (msg: string) =>
    setLogs(prev => [new Date().toLocaleTimeString() + ' ' + msg, ...prev].slice(0, 100));

  useImageStream({
    enabled,
    wsUrl: 'wss://localhost:4443/stream',
    onStatus: addLog,
    onImage: async (blob) => {
      const imgUrl = URL.createObjectURL(blob);
      if (imgRef.current) imgRef.current.src = imgUrl;

      if (!isClassifying.current) {
        isClassifying.current = true;

        classify(blob).then(({ output, elapsed }) => {
          const signal_idx = output.slice(0, 3).indexOf(Math.max(...output.slice(0, 3)));
          const crosswalk_idx = output.slice(3, 6).indexOf(Math.max(...output.slice(3, 6)));
          const line_inclination = Math.tanh(output[6]);

          const resultLog = `推論: 信号=${signal_idx}, 横断歩道=${crosswalk_idx}, 傾き=${line_inclination.toFixed(2)} (処理: ${elapsed.toFixed(1)} ms)`;
          addLog(resultLog);

          speak(`信号${signal_idx}、横断歩道${crosswalk_idx}、傾き${line_inclination.toFixed(1)}`);
          evaluateAndSendVibration({ signal_idx, crosswalk_idx, line_inclination });
        }).catch((error) => {
          addLog(`推論エラー: ${error.message}`);
        }).finally(() => {
          isClassifying.current = false;
          URL.revokeObjectURL(imgUrl);
        });
      } else {
        setTimeout(() => URL.revokeObjectURL(imgUrl), 500);
      }
    }
  });

  const handleToggle = () => {
    if (enabled) resetState();
    setEnabled(prev => !prev);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Crosswalk Support</h2>
      <button onClick={handleToggle}>
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
