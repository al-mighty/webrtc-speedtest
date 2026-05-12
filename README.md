# WebRTC P2P Speed Test

Peer-to-peer network speed test using WebRTC DataChannel. Measures latency, bandwidth, and packet loss between two browsers connected via a lightweight WebSocket signaling server. Room-based architecture with shareable links.

**Live:** [cheslav.space/webrtc/speedtest](https://cheslav.space/webrtc/speedtest/)

## Tech Stack

- **Next.js 16** — App Router, React 19
- **WebRTC** — RTCPeerConnection + DataChannel for P2P measurement
- **WebSocket** — Custom signaling server (`ws` library)
- **TypeScript**
- **Tailwind CSS 4**
- **SVG Gauges** — Real-time animated speed visualization

## Features

- Latency measurement (RTT) via DataChannel ping/pong
- Bandwidth estimation with bulk data transfer
- Packet loss detection
- Real-time SVG gauge visualization
- Room-based connections with shareable links
- No third-party servers in the measurement path

## Getting Started

```bash
pnpm install
pnpm dev           # http://localhost:3000
```

The dev server starts both the Next.js app and the WebSocket signaling server.

### Build

```bash
pnpm build
pnpm start
```

## How It Works

1. User creates or joins a **room** via URL
2. **Signaling server** (WebSocket) exchanges SDP offers/answers and ICE candidates
3. **WebRTC DataChannel** is established directly between peers
4. Speed test runs ping/pong for latency, bulk transfers for bandwidth
5. Results displayed on animated **SVG gauges**

## Project Structure

```
webrtc-speedtest/
├── src/
│   ├── app/
│   │   ├── page.tsx        # Landing — create room
│   │   └── room/           # Room page — speed test UI
│   ├── components/
│   │   └── gauge.tsx       # SVG gauge visualization
│   ├── hooks/              # React hooks for WebRTC state
│   └── lib/
│       ├── webrtc.ts       # WebRTC connection & DataChannel logic
│       ├── speed-test.ts   # Measurement algorithms
│       └── room-id.ts      # Room ID generation
├── server.ts               # WebSocket signaling server
├── next.config.ts
├── package.json
└── Dockerfile
```

## Author

Vyacheslav Kovalev — [GitHub](https://github.com/al-mighty) · [cheslav.space](https://cheslav.space)