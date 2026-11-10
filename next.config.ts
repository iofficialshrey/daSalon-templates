import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

/**
 * Local development without Partner API credentials: point DASALON_DEV_PROXY_URL
 * at a deployed Brand Home to read its live menu and availability. Appointment
 * creation is never proxied, so local work cannot create real bookings.
 */
const devProxy = process.env.NODE_ENV === "development"
  ? process.env.DASALON_DEV_PROXY_URL?.trim().replace(/\/$/, "")
  : undefined;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // 75 stays for templates that use the default quality.
    qualities: [60, 75],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Film files carry a version in their names, so browsers may keep them for a year.
      {
        source: "/brand-home-1/scroll-film/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Atelier's film and art also carry a version (.v1) in every file name.
      {
        source: "/brand-home-2/film/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/brand-home-2/art/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Serein's film and art carry a version (.v1) in every file name.
      {
        source: "/brand-home-3/film/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/brand-home-3/art/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Paloma's film, posters and cyanotype art carry a version (.v1 or .v2) in every file name.
      {
        source: "/brand-home-4/film/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/brand-home-4/art/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  async rewrites() {
    if (!devProxy) return [];
    return {
      beforeFiles: ["bootstrap", "time-slots"].map((route) => ({
        source: `/api/dasalon/${route}`,
        destination: `${devProxy}/api/dasalon/${route}`,
      })),
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
