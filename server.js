const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const filePath = req.url === '/' ? '/index.html' : req.url;
  const ext = path.extname(filePath);
  const contentType = ext === '.js' ? 'text/javascript' : 'text/html';

  fs.readFile(path.join(__dirname, filePath), (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

const wss = new WebSocketServer({ server });
const clients = new Map();

function getClientList(excludeId) {
  const list = [];
  for (const [id, client] of clients.entries()) {
    if (id !== excludeId) {
      list.push({ id, name: client.name, device: client.device });
    }
  }
  return list;
}

wss.on('connection', (ws, req) => {
  const id = Math.random().toString(36).substring(2, 9);
  const userAgent = req.headers['user-agent'] || '';
  
  let device = 'Desktop';
  if (/android/i.test(userAgent)) device = 'Android';
  else if (/ipad|iphone|ipod/i.test(userAgent)) device = 'iOS';
  else if (/mac/i.test(userAgent)) device = 'Mac';
  else if (/linux/i.test(userAgent)) device = 'Linux';
  else if (/win/i.test(userAgent)) device = 'Windows';

  const names = ['Falcon', 'Otter', 'Cheetah', 'Eagle', 'Panda', 'Fox', 'Wolf', 'Hawk', 'Dolphin'];
  const name = names[Math.floor(Math.random() * names.length)] + '-' + id.slice(0, 3);

  clients.set(id, { ws, name, device });

  ws.send(JSON.stringify({ type: 'init', id, name, device }));

  for (const [clientId, client] of clients.entries()) {
    client.ws.send(JSON.stringify({ type: 'peers', peers: getClientList(clientId) }));
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const target = clients.get(data.target);
      if (target && target.ws.readyState === 1) {
        data.sender = id;
        target.ws.send(JSON.stringify(data));
      }
    } catch (e) {
      console.error(e);
    }
  });

  ws.on('close', () => {
    clients.delete(id);
    for (const [clientId, client] of clients.entries()) {
      client.ws.send(JSON.stringify({ type: 'peers', peers: getClientList(clientId) }));
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`DropWave running on port ${PORT}`);
});