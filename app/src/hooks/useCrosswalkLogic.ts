import { useRef, useCallback } from 'react';
import { useSpeak } from './useSpeak';
import { useVibrationCommand } from './useVibrationCommand';
import { useWorkerClassifier } from './useClassifierWorker';
import { useImageStream } from './useImageStream';

type LogicProps = {
  enabled: boolean;
  onLog: (msg: string) => void;
  imgRef: React.RefObject<HTMLImageElement>;
};

export function useCrosswalkLogic({ enabled, onLog, imgRef }: LogicProps) {
  const { classify } = useWorkerClassifier();
  const { speak } = useSpeak();
  const { evaluateAndSendVibration, resetState } = useVibrationCommand(enabled);
  const isClassifying = useRef(false);

  const handleToggle = useCallback(() => {
    if (enabled) resetState();
  }, [enabled, resetState]);

  useImageStream({
    enabled,
    wsUrl: 'wss://localhost:4443/stream',
    onStatus: onLog,
    onImage: (blob: Blob) => {
      const imgUrl = URL.createObjectURL(blob);
      if (imgRef.current) imgRef.current.src = imgUrl;

      if (!isClassifying.current) {
        isClassifying.current = true;

        classify(blob).then(({ output, elapsed }) => {
          const signal_idx = output.slice(0, 3).indexOf(Math.max(...output.slice(0, 3)));
          const crosswalk_idx = output.slice(3, 6).indexOf(Math.max(...output.slice(3, 6)));
          const line_inclination = Math.tanh(output[6]);

          const resultLog = `推論: 信号=${signal_idx}, 横断歩道=${crosswalk_idx}, 傾き=${line_inclination.toFixed(2)} (処理: ${elapsed.toFixed(1)} ms)`;
          onLog(resultLog);

          speak(`信号${signal_idx}、横断歩道${crosswalk_idx}、傾き${line_inclination.toFixed(1)}`);
          evaluateAndSendVibration({ signal_idx, crosswalk_idx, line_inclination });
        }).catch((error) => {
          onLog(`推論エラー: ${error.message}`);
        }).finally(() => {
          isClassifying.current = false;
          URL.revokeObjectURL(imgUrl);
        });
      } else {
        setTimeout(() => URL.revokeObjectURL(imgUrl), 500);
      }
    }
  });

  return { handleToggle };
}
