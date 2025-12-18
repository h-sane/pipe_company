/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  compress: true,
  reactStrictMode: true,
  // FIX: Use Regex to match the missing CSS file regardless of its path
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
      };
      
      // Ignore any import ending in default-stylesheet.css
      config.ignoreWarnings = [{ module: /default-stylesheet\.css$/ }];
      
      // Force it to resolve to false (empty module)
      config.resolve.alias['./default-stylesheet.css'] = false;
      
      // Fallback: If the above alias fails, this plugin replaces the module request
      config.plugins.push(new (class {
        apply(compiler) {
          compiler.hooks.normalModuleFactory.tap("IgnoreCssPlugin", (nmf) => {
            nmf.hooks.beforeResolve.tap("IgnoreCssPlugin", (result) => {
              if (result.request.endsWith("default-stylesheet.css")) {
                result.request = "false";
              }
            });
          });
        }
      })());
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=120',
          },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig