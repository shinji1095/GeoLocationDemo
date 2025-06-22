/* hooks/useClassifier.ts
   - 1) load TFLite model once
   - 2) classify Image/Blob arraybuffer sent from backend
   - 3) return probs + elapsed time
*/
import { useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { loadTFLiteModel, setWasmPath } from '@tensorflow/tfjs-tflite';
import '@tensorflow/tfjs-backend-wasm';
import { softmax, preprocessImage } from '../utils/aiUtils';
import { config } from '../config/config';

setWasmPath('/static/js/');

export const useClassifier = () => {
  const modelRef = useRef<any>(null);
  const canvas = useRef<HTMLCanvasElement>(document.createElement('canvas'));

  useEffect(() => {
    const load = async () => {
      await tf.setBackend('wasm');
      await tf.ready();
      modelRef.current = await loadTFLiteModel(config.TFLITE_MODEL_PATH);
      console.log('TFLite model loaded');
    };
    load();
  }, []);

  const classify = async (blob: Blob) => {
    if (!modelRef.current) throw new Error('model not ready');

    const bitmap = await createImageBitmap(blob);
    const ctx = canvas.current.getContext('2d')!;
    canvas.current.width = config.MODEL_WIDTH;
    canvas.current.height = config.MODEL_HEIGHT;
    ctx.drawImage(bitmap, 0, 0, config.MODEL_WIDTH, config.MODEL_HEIGHT);

    const inputTensor = preprocessImage(canvas.current);
    const start = performance.now();
    const outputTensor = modelRef.current.predict(inputTensor);
    const probs = await outputTensor.data();
    // const probs = softmax(scores);
    const elapsed = performance.now() - start;

    inputTensor.dispose();
    outputTensor.dispose();

    return {
      output: probs,
      elapsed,
    };
  };

  return { classify };
};
