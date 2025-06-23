import { useEffect, useRef } from 'react';

type VibrationInput = {
  signal_idx: number;
  crosswalk_idx: number;
  line_inclination: number;
};

export function useVibrationCommand(enabled: boolean) {
  const wsRef = useRef<WebSocket | null>(null);
  const currentState = useRef<boolean | null>(null);

  const redCount = useRef(0);
  const greenCount = useRef(0);
  const stopCount = useRef(0);
  const vibrationEnabled = useRef(false);
  const vibrateDisabled = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const ws = new WebSocket('wss://localhost:4443/ctrl');
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('🛰️ Connected to /ctrl');
      ws.send('React');
    };

    ws.onclose = () => {
      console.log('🔌 /ctrl connection closed');
    };

    ws.onerror = (e) => {
      console.error('/ctrl error:', e);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [enabled]);

  const sendVibration = (on: boolean) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      if (currentState.current === on) return;
      const buf = new Uint8Array([on ? 0x01 : 0x00]);
      ws.send(buf);
      currentState.current = on;
      console.log(`📤 vibration ${on ? 'ON' : 'OFF'} sent`);
    }
  };

  const evaluateAndSendVibration = ({ signal_idx, crosswalk_idx, line_inclination }: VibrationInput) => {
    // 停止条件: crosswalk_idx === 2 が10連続で振動無効
    if (crosswalk_idx === 2) {
      stopCount.current++;
      if (stopCount.current >= 10) {
        vibrateDisabled.current = true;
      }
    } else {
      stopCount.current = 0;
    }

    if (vibrateDisabled.current) {
      sendVibration(false);
      return;
    }

    // 赤信号
    if (signal_idx === 0) {
      redCount.current++;
      greenCount.current = 0;
      if (redCount.current >= 5) {
        vibrationEnabled.current = true;
      }
    }
    // 緑信号
    else if (signal_idx === 1) {
      greenCount.current++;
      redCount.current = 0;

      if (greenCount.current >= 5) {
        vibrationEnabled.current = false;
      }

      if (Math.abs(line_inclination) > 10) {
        vibrationEnabled.current = true;
      }
    }
    // その他
    else {
      redCount.current = 0;
      greenCount.current = 0;
    }

    sendVibration(vibrationEnabled.current);
  };

  const resetState = () => {
    redCount.current = 0;
    greenCount.current = 0;
    stopCount.current = 0;
    vibrationEnabled.current = false;
    vibrateDisabled.current = false;
    currentState.current = null;
    sendVibration(false);
    console.log('🔄 vibration state reset');

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  return { evaluateAndSendVibration, resetState };
}
