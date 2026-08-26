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

Set the environment variable (see `.env.example`):

```
VITE_WAITLIST_ENDPOINT=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Then redeploy / republish the website so the value is baked into the build.

## 4. Test

1. Open the site, scroll to **Get early access to PreBase**.
2. Submit a real email address.
3. Confirm the success message appears, then confirm the row shows up in the
   `Waitlist` tab with a server-side timestamp.
4. Submit the same email again — it should still succeed, and the script
   returns `already_registered` instead of adding a duplicate row.

## Updating the script later

Apps Script web apps are versioned. After editing the code:

**Deploy → Manage deployments → (pencil icon) → Version: New version → Deploy.**

This keeps the same `/exec` URL, so `VITE_WAITLIST_ENDPOINT` does not change.
Creating a *new deployment* instead would give you a different URL.

## Local development

Without an endpoint the form reports a failure rather than pretending to
succeed. To work on the UI without a live endpoint, set:

```
VITE_WAITLIST_MOCK=true
```

Never enable mock mode in production.

## What gets stored

`Timestamp` (server-side), `Email`, `Role`, `Source`, the five UTM fields,
`Referrer`, and `Page URL`. Values are sanitized so a submitted string cannot
execute as a spreadsheet formula, and a hidden honeypot field silently drops
bot submissions.
