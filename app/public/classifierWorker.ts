/*  public/classifierWorker.ts
    - TFLite WASM backendをオフスクリーンでロード
    - JPEG ArrayBuffer を受け取り推論
    - {type:'result', output:number[], elapsed:number} を返す
*/
import * as tf from '@tensorflow/tfjs';
import { TFLiteTaskModel } from '@tensorflow/tfjs-tflite';
import '@tensorflow/tfjs-backend-wasm';
import { preprocessImage } from '../src/utils/aiUtils';
import { config } from '../src/config/config';

const WASM_BASE = '/static/js';

(async () => {
  await tf.setBackend('wasm');
  await tf.ready();

  // WASMパス指定（SIMD対応があれば自動で読み分け）
  tf.env().set('WASM_PATH', `${WASM_BASE}/`);

  // モデル読み込み
  const modelBuffer = await (await fetch(config.TFLITE_MODEL_PATH)).arrayBuffer();
  const model = await TFLiteTaskModel.create(modelBuffer, {
    wasmPath: `${WASM_BASE}/tflite_web_api.wasm`,
    simdWasmPath: `${WASM_BASE}/tflite_web_api_simd.wasm`,
    simdPath: `${WASM_BASE}/tflite_web_api_simd.js`,
  });

  // OffscreenCanvas (CPU リサイズでも十分速い)
  const canvas = new OffscreenCanvas(config.MODEL_WIDTH, config.MODEL_HEIGHT);
  const ctx = canvas.getContext('2d')!;

  postMessage({ type: 'ready' });

  onmessage = async (e: MessageEvent) => {
    if (e.data.type !== 'classify') return;

    const blob = e.data.data.blob as Blob;
    const bitmap = await createImageBitmap(blob);

    ctx.drawImage(bitmap, 0, 0, config.MODEL_WIDTH, config.MODEL_HEIGHT);
    const inputTensor = preprocessImage(canvas as any);

    const t0 = performance.now();
    const outputTensor = model.predict(inputTensor) as tf.Tensor;
    const output = Array.from(await outputTensor.data());
    const elapsed = performance.now() - t0;

    inputTensor.dispose();
    outputTensor.dispose();

    postMessage({ type: 'result', output, elapsed });
  };
})();
