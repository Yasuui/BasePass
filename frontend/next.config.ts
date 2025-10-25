import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../'),
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://keys.coinbase.com https://fp.coinbase.com",
              "connect-src 'self' https://*.base.org https://*.basescan.org https://keys.coinbase.com https://fp.coinbase.com https://api.coinbase.com https://api.developer.coinbase.com https://mainnet.base.org https://api.ens.domains https://*.infura.io wss://*.walletconnect.com wss://*.walletconnect.org",
              "img-src 'self' data: https: blob:",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org",
            ].join('; '),
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
