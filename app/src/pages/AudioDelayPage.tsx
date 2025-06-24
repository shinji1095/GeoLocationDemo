import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import { useAudioDelay } from '../hooks/useAudioDelay';

const audioFiles = {
  cue: '/audio/red_signal_nanami_x1.8.mp3',
};

const AudioDelayPage: React.FC = () => {
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [delayMs, setDelayMs] = useState(0);
  const [rating, setRating] = useState('');
  const [log, setLog] = useState<
    { delay: number; rating: string; xiaoTs: string; reactTs: string; diffMs: number }[]
  >([]);

  // 一時保持用（最新のpressedを保存）
  const [latestXiaoTs, setLatestXiaoTs] = useState('');
  const [latestReactTs, setLatestReactTs] = useState('');

  const handlePlay = (xiaoTs: string, reactTs: string) => {
    setLatestXiaoTs(xiaoTs);
    setLatestReactTs(reactTs);
    setRating('');  // 入力の初期化（任意）
  };

  const handleConfirmRating = () => {
    if (!latestXiaoTs || !latestReactTs) {
      alert('再生が発生していません');
      return;
    }
    const diff = parseInt(latestReactTs) - parseInt(latestXiaoTs);
    setLog((prev) => [
      ...prev,
      {
        delay: delayMs,
        rating: rating || '-',
        xiaoTs: latestXiaoTs,
        reactTs: latestReactTs,
        diffMs: diff,
      },
    ]);
    // 入力状態リセット
    setLatestXiaoTs('');
    setLatestReactTs('');
    setRating('');
  };

  const { reset } = useAudioDelay(
    isMeasuring,
    delayMs,
    'cue',
    audioFiles,
    handlePlay
  );

  const handleStart = () => {
    setLog([]);
    setIsMeasuring(true);
  };

  const handleStop = () => {
    reset();
    setIsMeasuring(false);
    setLatestXiaoTs('');
    setLatestReactTs('');
  };

  const handleExportCSV = () => {
    const header = 'delay_ms,rating,xiao_ts,react_ts,diff_ms\n';
    const body = log
      .map((l) => `${l.delay},${l.rating},${l.xiaoTs},${l.reactTs},${l.diffMs}`)
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'audio_delay_log.csv');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <h2>Audio Delay Measurement (Low Latency)</h2>

      <div>
        <label>Delay (ms): </label>
        <input
          type="number"
          value={delayMs}
          onChange={(e) => setDelayMs(Number(e.target.value))}
        />
      </div>

      <div>
        <button onClick={handleStart} disabled={isMeasuring}>計測開始</button>
        <button onClick={handleStop} disabled={!isMeasuring}>計測終了</button>
      </div>

      <div>
        <label>評価: </label>
        <input
          type="text"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          disabled={!isMeasuring}
        />
      </div>

      {/* ✅ 評価確定ボタン */}
      <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
        <button onClick={handleConfirmRating} disabled={!isMeasuring || !latestXiaoTs}>
          評価確定
        </button>
      </div>

      <button onClick={handleExportCSV} disabled={log.length === 0}>CSV出力</button>

      <h4>ログ</h4>
      <ul>
        {log.map((entry, idx) => (
          <li key={idx}>
            遅延: {entry.delay} ms, 評価: {entry.rating}, Xiao: {entry.xiaoTs}, 再生: {entry.reactTs}, 実測遅延: {entry.diffMs} ms
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AudioDelayPage;
