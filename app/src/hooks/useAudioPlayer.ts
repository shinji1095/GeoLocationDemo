// hooks/useAudioPlayer.ts
import { useEffect, useRef } from 'react';

type AudioMap = {
  [key: string]: string; // 例: { click: '/audio/click.mp3', alert: '/audio/alert.mp3' }
};

export function useAudioPlayer(audioFiles: AudioMap) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Map<string, AudioBuffer>>(new Map());

  useEffect(() => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const loadAll = async () => {
      for (const [key, url] of Object.entries(audioFiles)) {
        try {
          const res = await fetch(url);
          const arrayBuffer = await res.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          buffersRef.current.set(key, audioBuffer);
          console.log(`🎧 Loaded: ${key}`);
        } catch (err) {
          console.error(`❌ Failed to load audio "${key}":`, err);
        }
      }
    };

    loadAll();

    return () => {
      ctx.close();
    };
  }, [audioFiles]);

  const play = (key: string) => {
    const ctx = audioCtxRef.current;
    const buffer = buffersRef.current.get(key);
    if (!ctx || !buffer) {
      console.warn(`⚠️ Audio not ready for key: ${key}`);
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
    console.log(`🔊 Played audio: ${key}`);
  };

  return { play };
}
