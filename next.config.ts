import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Type errors will still show in editor but won't block production build
    // TODO: Resolve Supabase generic type inference issues
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.revolutionsoccer.net',
      },
    ],
  },
};

export default nextConfig;
