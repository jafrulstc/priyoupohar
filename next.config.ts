import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // Product media lives on a PUBLIC Cloudflare R2 bucket, so every
    // <Image> renders its raw src and the browser fetches straight from
    // Cloudflare's CDN — no /_next/image optimizer round-trip on the
    // Node server. remotePatterns stays for safety if unoptimized is
    // ever flipped back off.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "s3.filebase.io" },
      { protocol: "https", hostname: "*.s3.filebase.io" },
      { protocol: "https", hostname: "pub-e04790e99b0d41109ffc73b5345f35cd.r2.dev" },
    ],
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
