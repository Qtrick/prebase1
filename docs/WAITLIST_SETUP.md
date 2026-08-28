# Waitlist setup (Google Sheets + Apps Script)

The waitlist posts directly to a Google Apps Script web app, which writes rows
into a Google Sheet. No database or backend service is required.

```
PreBase website  ->  Apps Script web app  ->  Google Sheet
```

## 1. Create the sheet

1. Create a new Google Sheet (any name).
2. Open **Extensions → Apps Script**.
3. Delete the placeholder code, paste the full contents of
   [`docs/google-apps-script.gs`](./google-apps-script.gs), and save.

The script creates a tab called `Waitlist` with a header row on the first
submission, so no manual sheet setup is needed.

## 2. Deploy the web app

1. Click **Deploy → New deployment**.
2. Choose type **Web app**.
3. Description: `PreBase waitlist`.
4. **Execute as:** Me (the sheet owner).
5. **Who has access:** Anyone.
6. Click **Deploy** and authorize the script when prompted.
7. Copy the deployment URL — it ends in `/exec`.

## 3. Point the website at it

The live `/exec` URL is set in two places so signups work without extra dashboard config:

1. `src/lib/waitlist-config.ts` — `WAITLIST_SCRIPT_URL` (the default)
2. `.env` / `.env.example` — `VITE_WAITLIST_ENDPOINT` (overrides the default when present)

The Turnstile **site key** is set in `src/lib/turnstile-config.ts` (override with
`VITE_TURNSTILE_SITE_KEY` if needed). Site key: `0x4AAAAAAEfhQHv5YzRsO9yI`.

Current endpoint:

```
https://script.google.com/macros/s/AKfycbz34OMfhhqx3DLrEJbbhYI5ho0gQTY3dponed6sSkp6_r1MWwDwOZ-NSHogzDHyZ8g2/exec
```

If you create a **new** deployment (a different `/exec` URL), update both of those files and republish.

**Access:** the web app must allow unauthenticated POST from the public site. In the deployment, set **Who has access: Anyone**. "Only myself" or "Anyone with a Google account" returns Access Denied and signups will fail.

## 4. Turnstile (bot protection)

The waitlist form uses Cloudflare Turnstile. The browser sends a one-time
`cf-turnstile-response` token with each signup; the Apps Script verifies it
server-side before writing to the sheet.

1. In the [Cloudflare Turnstile dashboard](https://dash.cloudflare.com/?to=/:account/turnstile), open your widget and copy the **secret key**.
2. In the Apps Script editor, open **Project settings → Script properties** and add:
   - `TURNSTILE_SECRET` — your widget secret key
   - `TURNSTILE_HOSTNAMES` *(optional)* — comma-separated frontend hostnames, e.g. `prebase.dev,www.prebase.dev,localhost,127.0.0.1`
3. Redeploy the web app (new version) after updating `docs/google-apps-script.gs`.

The widget action is `waitlist` on both the frontend and in siteverify.

## 5. Test

1. Open the site, scroll to **Get early access to PreBase**.
2. Complete the Turnstile check and submit a real email address.
3. Confirm the success message appears, then confirm the row shows up in the
   `Waitlist` tab with a server-side timestamp.
4. Submit the same email again — you should see **You're already on the waitlist!**
   and no duplicate row is added.

## Updating the script later

Apps Script web apps are versioned. After editing the code:

**Deploy → Manage deployments → (pencil icon) → Version: New version → Deploy.**

This keeps the same `/exec` URL, so `WAITLIST_SCRIPT_URL` and `VITE_WAITLIST_ENDPOINT` do not change.
Creating a *new deployment* instead would give you a different URL.

## Local development

Without an endpoint the form reports a failure rather than pretending to
succeed. To work on the UI without a live endpoint or Turnstile, set:

```
VITE_WAITLIST_MOCK=true
```

Never enable mock mode in production.

## What gets stored

`Timestamp` (server-side), `Email`, `Role`, `Source`, the five UTM fields,
`Referrer`, and `Page URL`. Values are sanitized so a submitted string cannot
execute as a spreadsheet formula, and a hidden honeypot field silently drops
bot submissions.
