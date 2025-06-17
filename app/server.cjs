// server.js
const fs = require('fs');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');

// 通常の HTTP (ws://) - Xiao 用
const httpServer = http.createServer();
const wsXiao = new WebSocket.Server({ server: httpServer, path: '/stream' });

// HTTPS (wss://) - React 用
const httpsServer = https.createServer({
  key: fs.readFileSync('./cert/key.pem'),
  cert: fs.readFileSync('./cert/cert.pem'),
});
const wsReact = new WebSocket.Server({ server: httpsServer, path: '/stream' });

// 接続とメッセージ処理（共通）
function setupWebSocket(wss, label) {
  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`📡 ${label} client connected: ${ip}`);

    ws.on('message', (data, isBinary) => {
      console.log(`🖼️ ${label} sent ${(data.length / 1024).toFixed(1)} KB`);
      // 全接続に中継
      wsXiao.clients.forEach(c => c !== ws && c.readyState === WebSocket.OPEN && c.send(data, { binary: isBinary }));
      wsReact.clients.forEach(c => c !== ws && c.readyState === WebSocket.OPEN && c.send(data, { binary: isBinary }));
    });

    ws.on('close', () => console.log(`🔌 ${label} disconnected: ${ip}`));
  });
}

setupWebSocket(wsXiao, 'Xiao');
setupWebSocket(wsReact, 'React');

httpServer.listen(4000, () => {
  console.log('🚀 ws:// listening on port 4000 (Xiao)');
});
httpsServer.listen(4443, () => {
  console.log('🔐 wss:// listening on port 4443 (React)');
});