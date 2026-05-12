import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--mono' });

export const metadata: Metadata = {
  title: {
    default: 'WebRTC Speed Test — P2P Latency, Bandwidth & Packet Loss',
    template: '%s | WebRTC SpeedTest',
  },
  description: 'Measure real connection quality between two browsers via peer-to-peer WebRTC DataChannel. Test latency, bandwidth and packet loss with no servers in the middle. Built by Vyacheslav Kovalev.',
  keywords: ['WebRTC', 'Speed Test', 'P2P', 'Latency', 'Bandwidth', 'Packet Loss', 'DataChannel', 'TypeScript', 'Next.js', 'Vyacheslav Kovalev'],
  openGraph: {
    title: 'WebRTC Speed Test — P2P Latency, Bandwidth & Packet Loss',
    description: 'Measure real connection quality between two browsers via P2P WebRTC DataChannel. Latency, bandwidth and packet loss testing.',
    url: 'https://cheslav.space/webrtc/speedtest/',
    siteName: 'WebRTC SpeedTest',
    images: [{ url: 'https://cheslav.space/og-image.jpg', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WebRTC Speed Test — P2P Latency, Bandwidth & Packet Loss',
    description: 'Measure real P2P connection quality via WebRTC DataChannel.',
    images: ['https://cheslav.space/og-image.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body className={`${inter.variable} ${jetbrains.variable} bg-[#0a0e1a] text-[#f4f1ea] min-h-screen font-[family-name:var(--font-sans)]`}>
        {children}
      </body>
    </html>
  );
}
