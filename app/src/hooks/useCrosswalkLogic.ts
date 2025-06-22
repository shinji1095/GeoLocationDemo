import { RefObject, useCallback } from 'react';
import { useSpeak } from './useSpeak';
import { useClassifier } from './useClassifier';
import { useImageStream } from './useImageStream';
import { useDataLogger } from './useDataLogger';
import { useVibrationCommand } from './useVibrationCommand';
import { SIGNAL_LABEL, CROSSWALK_LABEL } from '../config/config';

type Props = {
  enabled: boolean;
  canvasRef: RefObject<HTMLCanvasElement>;
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
};

export function useCrosswalkLogic({ enabled, canvasRef, setLogs }: Props) {
  const { speak } = useSpeak();
  const { classify } = useClassifier();
  const { evaluateAndSendVibration } = useVibrationCommand();

  const addLog = useCallback(
    (msg: string) =>
      setLogs((prev) => [new Date().toLocaleTimeString() + ' ' + msg, ...prev].slice(0, 100)),
    [setLogs]
  );

  useImageStream({
    enabled,
    canvasRef,
    onImage: async (blob) => {
      try {
        const bitmap = await createImageBitmap(blob);
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(bitmap, 0, 0);
        }

        addLog(`📸 Image received: ${(blob.size / 1024).toFixed(1)} KB`);
        const { output, elapsed } = await classify(blob);

        const partA = output.slice(0, 3);
        const partB = output.slice(3, 6);
        const partC = output[6];

        const signal_idx = partA.indexOf(Math.max(...partA));
        const crosswalk_idx = partB.indexOf(Math.max(...partB));
        const line_inclination = Math.tanh(partC);

        const resultLog = `🧠 推論結果: signal=${SIGNAL_LABEL[signal_idx]}, crosswalk=${CROSSWALK_LABEL[crosswalk_idx]}, inclination=${line_inclination.toFixed(3)} (処理時間: ${elapsed.toFixed(1)} ms)`;
        addLog(resultLog);

        speak(`信号，${SIGNAL_LABEL[signal_idx]}, 横断歩道，${CROSSWALK_LABEL[crosswalk_idx]}, 傾き，${line_inclination.toFixed(3)}`);

        evaluateAndSendVibration({
            signal_idx,
            crosswalk_idx,
            line_inclination,
        });

      } catch (err: any) {
        addLog(`❌ Error: ${err.message}`);
      }
    },
    onStatus: addLog,
    wsUrl: 'wss://localhost:4443/stream',
  });
}
