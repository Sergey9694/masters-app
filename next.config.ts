import type { NextConfig } from "next";

const nextConfig: any = {
  output: "standalone",
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.io", "*.loca.lt"],

  experimental: {
    // Allow large photo uploads from phones (iPhone photos 3-5 MB each, up to 5 photos)
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  // S6: Enterprise Security Headers
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "ALLOW-FROM https://web.telegram.org" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(self)",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https://t.me https://*.telegram.org",
            "font-src 'self'",
            "connect-src 'self' https://telegram.org https://*.telegram.org",
            "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org",
          ].join("; "),
        },
      ],
    },
  ],
};

export default nextConfig;
