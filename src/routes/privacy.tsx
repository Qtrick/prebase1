import { createFileRoute, Link } from "@tanstack/react-router";
import { OutboundLink } from "@/components/OutboundLink";
import { FOUNDERS, PREBASE_LINKEDIN } from "@/lib/site";

const title = "Privacy | PreBase";
const description =
  "What the PreBase website collects when you join the waitlist, and how that information is used.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
      <p className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground">LEGAL</p>
      <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.75rem)] font-medium">Privacy</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated August 2026</p>

      <div className="mt-10 space-y-8 text-[15px] leading-[1.7] text-muted-foreground">
        <p>
          This page describes the information the PreBase website collects. It is a factual account
          of the current waitlist, not a broader corporate privacy policy.
        </p>

        <section>
          <h2 className="text-lg font-medium text-foreground">Waitlist</h2>
          <p className="mt-3">When you join the waitlist, we collect:</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Email address (required)</li>
            <li>Role (optional)</li>
          </ul>
          <p className="mt-3">
            A hidden field named website exists only as a spam trap. If it is filled in, we discard
            the submission and do not store it.
          </p>
          <p className="mt-3">
            We also receive a Cloudflare Turnstile token so we can tell people from automated
            traffic. The waitlist endpoint checks that token with Cloudflare before storing
            anything. We do not use that token to identify you beyond that check.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">How we use it</h2>
          <p className="mt-3">
            We use your email for PreBase beta access and product updates about PreBase.
          </p>
          <p className="mt-3">We do not sell waitlist emails.</p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">Where it is stored</h2>
          <p className="mt-3">
            Waitlist submissions are sent to a Google Apps Script endpoint and stored in a Google
            Sheet used by the PreBase team.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">Founders</h2>
          <p className="mt-3">PreBase is being built by:</p>
          <ul className="mt-3 space-y-1">
            {FOUNDERS.map((founder) => (
              <li key={founder.name}>
                <OutboundLink href={founder.linkedin}>
                  {founder.name}, {founder.role}
                </OutboundLink>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            The company page is{" "}
            <OutboundLink href={PREBASE_LINKEDIN}>PreBase on LinkedIn</OutboundLink>.
          </p>
        </section>
      </div>

      <p className="mt-12 text-sm text-muted-foreground">
        <Link
          to="/"
          className="transition-colors hover:text-foreground focus-visible:text-foreground"
        >
          ← Back to PreBase
        </Link>
      </p>
    </main>
  );
}
