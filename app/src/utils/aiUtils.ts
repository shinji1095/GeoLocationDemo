import * as tf from '@tensorflow/tfjs';

export const softmax = (arr) => {
    const max = Math.max(...arr);
    const exp = arr.map((x) => Math.exp(x - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    return exp.map((x) => x / sum);
  };

export  const preprocessImage = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, 640, 640);
    const { data } = imageData;
    const floatData = new Float32Array(1 * 3 * 640 * 640);

    for (let i = 0, j = 0; i < data.length; i += 4) {
      floatData[j] = data[i] / 255.0;
      floatData[j + 640 * 640] = data[i + 1] / 255.0;
      floatData[j + 2 * 640 * 640] = data[i + 2] / 255.0;
      j++;
    }

    return tf.tensor4d(floatData, [1, 640, 640, 3]);
  };