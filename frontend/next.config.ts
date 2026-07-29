import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable production gzip/brotli compression
  compress: true,

  // Hide technology footprint from attackers
  poweredByHeader: false,

  // Transpile ZegoCloud package for Next.js compatibility
  transpilePackages: ["@zegocloud/zego-uikit-prebuilt"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        // Local backend serving doctor avatars & clinic images in development
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/**",
      },
      {
        // VietQR dynamic QR codes for payment page
        protocol: "https",
        hostname: "img.vietqr.io",
        pathname: "/**",
      },
      {
        // Supabase Storage for uploaded files
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/**",
      },
      {
        // Google OAuth avatars (lh3.googleusercontent.com)
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        // Other Google user content domains
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },

  // Inject secure browser headers globally
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            // Allow camera, microphone, display-capture for ZegoCloud video calls
            value: "camera=(self), microphone=(self), display-capture=(self), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
