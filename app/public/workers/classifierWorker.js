importScripts(
  '/tflite/tf.min.js',
  '/tflite/tf-backend-wasm.min.js',
  '/tflite/tf-tflite.es2017.min.js'
)

const WASM_ROOT = '/tflite/';
const MODEL     = '/model/WithCross_640x640.tflite';
const SIZE      = 640;

const setTFLiteWasmPath = self.tflite.setWasmPath;
const loadTFLiteModel   = self.tflite.loadTFLiteModel;

const log  = msg => postMessage({ status:'log',  msg });
const fail = err => postMessage({ status:'load-error',
                                  error: err?.message || String(err) });

let model;
(async () => {
  try {
    log('worker booting (ESM)');

    /* wasm backend */
    tf.wasm.setWasmPaths(WASM_ROOT);
    await tf.setBackend('wasm');
    await tf.ready();

    /* tflite wasm (prefix) */
    setTFLiteWasmPath(WASM_ROOT);

    log('loading tflite model …');
    model = await loadTFLiteModel(MODEL);

    postMessage({ status:'model-loaded' });
  } catch (e) { fail(e); }
})();

const preprocess = bmp =>
  tf.tidy(() =>
    tf.browser.fromPixels(bmp)
      .resizeBilinear([SIZE, SIZE])
      .toFloat()
      .div(255)
      .expandDims(0));              // [1, H, W, 3]

async function infer(blob){
  try{
    const bmp = await createImageBitmap(blob);
    const x   = preprocess(bmp);

    const t0  = performance.now();
    const y   = model.predict(x);
    const out = await y.data();             // Float32Array
    const dt  = performance.now() - t0;

    x.dispose(); y.dispose();
    postMessage({ output: Array.from(out), elapsed: dt });
  }catch(e){ postMessage({ error: e.message }); }
}

self.onmessage = ({ data }) =>
  model ? infer(data)
        : log('drop – model not yet ready');
