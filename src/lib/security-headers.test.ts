import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CONTENT_SECURITY_POLICY, SECURITY_HEADERS, withSecurityHeaders } from "./security-headers";

const vercel = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../vercel.json"), "utf8"),
) as {
  headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
};

describe("security headers", () => {
  it("includes the browser headers the production audit asked for", () => {
    expect(SECURITY_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
    expect(SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY");
    expect(SECURITY_HEADERS["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(SECURITY_HEADERS["Permissions-Policy"]).toContain("camera=()");
    expect(SECURITY_HEADERS["Permissions-Policy"]).toContain("geolocation=()");
    expect(SECURITY_HEADERS["Content-Security-Policy"]).toBe(CONTENT_SECURITY_POLICY);
  });

  it("allows Turnstile, fonts, and the waitlist script without opening the rest of the web", () => {
    expect(CONTENT_SECURITY_POLICY).toContain("https://challenges.cloudflare.com");
    expect(CONTENT_SECURITY_POLICY).toContain("https://fonts.googleapis.com");
    expect(CONTENT_SECURITY_POLICY).toContain("https://fonts.gstatic.com");
    expect(CONTENT_SECURITY_POLICY).toContain("https://script.google.com");
    expect(CONTENT_SECURITY_POLICY).toContain("https://script.googleusercontent.com");
    expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("form-action 'self'");
    expect(CONTENT_SECURITY_POLICY).not.toContain("*");
  });

  it("fills missing headers without overwriting ones already on the response", () => {
    const response = withSecurityHeaders(
      new Response("ok", { headers: { "X-Frame-Options": "SAMEORIGIN" } }),
    );
    expect(response.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("keeps vercel.json in sync with the SSR header map", () => {
    const applied = vercel.headers[0]?.headers ?? [];
    const byKey = Object.fromEntries(applied.map((header) => [header.key, header.value]));
    expect(byKey).toEqual(SECURITY_HEADERS);
  });
});
