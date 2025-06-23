console.log('classifierWorker.js loaded');

self.postMessage({ status: 'log', msg: 'worker started' });

import { useEffect, useRef } from 'react';

export const useWorkerClassifier = () => {
  const workerRef = useRef<Worker | null>(null);
  const isModelReady = useRef(false);
  const modelReadyCallbacks: (() => void)[] = [];

  useEffect(() => {
    console.log('Worker initializing…');
    workerRef.current = new Worker('/workers/classifierWorker.js');

    console.log('Worker onmessage');
    workerRef.current.onmessage = (event) => {
        console.log('Worker message:', event.data);
        const { status, msg, error } = event.data;

        if (status === 'model-loaded') {
        isModelReady.current = true;
        modelReadyCallbacks.forEach(cb => cb());
        modelReadyCallbacks.length = 0;
        console.log('model-ready');
        return;
        }
        if (status === 'log') {
        console.log('[Worker]', msg);
        return;
        }
        if (status === 'load-error') {
        console.error('model load failed:', error);
        return;
        }
    };

    return () => {
        workerRef.current?.terminate();
        workerRef.current = null;
    };
    }, []);


  const waitUntilReady = (): Promise<void> => {
    if (isModelReady.current) return Promise.resolve();
    return new Promise((resolve) => {
      modelReadyCallbacks.push(resolve);
    });
  };

  const classify = async (blob: Blob): Promise<{ output: number[]; elapsed: number }> => {
    await waitUntilReady(); // モデル準備完了まで待機

    const worker = workerRef.current;
    if (!worker) throw new Error('Worker not initialized');

    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        const { output, elapsed, error } = event.data;
        if (error) {
          reject(new Error(error));
        } else {
          resolve({ output, elapsed });
        }
        worker.removeEventListener('message', handleMessage);
      };

      const handleError = (e: ErrorEvent) => {
        reject(new Error(e.message));
        worker.removeEventListener('error', handleError);
      };

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);

      worker.postMessage(blob);
    });
  };

  return { classify };
};
