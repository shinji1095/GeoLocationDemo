const fs = require('fs');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');

// Control state
let ctrlXiao = null;
let ctrlReact = null;

// HTTP server for Xiao
const httpServer = http.createServer();
const wsXiao = new WebSocket.Server({  noServer: true  });
const wsCtrl = new WebSocket.Server({  noServer: true  });

// HTTPS server for React
const httpsServer = https.createServer({
  key: fs.readFileSync('./cert/localhost+1-key.pem'),
  cert: fs.readFileSync('./cert/localhost+1.pem'),
});

// WebSocket servers for React (stream + control), using manual upgrade
const wssReact = new WebSocket.Server({ noServer: true });
const wssCtrl = new WebSocket.Server({ noServer: true });

// --- Manual routing for wss:// requests ---
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
    socket.destroy(); // Reject unknown paths
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
    socket.destroy(); // Reject unknown paths
  }
});

// --- Streaming relay setup (Xiao <-> React) ---
function setupWebSocket(wss, label) {
  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`📡 ${label} client connected: ${ip}`);

    ws.on('message', (data, isBinary) => {
      console.log(`🖼️ ${label} sent ${(data.length / 1024).toFixed(1)} KB`);

      // Relay to all clients
      wsXiao.clients.forEach(c =>
        c !== ws && c.readyState === WebSocket.OPEN && c.send(data, { binary: isBinary })
      );
      wssReact.clients.forEach(c =>
        c !== ws && c.readyState === WebSocket.OPEN && c.send(data, { binary: isBinary })
      );
    });

    ws.on('error', (err) => {
      console.error('Xiao WebSocket error:', err);
    });

    ws.on('close', () => {
      console.log(`🔌 ${label} disconnected: ${ip}`);
    });
  });
}

// Setup streaming servers
setupWebSocket(wsXiao, 'Xiao');
setupWebSocket(wssReact, 'React');

// --- Control channel (React <-> Xiao) ---
wssCtrl.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`🎮 CTRL connected: ${ip}`);

  ws.once('message', (data, isBinary) => {
    const message = !isBinary ? data.toString() : '[binary]';
    console.log(`[CTRL] first message: ${message}`);

    if (!isBinary && message === 'XIAO') {
      ctrlXiao = ws;
      console.log('✅ Xiao registered on /ctrl');
    } else {
      ctrlReact = ws;
      console.log('✅ React registered on /ctrl');

      // React → Xiao control message forwarding
      ws.on('message', (data2, isBinary2) => {
        if (ctrlXiao && ctrlXiao.readyState === WebSocket.OPEN) {
          ctrlXiao.send(data2, { binary: isBinary2 });
          console.log(`🔁 sent control to Xiao: 0x${Buffer.from(data2)[0].toString(16)}`);
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


// --- Start servers ---
httpServer.listen(4000, () => {
  console.log('🚀 ws:// listening on port 4000 (Xiao)');
});
httpsServer.listen(4443, () => {
  console.log('🔐 wss:// listening on port 4443 (React)');
});
