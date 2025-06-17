/* hooks/useSSD.ts – fixed: handle predict() object vs array */
import { useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { loadTFLiteModel, setWasmPath } from '@tensorflow/tfjs-tflite';
import '@tensorflow/tfjs-backend-wasm';
import { config } from '../config/config';

setWasmPath('/static/js/');

export interface SsdResult {
  boxes: number[][];
  classes: number[];
  scores: number[];
  elapsed: number;
}

export const useSSD = () => {
  const modelRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));

  // load model once
  useEffect(() => {
    (async () => {
      await tf.setBackend('wasm');
      await tf.ready();
      modelRef.current = await loadTFLiteModel(config.SSD_MODEL_PATH);
      console.log('SSD-Lite model loaded');
    })();
  }, []);

  const preprocess = async (blob: Blob) => {
    const bmp = await createImageBitmap(blob);
    const ctx = canvasRef.current.getContext('2d')!;
    canvasRef.current.width = 300;
    canvasRef.current.height = 300;
    ctx.drawImage(bmp, 0, 0, 300, 300);
    const img = ctx.getImageData(0, 0, 300, 300);
    let tensor = tf.tensor(img.data, [1, 300, 300, 4], 'float32');
    tensor = tf.slice(tensor, [0, 0, 0, 0], [-1, -1, -1, 3]); // drop alpha
    tensor = tensor.sub(127.5).mul(0.007843);
    return tensor;
  };

  const classify = async (blob: Blob): Promise<SsdResult> => {
    if (!modelRef.current) throw new Error('model not ready');

    const input = await preprocess(blob);

    const t0 = performance.now();
    const outs = modelRef.current.predict(input) as Record<string, tf.Tensor>;
    const elapsed = performance.now() - t0;

    // --- キー順で取得（上で確認した4つ） ---
    const boxesT   = outs['TFLite_Detection_PostProcess'];       // [1,10,4]
    const classesT = outs['TFLite_Detection_PostProcess:1'];     // [1,10]
    const scoresT  = outs['TFLite_Detection_PostProcess:2'];     // [1,10]
    const countT   = outs['TFLite_Detection_PostProcess:3'];     // [1]

    if (!boxesT || !scoresT || !classesT)
        throw new Error('invalid model outputs (boxes/classes/scores missing)');

    const n = Math.min((countT.dataSync()[0] as number) || 10, 10);

    const boxesArr    = Array.from(boxesT.dataSync());
    const classesArr  = Array.from(classesT.dataSync());
    const scoresArr   = Array.from(scoresT.dataSync());

    const boxes:   number[][] = [];
    const classes: number[]   = [];
    const scores:  number[]   = [];

    for (let i = 0; i < n; i++) {
        boxes  .push(boxesArr.slice(i * 4, i * 4 + 4));
        classes.push(classesArr[i]);
        scores .push(scoresArr[i]);
    }

    // dispose
    input.dispose();
    Object.values(outs).forEach(t => t.dispose && t.dispose());

    return { boxes, classes, scores, elapsed };
    };


  return { classify };
};
