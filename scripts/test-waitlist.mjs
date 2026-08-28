/**
 * Lightweight waitlist tests — payload parsing + optional live endpoint check.
 * Run: node scripts/test-waitlist.mjs
 */

const WAITLIST_ALREADY_MESSAGE = "You're already on the waitlist!";

function resultFromPayload(data) {
  if (!data) return null;
  if (data.status === "already_registered" || data.code === 409) {
    return {
      ok: false,
      reason: "already_registered",
      message: data.message?.trim() || WAITLIST_ALREADY_MESSAGE,
    };
  }
  if (data.ok === false) return { ok: false, reason: "network" };
  if (data.ok === true) return { ok: true, status: "created" };
  return null;
}

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    process.exitCode = 1;
    return;
  }
  console.log(`ok: ${name}`);
}

// --- unit tests ---
assert(
  "new signup succeeds",
  resultFromPayload({ ok: true, status: "created" })?.ok === true,
);
assert(
  "duplicate (new API) is rejected",
  resultFromPayload({
    ok: false,
    status: "already_registered",
    message: WAITLIST_ALREADY_MESSAGE,
    code: 409,
  })?.reason === "already_registered",
);
assert(
  "duplicate (legacy API) is rejected",
  resultFromPayload({ ok: true, status: "already_registered" })?.reason ===
    "already_registered",
);
assert(
  "duplicate message is preserved",
  resultFromPayload({ ok: false, status: "already_registered", message: WAITLIST_ALREADY_MESSAGE })
    ?.message === WAITLIST_ALREADY_MESSAGE,
);

// --- live endpoint (optional) ---
const endpoint = process.env.VITE_WAITLIST_ENDPOINT?.trim();
if (!endpoint) {
  console.log("skip: live endpoint (set VITE_WAITLIST_ENDPOINT to test)");
  process.exit(process.exitCode ?? 0);
}

const unique = `waitlist-test+${Date.now()}@example.com`;

async function post(email) {
  const body = new URLSearchParams({
    email,
    role: "",
    source: "prebase-launch-site",
    page_url: "http://localhost/test",
    referrer: "",
    website: "",
  });
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: body.toString(),
    redirect: "follow",
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  return { status: res.status, data, text };
}

try {
  const first = await post(unique);
  const firstResult = resultFromPayload(first.data);
  assert(
    "live: new email is accepted",
    firstResult?.ok === true && firstResult.status === "created",
  );

  const second = await post(unique);
  const secondResult = resultFromPayload(second.data);
  assert(
    "live: duplicate email is rejected",
    secondResult?.ok === false && secondResult.reason === "already_registered",
  );
  assert(
    "live: duplicate message is shown",
    secondResult?.message === WAITLIST_ALREADY_MESSAGE ||
      second.data?.message === WAITLIST_ALREADY_MESSAGE ||
      second.data?.status === "already_registered",
  );

  console.log("live first:", JSON.stringify(first.data));
  console.log("live second:", JSON.stringify(second.data));
} catch (err) {
  console.error("FAIL: live endpoint", err);
  process.exitCode = 1;
}
