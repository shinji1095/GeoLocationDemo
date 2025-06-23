import { useEffect, useRef } from 'react';

type ImageStreamProps = {
  enabled: boolean;
  wsUrl: string;
  onImage: (blob: Blob) => void;
  onStatus?: (msg: string) => void;
};

export function useImageStream({ enabled, wsUrl, onImage, onStatus }: ImageStreamProps) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      onStatus?.('🔌 WebSocket connected');
    };

    ws.onmessage = (event) => {
      const blob = new Blob([event.data], { type: 'image/jpeg' });
      onImage(blob); // すぐに画像表示へ渡す
    };

    ws.onclose = () => onStatus?.('🔌 WebSocket closed');
    ws.onerror = () => onStatus?.('WebSocket error');

    return () => {
      ws.close();
      wsRef.current = null;
      onStatus?.('🧹 WebSocket cleanup');
    };
  }, [enabled, wsUrl]);
}
