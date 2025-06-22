import { useEffect, useRef, useState } from 'react';

export function useStreaming(streamUrl: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const urlRef = useRef<string | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    const ws = new WebSocket(streamUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('📡 Connected to stream:', streamUrl);
    };

    ws.onmessage = (event) => {
      const blob = new Blob([event.data], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);

      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;

      setImgSrc(url);
    };

    ws.onerror = (e) => {
      console.error('❌ WebSocket error', e);
    };

    ws.onclose = () => {
      console.log('🔌 Stream disconnected');
    };

    return () => {
      ws.close();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [streamUrl]);

  return { imgSrc };
}
