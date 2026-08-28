/**
 * Waitlist submission.
 *
 * Architecture: website -> Google Apps Script web app -> Google Sheet.
 * Default URL lives in waitlist-config.ts and can be overridden with
 * VITE_WAITLIST_ENDPOINT. See docs/WAITLIST_SETUP.md.
 */

import { WAITLIST_SCRIPT_URL } from "./waitlist-config";
import { TURNSTILE_SITE_KEY } from "./turnstile-config";
import { WAITLIST_HONEYPOT_FIELD } from "./site";

export type WaitlistRole = "" | "Developer" | "Student" | "Founder / Team" | "Other";

export type WaitlistInput = {
  email: string;
  role?: WaitlistRole;
  /** hidden honeypot field — must stay empty */
  website?: string;
  /** Cloudflare Turnstile token (`cf-turnstile-response`). */
  turnstileToken?: string;
};

export const WAITLIST_ALREADY_MESSAGE = "You're already on the waitlist!";

export type WaitlistResult =
  | { ok: true; status: "created" }
  | {
      ok: false;
      reason:
        "invalid_email" | "not_configured" | "network" | "already_registered" | "captcha_failed";
      message?: string;
    };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const TIMEOUT_MS = 12000;

export const SOURCE = "prebase-launch-site";

export function isValidEmail(email: string) {
  const value = email.trim();
  return value.length > 3 && value.length <= 254 && EMAIL_RE.test(value);
}

const envEndpoint = (import.meta.env["VITE_WAITLIST_ENDPOINT"] as string | undefined)?.trim();
const endpoint = envEndpoint || WAITLIST_SCRIPT_URL;
const mock = String(import.meta.env["VITE_WAITLIST_MOCK"] ?? "") === "true";
const mockRegistered = new Set<string>();

export const waitlistConfigured = Boolean(endpoint) || mock;
export const turnstileRequired = !mock && Boolean(TURNSTILE_SITE_KEY);

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

function parseScriptPayload(
  text: string,
): { ok?: boolean; status?: string; message?: string; code?: number } | null {
  try {
    return JSON.parse(text) as { ok?: boolean; status?: string; message?: string; code?: number };
  } catch {
    return null;
  }
}

/** Maps Apps Script JSON into a typed client result (exported for tests). */
export function resultFromPayload(
  data: { ok?: boolean; status?: string; message?: string; code?: number } | null,
): WaitlistResult | null {
  if (!data) return null;

  if (data.status === "already_registered" || data.code === 409) {
    return {
      ok: false,
      reason: "already_registered",
      message: data.message?.trim() || WAITLIST_ALREADY_MESSAGE,
    };
  }

  if (data.status === "captcha_failed" || data.code === 403) {
    return {
      ok: false,
      reason: "captcha_failed",
      message: data.message?.trim() || "Verification failed. Please try again.",
    };
  }

  if (data.ok === false) return { ok: false, reason: "network" };

  if (data.ok === true) return { ok: true, status: "created" };

  return null;
}

/** True when the Apps Script web app is publicly reachable. */
async function isScriptReachable(signal: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(endpoint, {
      method: "GET",
      signal,
      redirect: "follow",
      credentials: "omit",
    });
    const data = parseScriptPayload(await res.text());
    return res.ok && data?.ok === true;
  } catch {
    return false;
  }
}

export async function submitWaitlist(input: WaitlistInput): Promise<WaitlistResult> {
  if (input.website && input.website.trim() !== "") {
    // Honeypot filled: pretend nothing happened, save nothing.
    return { ok: true, status: "created" };
  }

  const email = input.email.trim().toLowerCase();
  if (!isValidEmail(email)) return { ok: false, reason: "invalid_email" };

  const turnstileToken = input.turnstileToken?.trim() ?? "";
  if (turnstileRequired && !turnstileToken) {
    return { ok: false, reason: "captcha_failed", message: "Complete the verification check." };
  }

  if (mock) {
    await new Promise((r) => setTimeout(r, 700));
    if (mockRegistered.has(email)) {
      return { ok: false, reason: "already_registered", message: WAITLIST_ALREADY_MESSAGE };
    }
    mockRegistered.add(email);
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
    [WAITLIST_HONEYPOT_FIELD]: "",
    "cf-turnstile-response": turnstileToken,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      // form-urlencoded is a CORS-safelisted type, so no preflight is sent.
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: body.toString(),
      signal: controller.signal,
      redirect: "follow",
      credentials: "omit",
    });

    const parsed = resultFromPayload(parseScriptPayload(await res.text()));
    if (parsed) return parsed;
    return { ok: false, reason: "network" };
  } catch {
    if (controller.signal.aborted) return { ok: false, reason: "network" };
    // Apps Script often omits CORS headers on POST even after writing the
    // row. If the web app itself is publicly reachable, treat this as success.
    const reachable = await isScriptReachable(controller.signal);
    return reachable ? { ok: true, status: "created" } : { ok: false, reason: "network" };
  } finally {
    clearTimeout(timer);
  }
}
