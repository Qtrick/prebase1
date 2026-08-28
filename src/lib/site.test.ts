import { describe, expect, it } from "vitest";
import { COPYRIGHT_YEAR, FOUNDERS, PREBASE_LINKEDIN, WAITLIST_HONEYPOT_FIELD } from "./site";

describe("public trust links", () => {
  it("uses the official PreBase LinkedIn company URL", () => {
    expect(PREBASE_LINKEDIN).toBe("https://www.linkedin.com/company/prebase");
  });

  it("represents only the two co-founders with verifiable LinkedIn profiles", () => {
    expect(FOUNDERS).toHaveLength(2);
    expect(FOUNDERS.map((f) => f.name)).toEqual(["David Fan", "Vybhav Parthan"]);
    expect(FOUNDERS[0]?.linkedin).toBe("https://www.linkedin.com/in/david-fan-3a5a66313/");
    expect(FOUNDERS[1]?.linkedin).toBe("https://www.linkedin.com/in/vybhavp/");
    expect(FOUNDERS.every((f) => f.role === "Co-founder")).toBe(true);
    expect(FOUNDERS[0]?.photoSrc).toBe("/team/david-fan.jpg");
    expect(FOUNDERS[1]?.photoSrc).toBe("/team/vybhav-parthan.jpg");
    expect(FOUNDERS[0]?.photoAlt).toBe("David Fan");
    expect(FOUNDERS[1]?.photoAlt).toBe("Vybhav Parthan");
  });
});

describe("waitlist field policy", () => {
  it("treats website as a honeypot, not a real waitlist field", () => {
    expect(WAITLIST_HONEYPOT_FIELD).toBe("website");
  });

  it("uses the current year in the footer copyright", () => {
    expect(COPYRIGHT_YEAR).toBe(2026);
  });
});
