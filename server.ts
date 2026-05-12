import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3005', 10);
const app = next({ dev });
const handle = app.getRequestHandler();

interface Room {
  peers: Map<string, WebSocket>;
  createdAt: number;
}

const rooms = new Map<string, Room>();

// Cleanup stale rooms every 5 min
setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms) {
    if (now - room.createdAt > 30 * 60 * 1000 && room.peers.size === 0) {
      rooms.delete(id);
    }
  }
}, 5 * 60 * 1000);

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    if (req.url?.startsWith('/ws')) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws) => {
    let currentRoom: string | null = null;
    let peerId: string | null = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'join') {
          const roomId = msg.roomId;
          if (!rooms.has(roomId)) {
            rooms.set(roomId, { peers: new Map(), createdAt: Date.now() });
          }
          const room = rooms.get(roomId)!;

          if (room.peers.size >= 2) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
            return;
          }

          peerId = room.peers.size === 0 ? 'a' : 'b';
          currentRoom = roomId;
          room.peers.set(peerId, ws);

          ws.send(JSON.stringify({ type: 'joined', peerId, peerCount: room.peers.size }));

          // Notify other peer
          for (const [id, peer] of room.peers) {
            if (id !== peerId && peer.readyState === WebSocket.OPEN) {
              peer.send(JSON.stringify({ type: 'peer-joined' }));
            }
          }
        }

        if (['offer', 'answer', 'ice'].includes(msg.type) && currentRoom) {
          const room = rooms.get(currentRoom);
          if (!room) return;
          for (const [id, peer] of room.peers) {
            if (id !== peerId && peer.readyState === WebSocket.OPEN) {
              peer.send(JSON.stringify(msg));
            }
          }
        }
      } catch {}
    });

    ws.on('close', () => {
      if (currentRoom && peerId) {
        const room = rooms.get(currentRoom);
        if (room) {
          room.peers.delete(peerId);
          for (const [, peer] of room.peers) {
            if (peer.readyState === WebSocket.OPEN) {
              peer.send(JSON.stringify({ type: 'peer-left' }));
            }
          }
        }
      }
    });
  });

  server.listen(port, () => {
    console.log(`⚡ WebRTC SpeedTest running on http://localhost:${port}`);
  });
});