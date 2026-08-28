/**
 * Cloudflare Turnstile — waitlist bot protection.
 *
 * Site key is public (safe in the client bundle). Override with
 * VITE_TURNSTILE_SITE_KEY when needed.
 *
 * The matching secret must be stored in the Apps Script project's
 * Script Properties as TURNSTILE_SECRET (see docs/WAITLIST_SETUP.md).
 */
export const TURNSTILE_SITE_KEY =
  (import.meta.env["VITE_TURNSTILE_SITE_KEY"] as string | undefined)?.trim() ||
  "0x4AAAAAAEfhQHv5YzRsO9yI";

/** Must match `data-action` on the widget and the Apps Script siteverify check. */
export const TURNSTILE_ACTION = "waitlist";
