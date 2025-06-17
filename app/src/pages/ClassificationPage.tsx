import React, { useState, useRef } from 'react';
import { useSSD } from '../hooks/useSSD';
import { useImageStream } from '../hooks/useImageStream';
import { COCO_LABELS } from '../config/coco_labels';

const SCORE_TH = 0.6;

const ClassificationPage: React.FC = () => {
  const { classify } = useSSD();
  const [logs, setLogs] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const inputCanvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);

  const addLog = (msg: string) =>
    setLogs((prev) => [new Date().toLocaleTimeString() + ' ' + msg, ...prev].slice(0, 200));

  useImageStream({
    enabled: listening,
    wsUrl: 'wss://localhost:4443/stream',
    onImage: async (blob) => {
      try {
        // --- draw original ---
        const bmp = await createImageBitmap(blob);
        const inputC = inputCanvasRef.current;
        const resC = resultCanvasRef.current;
        if (!inputC || !resC) return;
        inputC.width = bmp.width;
        inputC.height = bmp.height;
        resC.width = bmp.width;
        resC.height = bmp.height;
        const ictx = inputC.getContext('2d')!;
        const rctx = resC.getContext('2d')!;
        ictx.drawImage(bmp, 0, 0);
        rctx.drawImage(bmp, 0, 0); // start with original for annotation

        // --- inference ---
        const { boxes, classes, scores, elapsed } = await classify(blob);
        const h = bmp.height;
        const w = bmp.width;
        rctx.strokeStyle = 'lime';
        rctx.lineWidth = 2;
        rctx.font = '16px sans-serif';
        rctx.fillStyle = 'lime';

        let detectStr = '';
        boxes.forEach((b, idx) => {
          const score = scores[idx];
          if (score < SCORE_TH) return;
          const cls = classes[idx];
          const [ymin, xmin, ymax, xmax] = b;
          const x1 = xmin * w;
          const y1 = ymin * h;
          const x2 = xmax * w;
          const y2 = ymax * h;
          rctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
          const label = COCO_LABELS[cls] ?? `cls${cls}`;
          rctx.fillText(`${label} ${(score * 100).toFixed(1)}%`, x1, y1 - 4);
          detectStr += `  - ${label} ${(score * 100).toFixed(1)}%\n`;
        });

        addLog(`推論: ${elapsed.toFixed(1)} ms\n${detectStr || '  検出なし'}`);
      } catch (e: any) {
        addLog('Error: ' + e.message);
      }
    },
    onStatus: addLog,
  });

  return (
    <div style={{ padding: '1rem' }}>
      <h2>SSD-Lite Classification</h2>
      <button onClick={() => setListening((s) => !s)}>
        {listening ? '受信停止' : '受信開始'}
      </button>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <div>
          <p>入力画像</p>
          <canvas ref={inputCanvasRef} style={{ border: '1px solid gray' }} />
        </div>
        <div>
          <p>推論結果</p>
          <canvas ref={resultCanvasRef} style={{ border: '1px solid gray' }} />
        </div>
      </div>
      <textarea
        style={{ width: '100%', height: '200px', fontFamily: 'monospace', marginTop: '1rem' }}
        readOnly
        value={logs.join('\n')}
      />
    </div>
  );
};

export default ClassificationPage;