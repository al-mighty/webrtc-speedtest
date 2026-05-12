'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createPeerConnection, createDataChannel } from '@/lib/webrtc';
import { runLatencyTest, runBandwidthTest, runPacketLossTest, type SpeedTestResults } from '@/lib/speed-test';
import { Gauge } from '@/components/gauge';

type Phase = 'waiting' | 'connecting' | 'latency' | 'bandwidth' | 'packet-loss' | 'done';

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const [phase, setPhase] = useState<Phase>('waiting');
  const [peerCount, setPeerCount] = useState(0);
  const [latency, setLatency] = useState(0);
  const [bandwidth, setBandwidth] = useState(0);
  const [packetLoss, setPacketLoss] = useState(0);
  const [results, setResults] = useState<SpeedTestResults>({ latency: null, bandwidth: null, packetLoss: null });
  const [copied, setCopied] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const isInitiator = useRef(false);

  const roomUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runTests = useCallback(async (channel: RTCDataChannel) => {
    setPhase('latency');
    const latencyResult = await runLatencyTest(channel, (rtt) => setLatency(rtt));
    setResults(r => ({ ...r, latency: latencyResult }));
    setLatency(latencyResult.avg);

    setPhase('bandwidth');
    const bwResult = await runBandwidthTest(channel, (mbps) => setBandwidth(mbps));
    setResults(r => ({ ...r, bandwidth: bwResult }));
    setBandwidth(bwResult.mbps);

    setPhase('packet-loss');
    const plResult = await runPacketLossTest(channel, (recv, total) => {
      setPacketLoss(((total - recv) / total) * 100);
    });
    setResults(r => ({ ...r, packetLoss: plResult }));
    setPacketLoss(plResult.lossPercent);

    setPhase('done');
  }, []);

  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', roomId: id }));
    };

    ws.onmessage = async (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === 'joined') {
        setPeerCount(msg.peerCount);
        isInitiator.current = msg.peerId === 'a';
      }

      if (msg.type === 'peer-joined') {
        setPeerCount(2);
        setPhase('connecting');

        if (isInitiator.current) {
          const pc = createPeerConnection(
            (candidate) => ws.send(JSON.stringify({ type: 'ice', candidate })),
            (state) => { if (state === 'failed') setPhase('waiting'); },
          );
          pcRef.current = pc;

          const channel = createDataChannel(pc, 'speedtest');
          channelRef.current = channel;

          channel.onopen = () => runTests(channel);

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ws.send(JSON.stringify({ type: 'offer', sdp: pc.localDescription }));
        }
      }

      if (msg.type === 'offer') {
        const pc = createPeerConnection(
          (candidate) => ws.send(JSON.stringify({ type: 'ice', candidate })),
        );
        pcRef.current = pc;

        pc.ondatachannel = (e) => {
          const channel = e.channel;
          channelRef.current = channel;
          channel.onopen = () => runTests(channel);
        };

        await pc.setRemoteDescription(msg.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: 'answer', sdp: pc.localDescription }));
      }

      if (msg.type === 'answer' && pcRef.current) {
        await pcRef.current.setRemoteDescription(msg.sdp);
      }

      if (msg.type === 'ice' && pcRef.current) {
        await pcRef.current.addIceCandidate(msg.candidate).catch(() => {});
      }

      if (msg.type === 'peer-left') {
        setPeerCount(1);
        setPhase('waiting');
        pcRef.current?.close();
      }
    };

    return () => {
      ws.close();
      pcRef.current?.close();
    };
  }, [id, runTests]);

  const phaseLabel: Record<Phase, string> = {
    waiting: 'Waiting for peer...',
    connecting: 'Connecting...',
    latency: 'Testing latency...',
    bandwidth: 'Testing bandwidth...',
    'packet-loss': 'Testing packet loss...',
    done: 'Complete',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-light mb-1">
        WebRTC <span className="text-[#d4ff3a] font-bold">SpeedTest</span>
      </h1>

      <div className="text-xs text-[#8b94a8] font-[family-name:var(--mono)] mb-8">
        Room: {id} · {peerCount}/2 peers
      </div>

      {phase === 'waiting' && peerCount < 2 && (
        <div className="text-center space-y-4 mb-8">
          <p className="text-[#8b94a8]">Share this link with another person:</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={roomUrl}
              className="bg-[#131829] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-2 text-sm font-[family-name:var(--mono)] text-[#8b94a8] w-80 outline-none"
            />
            <button
              onClick={copyLink}
              className="px-4 py-2 rounded-lg bg-[#d4ff3a] text-[#0a0e1a] text-sm font-bold hover:opacity-90 transition"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      <div className="text-sm text-[#8b94a8] mb-6">
        {phase !== 'done' && (
          <span className={phase === 'waiting' ? '' : 'animate-pulse'}>
            {phaseLabel[phase]}
          </span>
        )}
        {phase === 'done' && <span className="text-[#d4ff3a]">Test complete!</span>}
      </div>

      <div className="flex gap-8">
        <Gauge value={latency} max={500} unit="ms" label="Latency" invert />
        <Gauge value={bandwidth} max={100} unit="Mbps" label="Bandwidth" />
        <Gauge value={packetLoss} max={10} unit="%" label="Packet Loss" invert />
      </div>

      {phase === 'done' && results.latency && (
        <div className="mt-8 bg-[#131829] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 max-w-lg w-full">
          <h3 className="text-sm text-[#8b94a8] uppercase tracking-widest mb-4">Detailed Results</h3>
          <div className="grid grid-cols-2 gap-4 text-sm font-[family-name:var(--mono)]">
            <div>Latency (min)</div><div className="text-right">{results.latency.min.toFixed(1)} ms</div>
            <div>Latency (avg)</div><div className="text-right">{results.latency.avg.toFixed(1)} ms</div>
            <div>Latency (max)</div><div className="text-right">{results.latency.max.toFixed(1)} ms</div>
            <div>Jitter</div><div className="text-right">{results.latency.jitter.toFixed(1)} ms</div>
            {results.bandwidth && (
              <>
                <div>Bandwidth</div><div className="text-right">{results.bandwidth.mbps.toFixed(1)} Mbps</div>
                <div>Data transferred</div><div className="text-right">{(results.bandwidth.totalBytes / 1024 / 1024).toFixed(1)} MB</div>
              </>
            )}
            {results.packetLoss && (
              <>
                <div>Packets sent</div><div className="text-right">{results.packetLoss.sent}</div>
                <div>Packets received</div><div className="text-right">{results.packetLoss.received}</div>
                <div>Packet loss</div><div className="text-right">{results.packetLoss.lossPercent.toFixed(2)}%</div>
              </>
            )}
          </div>
        </div>
      )}

      <footer className="absolute bottom-6 text-xs text-[#8b94a8]">
        <a href="/" className="hover:text-[#d4ff3a] transition">← Back</a>
        {' · '}
        <a href="https://cheslav.space" className="hover:text-[#d4ff3a] transition">Vyacheslav Kovalev</a>
      </footer>
    </div>
  );
}
