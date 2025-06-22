import { useRef, useEffect } from 'react';

export function useWorkerClassifier() {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/classifierWorker.ts', import.meta.url));

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const classify = (blob: Blob): Promise<{ output: number[], elapsed: number }> => {
    return new Promise((resolve, reject) => {
      const worker = workerRef.current;
      if (!worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      worker.onmessage = (event) => {
        const { output, elapsed, error } = event.data;
        if (error) {
          reject(new Error(error));
        } else {
          resolve({ output, elapsed });
        }
      };

      worker.onerror = (e) => reject(new Error(e.message));
      worker.postMessage(blob);
    });
  };

  return { classify };
}
