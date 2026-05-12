export interface LatencyResult {
  min: number;
  avg: number;
  max: number;
  jitter: number;
  samples: number[];
}

export interface BandwidthResult {
  mbps: number;
  totalBytes: number;
  durationMs: number;
}

export interface PacketLossResult {
  sent: number;
  received: number;
  lossPercent: number;
}

export interface SpeedTestResults {
  latency: LatencyResult | null;
  bandwidth: BandwidthResult | null;
  packetLoss: PacketLossResult | null;
}

export function runLatencyTest(
  channel: RTCDataChannel,
  onSample: (rtt: number) => void,
): Promise<LatencyResult> {
  return new Promise((resolve) => {
    const samples: number[] = [];
    let seq = 0;
    const total = 30;
    const pending = new Map<number, number>();

    const handler = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'pong' && pending.has(msg.seq)) {
          const rtt = performance.now() - pending.get(msg.seq)!;
          pending.delete(msg.seq);
          samples.push(rtt);
          onSample(rtt);
        }
        if (msg.type === 'ping') {
          channel.send(JSON.stringify({ type: 'pong', seq: msg.seq }));
        }
      } catch {}
    };

    channel.addEventListener('message', handler);

    const interval = setInterval(() => {
      if (seq >= total) {
        clearInterval(interval);
        setTimeout(() => {
          channel.removeEventListener('message', handler);
          if (samples.length === 0) { resolve({ min: 0, avg: 0, max: 0, jitter: 0, samples: [] }); return; }
          const min = Math.min(...samples);
          const max = Math.max(...samples);
          const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
          const jitter = samples.length > 1
            ? samples.slice(1).reduce((sum, s, i) => sum + Math.abs(s - samples[i]), 0) / (samples.length - 1)
            : 0;
          resolve({ min, avg, max, jitter, samples });
        }, 500);
        return;
      }
      pending.set(seq, performance.now());
      channel.send(JSON.stringify({ type: 'ping', seq }));
      seq++;
    }, 100);
  });
}

export function runBandwidthTest(
  channel: RTCDataChannel,
  onProgress: (mbps: number) => void,
): Promise<BandwidthResult> {
  return new Promise((resolve) => {
    const chunkSize = 64 * 1024;
    const chunk = new ArrayBuffer(chunkSize);
    const duration = 5000;
    const start = performance.now();
    let totalBytes = 0;

    // Announce test start
    channel.send(JSON.stringify({ type: 'bw-start' }));

    const sendLoop = () => {
      const now = performance.now();
      if (now - start >= duration) {
        channel.send(JSON.stringify({ type: 'bw-end', totalBytes }));
        const elapsed = now - start;
        const mbps = (totalBytes * 8) / (elapsed * 1000); // Mbps
        resolve({ mbps, totalBytes, durationMs: elapsed });
        return;
      }

      // Backpressure
      while (channel.bufferedAmount < 1024 * 1024) {
        try {
          channel.send(chunk);
          totalBytes += chunkSize;
        } catch { break; }
      }

      const elapsed = now - start;
      if (elapsed > 0) onProgress((totalBytes * 8) / (elapsed * 1000));
      setTimeout(sendLoop, 10);
    };

    sendLoop();
  });
}

export function runPacketLossTest(
  channel: RTCDataChannel,
  onProgress: (received: number, total: number) => void,
): Promise<PacketLossResult> {
  return new Promise((resolve) => {
    const total = 1000;
    const receivedSet = new Set<number>();
    let isSender = false;

    const handler = (e: MessageEvent) => {
      if (typeof e.data === 'string') {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'pl-start') {
            // We are receiver
            return;
          }
          if (msg.type === 'pl-end') {
            channel.removeEventListener('message', handler);
            const lossPercent = ((msg.total - receivedSet.size) / msg.total) * 100;
            resolve({ sent: msg.total, received: receivedSet.size, lossPercent });
            return;
          }
        } catch {}
      }
      if (e.data instanceof ArrayBuffer) {
        const view = new Uint32Array(e.data);
        receivedSet.add(view[0]);
        onProgress(receivedSet.size, total);
      }
    };

    channel.addEventListener('message', handler);

    // Become sender
    isSender = true;
    channel.send(JSON.stringify({ type: 'pl-start' }));

    let sent = 0;
    const interval = setInterval(() => {
      const batch = Math.min(50, total - sent);
      for (let i = 0; i < batch; i++) {
        const buf = new ArrayBuffer(4);
        new Uint32Array(buf)[0] = sent;
        try { channel.send(buf); } catch {}
        sent++;
      }
      if (sent >= total) {
        clearInterval(interval);
        setTimeout(() => {
          channel.send(JSON.stringify({ type: 'pl-end', total }));
          channel.removeEventListener('message', handler);
          resolve({ sent: total, received: total, lossPercent: 0 }); // Sender doesn't know loss
        }, 1000);
      }
    }, 20);
  });
}