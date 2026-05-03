const nextConfig = {
  output: "standalone",
  transpilePackages: ["@uslugi/shared-types", "@uslugi/validation"],
  allowedDevOrigins: ["*.loca.lt"],

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
        { key: "X-Frame-Options", value: "DENY" },
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
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org https://api-maps.yandex.ru https://*.api-maps.yandex.ru https://yastatic.net https://*.yastatic.net https://yandex.ru https://*.yandex.ru https://yandex.net https://*.yandex.net",
            "style-src 'self' 'unsafe-inline' blob:",
            "img-src 'self' data: blob: https://t.me https://*.telegram.org https://*.telesco.pe https://*.maps.yandex.net https://yandex.ru https://*.yandex.ru https://yandex.net https://*.yandex.net https://api-maps.yandex.ru https://*.api-maps.yandex.ru https://yastatic.net https://*.yastatic.net",
            "font-src 'self' data: https://*.telegram.org https://fonts.gstatic.com",
            "connect-src 'self' ws: wss: https://telegram.org https://*.telegram.org https://api-maps.yandex.ru https://*.api-maps.yandex.ru https://*.maps.yandex.net https://yandex.ru https://*.yandex.ru https://yandex.net https://*.yandex.net https://geocode-maps.yandex.ru https://suggest-maps.yandex.ru https://yastatic.net https://*.yastatic.net",
            "worker-src 'self' blob:",
            "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org",
          ].join("; "),
        },
      ],
    },
  ],
};

export default nextConfig;
