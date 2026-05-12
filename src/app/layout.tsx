import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--mono' });

export const metadata: Metadata = {
  title: 'WebRTC Speed Test — P2P Latency, Bandwidth & Packet Loss',
  description: 'Measure real connection quality between two browsers via WebRTC DataChannel',
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
