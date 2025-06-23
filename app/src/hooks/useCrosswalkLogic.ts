import { useRef, useCallback } from 'react';
import { useClassifier } from './useClassifier';
import { useSpeak } from './useSpeak';
import { useVibrationCommand } from './useVibrationCommand';

type LogicProps = {
  enabled: boolean;
  onLog: (msg: string) => void;
};

export function useCrosswalkLogic({ enabled, onLog }: LogicProps) {
  const { classify } = useClassifier();
  const { speak } = useSpeak();
  const { evaluateAndSendVibration, resetState } = useVibrationCommand(enabled);
  const isClassifying = useRef(false);

  const handleToggle = useCallback(() => {
    if (enabled) resetState();
  }, [enabled, resetState]);

  const handleImage = useCallback(
    (blob: Blob) => {
      const imgUrl = URL.createObjectURL(blob);

      if (!isClassifying.current) {
        isClassifying.current = true;

        setTimeout(async () => {
          try {
            const { output, elapsed } = await classify(blob);
            const signalPart = output.slice(0, 3);
            const crosswalkPart = output.slice(3, 6);
            const inclinationRaw = output[6];

            const signal_idx = signalPart.indexOf(Math.max(...signalPart));
            const crosswalk_idx = crosswalkPart.indexOf(Math.max(...crosswalkPart));
            const line_inclination = Math.tanh(inclinationRaw);

            const resultLog = `推論: 信号=${signal_idx}, 横断歩道=${crosswalk_idx}, 傾き=${line_inclination.toFixed(2)} (処理: ${elapsed.toFixed(1)} ms)`;
            onLog(resultLog);

            speak(`信号${signal_idx}、横断歩道${crosswalk_idx}、傾き${line_inclination.toFixed(1)}`);
            evaluateAndSendVibration({ signal_idx, crosswalk_idx, line_inclination });
          } catch (e: any) {
            onLog(`推論エラー: ${e.message}`);
          } finally {
            isClassifying.current = false;
            URL.revokeObjectURL(imgUrl);
          }
        }, 0);
      } else {
        setTimeout(() => URL.revokeObjectURL(imgUrl), 500);
      }

      return imgUrl; // 画像URLを返して即時描画
    },
    [classify, speak, evaluateAndSendVibration, onLog]
  );

  return { handleImage, handleToggle };
}
