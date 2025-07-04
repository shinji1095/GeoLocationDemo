// hooks/useSufficientAccuracy.ts
import { useEffect, useRef } from 'react';
import { useAudioPlayer } from './useAudioPlayer';

type Props = {
  enabled: boolean;
  redDuration: number;         // ms
  errorRate: number;
  audioFiles: { [key: string]: string };
  onLog: (event: string, phase: string, reactTs: number) => void;
};

export function useSufficientAccuracy({
  enabled,
  redDuration,
  errorRate,
  audioFiles,
  onLog,
}: Props) {
  const wsRef            = useRef<WebSocket | null>(null);
  const redIntervalRef   = useRef<NodeJS.Timeout | null>(null);
  const greenIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const greenTimerRef    = useRef<NodeJS.Timeout | null>(null);

  const firstPressTsRef  = useRef<number | null>(null);    // 最初の押下 React 時刻
  const phaseStartRef    = useRef<number | null>(null);    // red/green 共通開始時刻
  const lastPlayTsRef    = useRef<number>(0);              // 直近再生時刻
  const phaseRunningRef  = useRef(false);                  // フェーズ開始済みフラグ

  const { play } = useAudioPlayer(audioFiles);

  const now = () => Date.now();
  const elapsedFromPress = () =>
    firstPressTsRef.current ? now() - firstPressTsRef.current : 0;

  const pickWithError = (trueLabel: string) => {
    const labels = ['red', 'green', 'crosswalk'];
    if (Math.random() < errorRate) {
      const others = labels.filter((l) => l !== trueLabel);
      return others[Math.floor(Math.random() * others.length)];
    }
    return trueLabel;
  };

  useEffect(() => {
    if (!enabled) return;

    const ws = new WebSocket('wss://localhost:4443/ctrl');
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send('React');
    };

    ws.onmessage = (ev) => {
      const raw =
        typeof ev.data === 'string'
          ? ev.data
          : new TextDecoder().decode(ev.data as ArrayBuffer);
      const [label, xiaoTs] = raw.trim().split('|');
      const reactTs = now();

      onLog('button pressed', '-', reactTs);
      if (!firstPressTsRef.current) firstPressTsRef.current = reactTs;

      if (label === 'pressed' && !phaseRunningRef.current) {
        phaseRunningRef.current = true;
        phaseStartRef.current = reactTs;

        const playRed = () => {
          const key = pickWithError('red');
          lastPlayTsRef.current = now();
          play(key);
          onLog(`played ${key}`, 'red', lastPlayTsRef.current);
        };

        playRed(); // 即時
        redIntervalRef.current = setInterval(playRed, 1500);

        setTimeout(() => {
          if (redIntervalRef.current) clearInterval(redIntervalRef.current);

          const delayToNextTick = Math.max(
            0,
            1500 - ((now() - lastPlayTsRef.current) % 1500)
          );

          setTimeout(() => startGreenPhase(), delayToNextTick);
        }, redDuration);
      }
    };

    ws.onerror = (e) => console.error(e);
    ws.onclose = () => console.log('WebSocket closed');

    return () => {
      ws.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, redDuration, errorRate, audioFiles]);

  const startGreenPhase = () => {
    phaseStartRef.current = now();

    const playGreen = () => {
      const key = pickWithError('green');
      lastPlayTsRef.current = now();
      play(key);
      onLog(`played ${key}`, 'green', lastPlayTsRef.current);
    };

    playGreen(); // 即時
    greenIntervalRef.current = setInterval(playGreen, 1500);

    greenTimerRef.current = setTimeout(() => {
      if (greenIntervalRef.current) clearInterval(greenIntervalRef.current);
      onLog('green phase ended', 'green', now());
    }, 300000);
  };

  const reset = () => {
    phaseRunningRef.current = false;
    firstPressTsRef.current = null;
    if (wsRef.current) wsRef.current.close();
    if (redIntervalRef.current) clearInterval(redIntervalRef.current);
    if (greenIntervalRef.current) clearInterval(greenIntervalRef.current);
    if (greenTimerRef.current) clearTimeout(greenTimerRef.current);
  };

  return { reset };
}
