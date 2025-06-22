import { useEffect, useRef, useState } from 'react';

export const useClassifierWorker = () => {
  const worker = useRef<Worker>();
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<{ output: number[]; elapsed: number } | null>(null);

  useEffect(() => {
    worker.current  = new Worker(
        new URL('/classifierWorker.ts', import.meta.url),
        { type: 'module' }
        );
    worker.current.onmessage = (e) => {
        if (e.data.type === 'ready') setReady(true);
        if (e.data.type === 'result') setResult(e.data);
    };

    (async () => {
        const buf = await (await fetch('/model/WithCross_640x640.tflite')).arrayBuffer();
        worker.current!.postMessage({ type: 'loadModel', buffer: buf }, [buf]);
    })();

    return () => worker.current?.terminate();
    }, []);

    const classify = (blob: Blob) => {
        if (ready && workerRef.current) {
        workerRef.current.postMessage({ type: 'classify', data: { blob } });
        }
  };

  return { classify, result, ready };
};
