import type { NextConfig } from "next";
import path from "node:path";

/**
 * The frontend is the subsystem's only public origin. /api/* and the SSO
 * callback go on to the NestJS backend, so the callback registered in the
 * Core Hub (http://localhost:3002/auth/callback) and the HttpOnly session
 * cookie it sets live on the same origin as these pages.
 */
const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:4202";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, ".."),
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      { source: "/auth/callback", destination: `${BACKEND_URL}/auth/callback` },
      { source: "/auth/login", destination: `${BACKEND_URL}/auth/login` },
      { source: "/auth/logout", destination: `${BACKEND_URL}/auth/logout` },
    ];
  },
};

export default nextConfig;
