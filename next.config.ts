import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Allow ngrok domains for local dev tunneling
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.ngrok-free.dev",
  ],

  images: {
    remotePatterns: [
      // Clerk avatars
      { protocol: "https", hostname: "img.clerk.com" },
      // Supabase storage
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
}

export default nextConfig