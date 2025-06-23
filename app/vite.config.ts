import { defineConfig } from 'vite';
import react      from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import fs from "fs";
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'node_modules/@tensorflow/tfjs/dist/tf.min.js',
          dest: 'tflite' },
        { src: 'node_modules/@tensorflow/tfjs-backend-wasm/dist/tf-backend-wasm.min.js',
          dest: 'tflite' },

        { src: 'node_modules/@tensorflow/tfjs-tflite/dist/tf-tflite.es2017.min.js',
          dest: 'tflite' },
        { src: 'node_modules/@tensorflow/tfjs-tflite/dist/tflite_web_api_client.js',
          dest: 'tflite' },

        { src: 'node_modules/@tensorflow/tfjs-backend-wasm/dist/*-wasm*.wasm',
          dest: 'tflite' },
        { src: 'node_modules/@tensorflow/tfjs-tflite/dist/tflite_web_api_cc*.wasm',
          dest: 'tflite' },

        { src: 'model/WithCross_640x640.tflite', dest: 'model' },
      ],
    }),
  ],
  server: {
    https: {
      key : fs.readFileSync(path.resolve(__dirname,'cert/with-cross+3-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname,'cert/with-cross+3.pem')),
    },
    host: true,
    port: 5173,
  },

  publicDir: 'public',
  assetsInclude: ['**/*.wasm'],
  worker: { format: 'es' },
});

