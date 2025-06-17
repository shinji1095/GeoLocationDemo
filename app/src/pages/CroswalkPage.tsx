import React, { useState, useRef } from 'react';
import { useClassifier } from '../hooks/useClassifier';
import { useImageStream } from '../hooks/useImageStream';

const SIGNAL_LABEL = ['red', 'green', 'none'];
const CROSSWALK_LABEL = ['crossing', 'not_crossing', 'approching'];

const ClassificationPage: React.FC = () => {
  const { classify } = useClassifier();
  const [logs, setLogs] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const addLog = (msg: string) =>
    setLogs((prev) => [new Date().toLocaleTimeString() + ' ' + msg, ...prev].slice(0, 100));

  useImageStream({
    enabled: listening,
    canvasRef,
    onImage: async (blob) => {
      try {
        addLog(`Image received: ${(blob.size / 1024).toFixed(1)} KB`);
        const { output, elapsed } = await classify(blob);

        const partA = output.slice(0, 3);
        const partB = output.slice(3, 6);
        const partC = output[6];

        const resultA = partA.indexOf(Math.max(...partA));
        const resultB = partB.indexOf(Math.max(...partB));
        const resultC = Math.tanh(partC);

        addLog(
          `推論結果: A=${SIGNAL_LABEL[resultA]}, B=${CROSSWALK_LABEL[resultB]}, C=${resultC.toFixed(3)} (時間: ${elapsed.toFixed(1)} ms)`
        );
      } catch (err: any) {
        addLog(`Error: ${err.message}`);
      }
    },
    onStatus: addLog,
    wsUrl: 'wss://localhost:4443/stream', 
  });

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Classification Page</h2>
      <button onClick={() => setListening((s) => !s)}>
        {listening ? '受信停止' : '受信開始'}
      </button>
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ display: 'block', margin: '1rem auto', border: '1px solid gray' }}
      />
      <textarea
        style={{ width: '100%', height: '200px', marginTop: '1rem', fontFamily: 'monospace' }}
        readOnly
        value={logs.join('\n')}
      />
    </div>
  );
};

export default ClassificationPage;