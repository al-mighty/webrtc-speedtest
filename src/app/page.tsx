'use client';

import { useRouter } from 'next/navigation';
import { generateRoomId } from '@/lib/room-id';

export default function Home() {
  const router = useRouter();

  const handleCreate = () => {
    const id = generateRoomId();
    router.push(`/room/${id}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="text-4xl font-light mb-2">
        WebRTC <span className="text-[#d4ff3a] font-bold">SpeedTest</span>
      </h1>
      <p className="text-[#8b94a8] text-center max-w-md mb-10">
        Measure real latency, bandwidth and packet loss between two browsers via P2P WebRTC DataChannel. No servers in the middle.
      </p>

      <button
        onClick={handleCreate}
        className="px-8 py-4 rounded-lg bg-[#d4ff3a] text-[#0a0e1a] font-bold text-lg hover:opacity-90 transition"
      >
        Create Room
      </button>

      <div className="mt-16 grid grid-cols-3 gap-12 text-center max-w-lg">
        <div>
          <div className="text-3xl mb-2">⏱</div>
          <div className="text-sm font-medium">Latency</div>
          <div className="text-xs text-[#8b94a8] mt-1">Ping-pong RTT</div>
        </div>
        <div>
          <div className="text-3xl mb-2">📶</div>
          <div className="text-sm font-medium">Bandwidth</div>
          <div className="text-xs text-[#8b94a8] mt-1">Throughput Mbps</div>
        </div>
        <div>
          <div className="text-3xl mb-2">📦</div>
          <div className="text-sm font-medium">Packet Loss</div>
          <div className="text-xs text-[#8b94a8] mt-1">Reliability %</div>
        </div>
      </div>

      <footer className="absolute bottom-6 text-xs text-[#8b94a8]">
        <a href="https://cheslav.space" className="hover:text-[#d4ff3a] transition">Vyacheslav Kovalev</a>
        {' · '}
        <a href="https://github.com/al-mighty/webrtc-speedtest" className="hover:text-[#d4ff3a] transition">Source</a>
      </footer>
    </div>
  );
}
