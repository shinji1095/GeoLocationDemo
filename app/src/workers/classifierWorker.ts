// workers/classifierWorker.ts
self.onmessage = async (event) => {
  const blob: Blob = event.data;

  try {
    const bitmap = await createImageBitmap(blob);
    
    // ダミーの推論処理（実際のモデルで置き換えて）
    const start = performance.now();
    await new Promise(resolve => setTimeout(resolve, 1000)); // 推論の模擬(1秒待機)
    const elapsed = performance.now() - start;

    const output = Array(7).fill(0).map(() => Math.random());

    // 結果をメインスレッドに送信
    self.postMessage({ output, elapsed });
  } catch (error) {
    self.postMessage({ error: (error as Error).message });
  }
};
