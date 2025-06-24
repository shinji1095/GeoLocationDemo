// hooks/useAudioDelay.ts
import { useEffect, useRef } from 'react';
import { useAudioPlayer } from './useAudioPlayer';

type XiaoMessage = string; // e.g., "pressed|1719204000000"

export function useAudioDelay(
  enabled: boolean,
  delayMs: number,
  playKey: string,
  audioFiles: { [key: string]: string },
  onPlay: (xiaoTs: string, reactTs: string) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const isTriggered = useRef(false);
  const { play } = useAudioPlayer(audioFiles);

  useEffect(() => {
    if (!enabled) return;

    const ws = new WebSocket('wss://localhost:4443/ctrl');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('🛰️ WebSocket connected');
      ws.send('React');
    };

    ws.onmessage = async (event) => {
      let raw = '';
      if (typeof event.data === 'string') {
        raw = event.data;
      } else if (event.data instanceof ArrayBuffer) {
        raw = new TextDecoder().decode(new Uint8Array(event.data));
      }

      const [label, xiaoTs] = raw.trim().split('|'); // "pressed|<timestamp>"

      if (label === 'pressed' && !isTriggered.current) {
        isTriggered.current = true;

        if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));

        const reactTs = Date.now().toString();
        play(playKey);
        onPlay(xiaoTs ?? '-', reactTs);

        setTimeout(() => {
          isTriggered.current = false;
        }, 300);
      }
    };

    ws.onerror = (e) => console.error('WebSocket error:', e);
    ws.onclose = () => console.log('🔌 WebSocket closed');

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [enabled, delayMs, playKey, audioFiles, play, onPlay]);

  const reset = () => {
    isTriggered.current = false;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    console.log('🔄 AudioDelay reset');
  };

  return { reset };
}
