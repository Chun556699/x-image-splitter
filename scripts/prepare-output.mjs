// Build .vercel/output (Build Output API v3) for `vercel deploy --prebuilt`.
// Injects security headers via a catch-all route (continue: true → falls through to static files).
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

const OUT = ".vercel/output";

const SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "connect-src 'self' https://events.vercount.one",
    "font-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=(), clipboard-write=(), payment=(), usb=()",
  "X-DNS-Prefetch-Control": "off",
};

rmSync(OUT, { recursive: true, force: true });
mkdirSync(`${OUT}/static`, { recursive: true });
cpSync("dist", `${OUT}/static`, { recursive: true });

writeFileSync(
  `${OUT}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [{ src: "/(.*)", headers: SECURITY_HEADERS, continue: true }],
    },
    null,
    2,
  ) + "\n",
);

console.log(".vercel/output ready with security headers");
