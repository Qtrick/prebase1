import { afterEach, describe, expect, it, vi } from "vitest";
import { isValidEmail, submitWaitlist } from "./waitlist";

describe("waitlist submission", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts a well-formed email", () => {
    expect(isValidEmail("you@domain.com")).toBe(true);
  });

  it("rejects an empty or malformed email", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("not-an-email")).toBe(false);
  });

  it("silently accepts a filled honeypot without storing a waitlist row", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await submitWaitlist({
      email: "bot@example.com",
      website: "https://spam.example",
    });
    expect(result).toEqual({ ok: true, status: "created" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not require a role", async () => {
    const result = await submitWaitlist({
      email: "not-valid",
      role: "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid_email");
  });
});
