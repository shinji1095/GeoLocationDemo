const fs = require('fs');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');

// --- Control state
let ctrlXiao = null;
let ctrlReact = null;

// --- HTTP (ws://) server for Xiao
const httpServer = http.createServer();
const wsXiao = new WebSocket.Server({ noServer: true });
const wsCtrl = new WebSocket.Server({ noServer: true });

// --- HTTPS (wss://) server for React
const httpsServer = https.createServer({
  key: fs.readFileSync('./cert/localhost+1-key.pem'),
  cert: fs.readFileSync('./cert/localhost+1.pem'),
});
const wssReact = new WebSocket.Server({ noServer: true });
const wssCtrl = new WebSocket.Server({ noServer: true });

// --- Manual routing for upgrade requests
httpServer.on('upgrade', (req, socket, head) => {
  const { url } = req;
  if (url === '/stream') {
    wsXiao.handleUpgrade(req, socket, head, (ws) => {
      wsXiao.emit('connection', ws, req);
    });
  } else if (url === '/ctrl') {
    wsCtrl.handleUpgrade(req, socket, head, (ws) => {
      wsCtrl.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

httpsServer.on('upgrade', (req, socket, head) => {
  const { url } = req;
  if (url === '/stream') {
    wssReact.handleUpgrade(req, socket, head, (ws) => {
      wssReact.emit('connection', ws, req);
    });
  } else if (url === '/ctrl') {
    wssCtrl.handleUpgrade(req, socket, head, (ws) => {
      wssCtrl.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

// --- Streaming relay (Xiao <-> React)
function setupWebSocket(wss, label) {
  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`📡 ${label} client connected: ${ip}`);

    ws.on('message', (data, isBinary) => {
      wsXiao.clients.forEach(c =>
        c !== ws && c.readyState === WebSocket.OPEN && c.send(data, { binary: isBinary })
      );
      wssReact.clients.forEach(c =>
        c !== ws && c.readyState === WebSocket.OPEN && c.send(data, { binary: isBinary })
      );
    });

    ws.on('error', (err) => {
      console.error(`${label} WebSocket error:`, err);
    });

    ws.on('close', () => {
      console.log(`🔌 ${label} disconnected: ${ip}`);
    });
  });
}

setupWebSocket(wsXiao, 'Xiao');
setupWebSocket(wssReact, 'React');

// --- Xiao (ws://ctrl)
wsCtrl.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`🎮 CTRL (XIAO) connected on HTTP: ${ip}`);

  ws.once('message', (data, isBinary) => {
    const message = !isBinary ? data.toString() : '[binary]';
    console.log(`[CTRL] first message: ${message}`);

    if (!isBinary && message === 'XIAO') {
      ctrlXiao = ws;
      console.log('✅ Xiao registered on /ctrl');

      // --- 🔄 Send server time for sync
      const now = Date.now();
      ws.send(JSON.stringify({ type: 'server_time', ts: now }));
      console.log(`⏱️ Sent server time: ${now}`);

      ctrlXiao.on('message', (data, isBinary) => {
        if (ctrlReact && ctrlReact.readyState === WebSocket.OPEN) {
          ctrlReact.send(data, { binary: isBinary });
          console.log(`🔁 Xiao → React: ${data.toString()}`);
        }
      });
    }
  });
});

// --- React (wss://ctrl)
wssCtrl.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`CTRL connected: ${ip}`);

  ws.once('message', (data, isBinary) => {
    const message = !isBinary ? data.toString() : '[binary]';
    console.log(`[CTRL] first message: ${message}`);

    if (!isBinary && message === 'XIAO') {
      ctrlXiao = ws;
      console.log('Xiao registered on /ctrl');

      ctrlXiao.on('message', (data, isBinary) => {
        if (ctrlReact && ctrlReact.readyState === WebSocket.OPEN) {
          ctrlReact.send(data, { binary: isBinary });
          console.log(`🔁 Forwarded to React: ${data.toString()}`);
        }
      });

    } else {
      ctrlReact = ws;
      console.log('React registered on /ctrl');

      ctrlReact.on('message', (data, isBinary) => {
        if (ctrlXiao && ctrlXiao.readyState === WebSocket.OPEN) {
          ctrlXiao.send(data, { binary: isBinary });
          console.log(`sent control to Xiao: ${data.toString('hex')}`);
        }
      });
    }
  });

  ws.on('close', () => {
    console.log(`CTRL disconnected: ${ip}`);
    if (ws === ctrlXiao) ctrlXiao = null;
    if (ws === ctrlReact) ctrlReact = null;
  });
});

// --- Start servers
httpServer.listen(4000, () => {
  console.log('ws:// listening on port 4000 (Xiao)');
});
httpsServer.listen(4443, () => {
  console.log('wss:// listening on port 4443 (React)');
});
