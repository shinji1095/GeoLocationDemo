import React, { useRef, useState, useEffect } from "react";
import { useImageStream } from "../hooks/useImageStream";
import { useClassifierWorker } from "../hooks/useClassifierWorker";
import { useSpeak } from "../hooks/useSpeak";
import { useVibrationCommand } from "../hooks/useVibrationCommand";

const StreamingPage: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const { classify, result, ready } = useClassifierWorker();
  const { speak } = useSpeak();
  const { evaluateAndSendVibration, resetState } = useVibrationCommand(enabled);

  const latestBlob = useRef<Blob | null>(null);
  const classifying = useRef(false);

  const addLog = (msg: string) => {
    setLogs((prev) => [new Date().toLocaleTimeString() + " " + msg, ...prev].slice(0, 200));
  };

  useImageStream({
    enabled,
    wsUrl: "wss://localhost:4443/stream",
    onStatus: addLog,
    onImage: (blob) => {
      latestBlob.current = blob;

      // 画像表示更新
      const url = URL.createObjectURL(blob);
      if (imgRef.current) {
        const old = imgRef.current.src;
        imgRef.current.src = url;
        if (old) URL.revokeObjectURL(old);
      }

      addLog(`📷 ${(blob.size / 1024).toFixed(1)} KB`);
    },
  });

  // 推論処理 (100msごとのポーリング)
  useEffect(() => {
    if (!enabled || !ready) return;

    const timer = setInterval(() => {
      if (!latestBlob.current || classifying.current) return;

      const blob = latestBlob.current;
      latestBlob.current = null;
      classifying.current = true;

      classify(blob);
    }, 100);

    return () => clearInterval(timer);
  }, [enabled, ready]);

  // 推論結果を処理
  useEffect(() => {
    if (!result) return;

    const { output, elapsed } = result;

    const signal_idx = output.slice(0, 3).indexOf(Math.max(...output.slice(0, 3)));
    const crosswalk_idx = output.slice(3, 6).indexOf(Math.max(...output.slice(3, 6)));
    const line_inclination = Math.tanh(output[6]);

    const log = `🧠 推論: 信号=${signal_idx}, 横断=${crosswalk_idx}, 傾き=${line_inclination.toFixed(2)} (${elapsed.toFixed(1)} ms)`;
    addLog(log);

    speak(`信号${signal_idx}、横断歩道${crosswalk_idx}`);
    evaluateAndSendVibration({ signal_idx, crosswalk_idx, line_inclination });

    classifying.current = false;
  }, [result]);

  const toggle = () => {
    if (enabled) resetState();
    setEnabled((prev) => !prev);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Crosswalk Support</h2>
      <button onClick={toggle}>{enabled ? "支援停止" : "支援開始"}</button>
      <img
        ref={imgRef}
        alt="stream"
        style={{
          display: "block",
          margin: "1rem auto",
          maxWidth: "100%",
          border: "1px solid #666",
        }}
      />
      <textarea
        readOnly
        value={logs.join("\n")}
        style={{
          width: "100%",
          height: "200px",
          fontFamily: "monospace",
          marginTop: "1rem",
        }}
      />
    </div>
  );
};

export default StreamingPage;
