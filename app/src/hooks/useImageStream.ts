import { useEffect, useRef } from 'react';

interface UseImageStreamProps {
  enabled: boolean;
  onImage: (blob: Blob) => void;
  onStatus?: (msg: string) => void;
  wsUrl?: string;
}

/**
 * Xiao ESP32S3 から画像を WebSocket 経由で非同期受信するフック
 * - binaryType: 'blob'
 * - onImage(blob) に画像を通知
 * - onStatus(msg) で状態ログ出力（任意）
 */
export const useImageStream = ({
  enabled,
  onImage,
  onStatus,
  wsUrl = 'wss://localhost:4000/stream', // Xiao ESP32S3 Sense's IP
}: UseImageStreamProps) => {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'blob';
    ws.onopen = () => onStatus?.('WebSocket connected');
    ws.onclose = () => onStatus?.('WebSocket closed');
    ws.onerror = () => onStatus?.('WebSocket error');
    ws.onmessage = (event) => {
      const blob = event.data as Blob;
      onImage(blob);
    };

    wsRef.current = ws;
    return () => {
      ws.close();
      onStatus?.('WebSocket cleanup');
    };
  }, [enabled, wsUrl]);
};