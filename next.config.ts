import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: process.env.NODE_ENV === 'production' ? "/webrtc/speedtest" : "",
};

export default nextConfig;