import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Reveal } from "./Reveal";
import {
  isValidEmail,
  submitWaitlist,
  waitlistConfigured,
  type WaitlistRole,
} from "@/lib/waitlist";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; already: boolean }
  | { kind: "error"; message: string };

const ROLES: WaitlistRole[] = ["Developer", "Student", "Founder / Team", "Other"];

export function Waitlist() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WaitlistRole>("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const submitting = status.kind === "submitting";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!isValidEmail(email)) {
      setStatus({ kind: "error", message: "Enter a valid email address." });
      return;
    }
    if (!waitlistConfigured) {
      setStatus({ kind: "error", message: "Something went wrong. Please try again." });
      return;
    }

    setStatus({ kind: "submitting" });
    const result = await submitWaitlist({ email, role, website });
    if (result.ok) {
      setStatus({ kind: "success", already: result.status === "already_registered" });
      setEmail("");
      setRole("");
    } else {
      setStatus({
        kind: "error",
        message:
          result.reason === "invalid_email"
            ? "Enter a valid email address."
            : "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <section id="waitlist" className="relative mt-28 sm:mt-40">
      <div className="mx-auto max-w-2xl px-5 text-center sm:px-8">
        <Reveal as="h2" className="text-[clamp(1.9rem,4vw,2.75rem)] font-medium">
          Get early access to PreBase.
        </Reveal>
        <Reveal delay={0.08} as="p" className="mx-auto mt-4 max-w-md text-muted-foreground">
          Join the waitlist for beta access and occasional product updates.
        </Reveal>

        <Reveal delay={0.16} className="mt-9">
          <form
            onSubmit={onSubmit}
            noValidate
            className="pb-shine rounded-xl border border-border bg-surface-1 p-4 text-left sm:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label htmlFor="wl-email" className="mb-1.5 block text-xs text-muted-foreground">
                  Email address
                </label>
                <input
                  id="wl-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-[15px] text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground/60 focus:border-teal/60"
                />
              </div>
              <div className="sm:w-44">
                <label htmlFor="wl-role" className="mb-1.5 block text-xs text-muted-foreground">
                  I&apos;m a... <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <select
                  id="wl-role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as WaitlistRole)}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-[15px] text-foreground outline-none transition-colors duration-200 focus:border-teal/60"
                >
                  <option value="">Select</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* honeypot */}
            <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="wl-website">Website</label>
              <input
                id="wl-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-transform duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {submitting ? "Joining..." : "Join the Waitlist"}
            </button>

            <div aria-live="polite" className="min-h-[24px]">
              <AnimatePresence mode="wait">
                {status.kind === "success" && (
                  <motion.p
                    key="ok"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 flex items-center gap-2 text-sm text-success"
                  >
                    <Check />
                    {status.already
                      ? "You're already on the list. We'll keep you posted."
                      : "You're on the list. We'll keep you posted."}
                  </motion.p>
                )}
                {status.kind === "error" && (
                  <motion.p
                    key="err"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 flex items-center gap-2 text-sm text-destructive"
                  >
                    <Cross />
                    {status.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 10.4l2.6 2.6L14 7.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function Cross() {
  return (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 7l6 6M13 7l-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
