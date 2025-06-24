// utils/csvWriter.ts
import { writeFileSync, appendFileSync, existsSync } from 'fs';
import path from 'path';

const LOG_PATH = path.join('public', 'delay_log.csv');

let lastLine = '';

export function writeLog(entry: {
  delay_ms: number;
  rating: number;
  xiao_ts: number;
  react_ts: number;
  diff_ms: number;
}) {
  const line = `${entry.delay_ms},${entry.rating},${entry.xiao_ts},${entry.react_ts},${entry.diff_ms}\n`;
  if (!existsSync(LOG_PATH)) {
    writeFileSync(LOG_PATH, 'delay_ms,rating,xiao_ts,react_ts,diff_ms\n');
  }
  appendFileSync(LOG_PATH, line);
  lastLine = line;
}

export function appendRatingToLastLog(rating: number) {
  if (!lastLine) return;
  const parts = lastLine.trim().split(',');
  if (parts.length >= 5) {
    parts[1] = String(rating);
    const updated = parts.join(',') + '\n';
    appendFileSync(LOG_PATH, updated);
    console.log('✅ Rating committed:', updated);
  }
}
