/**
 * Waitlist submission.
 *
 * Architecture: website -> Google Apps Script web app -> Google Sheet.
 * The endpoint is configured through VITE_WAITLIST_ENDPOINT; nothing is
 * hardcoded here. See docs/WAITLIST_SETUP.md.
 */

export type WaitlistRole = "" | "Developer" | "Student" | "Founder / Team" | "Other";

export type WaitlistInput = {
  email: string;
  role?: WaitlistRole;
  /** hidden honeypot field — must stay empty */
  website?: string;
};

export type WaitlistResult =
  | { ok: true; status: "created" | "already_registered" }
  | { ok: false; reason: "invalid_email" | "not_configured" | "network" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const TIMEOUT_MS = 12000;

export const SOURCE = "prebase-launch-site";

export function isValidEmail(email: string) {
  const value = email.trim();
  return value.length > 3 && value.length <= 254 && EMAIL_RE.test(value);
}

const endpoint = (import.meta.env["VITE_WAITLIST_ENDPOINT"] as string | undefined)?.trim();
const mock = String(import.meta.env["VITE_WAITLIST_MOCK"] ?? "") === "true";

export const waitlistConfigured = Boolean(endpoint) || mock;

function utmParams() {
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
  const out: Record<string, string> = {};
  const params =
    typeof window === "undefined"
      ? new URLSearchParams()
      : new URLSearchParams(window.location.search);
  for (const key of keys) out[key] = (params.get(key) ?? "").slice(0, 200);
  return out;
}

export async function submitWaitlist(input: WaitlistInput): Promise<WaitlistResult> {
  if (input.website && input.website.trim() !== "") {
    // Honeypot filled: pretend nothing happened, save nothing.
    return { ok: true, status: "created" };
  }

  const email = input.email.trim().toLowerCase();
  if (!isValidEmail(email)) return { ok: false, reason: "invalid_email" };

  if (mock) {
    await new Promise((r) => setTimeout(r, 700));
    return { ok: true, status: "created" };
  }

  if (!endpoint) return { ok: false, reason: "not_configured" };

  const body = new URLSearchParams({
    email,
    role: input.role ?? "",
    source: SOURCE,
    ...utmParams(),
    page_url: typeof window === "undefined" ? "" : window.location.href,
    referrer: typeof document === "undefined" ? "" : document.referrer,
    website: "",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      // text/plain keeps the request "simple" so no CORS preflight is sent.
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: body.toString(),
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) return { ok: false, reason: "network" };
    const data = (await res.json().catch(() => null)) as
      | { ok?: boolean; status?: string }
      | null;
    if (data && data.ok === false) return { ok: false, reason: "network" };
    return {
      ok: true,
      status: data?.status === "already_registered" ? "already_registered" : "created",
    };
  } catch {
    return { ok: false, reason: "network" };
  } finally {
    clearTimeout(timer);
  }
}
