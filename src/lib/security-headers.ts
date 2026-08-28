/**
 * Browser security headers for the PreBase marketing site.
 *
 * Applied on SSR responses in server.ts and on every Vercel route via vercel.json
 * so static assets get the same policy.
 *
 * CSP allows Cloudflare Turnstile, Google Fonts, and the Apps Script waitlist
 * endpoint. script-src includes 'unsafe-inline' for the theme bootstrap and
 * TanStack Start hydration. frame-ancestors none matches X-Frame-Options DENY.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://challenges.cloudflare.com https://script.google.com https://script.googleusercontent.com",
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

export const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
};

export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    // CSP is production-only here so Vite HMR and inline dev scripts keep working.
    // Vercel still sends the full policy on every route via vercel.json.
    if (key === "Content-Security-Policy" && import.meta.env.DEV) continue;
    if (!headers.has(key)) headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
