import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { FOUNDERS, PREBASE_LINKEDIN } from "./site";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel: string) {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("routes", () => {
  it("registers Product, Why PreBase, and Team as real file routes", () => {
    expect(read("routes/index.tsx")).toContain('createFileRoute("/")');
    expect(read("routes/why.tsx")).toContain('createFileRoute("/why")');
    expect(read("routes/team.tsx")).toContain('createFileRoute("/team")');
    expect(read("routes/index.tsx")).toContain("The Codebase Mapping IDE");
    expect(read("routes/why.tsx")).toContain("Why PreBase | PreBase");
    expect(read("routes/team.tsx")).toContain("Team | PreBase");
  });

  it("keeps the product homepage free of Why and Team sections", () => {
    const index = read("routes/index.tsx");
    expect(index).toContain("Hero");
    expect(index).toContain("Waitlist");
    expect(index).toContain("useHashLanding");
    expect(index).toContain('to="/why"');
    expect(index).toContain('to="/team"');
    expect(index).not.toContain("WhyPreBase");
    expect(index).not.toContain("Studio");
    expect(index).not.toContain("WhyPage");
    expect(index).not.toContain("TeamPage");
  });
});

describe("navigation drawer", () => {
  it("opens from the left with menu semantics and current-page support", () => {
    const drawer = read("components/NavDrawer.tsx");
    expect(drawer).toContain('side="left"');
    expect(drawer).toContain("aria-expanded={open}");
    expect(drawer).toContain("aria-controls");
    expect(drawer).toContain('aria-current={current ? "page" : undefined}');
    expect(drawer).toContain("PRIMARY_PAGES");
    expect(drawer).toContain("PRODUCT_ANCHORS");
    expect(drawer).toContain("PREBASE_LINKEDIN");
    expect(drawer).toContain("Sheet");
    expect(drawer).toContain("SheetClose");
    expect(drawer).toContain("z-[70]");
    expect(drawer).not.toContain("rotate-45");
    expect(read("components/Navbar.tsx")).toContain("z-50");
    expect(read("components/Navbar.tsx")).not.toContain("z-[60]");
  });

  it("does not keep the former horizontal product links in the header", () => {
    const navbar = read("components/Navbar.tsx");
    expect(navbar).toContain("NavDrawer");
    expect(navbar).toContain("ThemeToggle");
    expect(navbar).not.toContain("Join Waitlist");
    expect(navbar).not.toContain("Workbench");
    expect(navbar).not.toContain('label: "Why"');
  });
});

describe("rendered trust surfaces", () => {
  it("wires founder and company LinkedIn destinations into team, footer, drawer, and privacy", () => {
    const team = read("components/TeamPage.tsx");
    const footer = read("components/Footer.tsx");
    const privacy = read("routes/privacy.tsx");
    const drawer = read("components/NavDrawer.tsx");

    for (const founder of FOUNDERS) {
      expect(team).toContain("FOUNDERS");
      expect(footer).not.toContain("FOUNDERS");
      expect(privacy).toContain("FOUNDERS");
      expect(founder.linkedin).toMatch(/^https:\/\/www\.linkedin\.com\/in\//);
    }

    expect(team).toContain("PREBASE_LINKEDIN");
    expect(footer).toContain("PREBASE_LINKEDIN");
    expect(privacy).toContain("PREBASE_LINKEDIN");
    expect(drawer).toContain("PREBASE_LINKEDIN");
    expect(PREBASE_LINKEDIN).toBe("https://www.linkedin.com/company/prebase");
  });

  it("uses local founder photographs, not hotlinked profile images", () => {
    const publicRoot = resolve(root, "..", "public");
    for (const founder of FOUNDERS) {
      expect(founder.photoSrc).toMatch(/^\/team\/.+\.jpg$/);
      expect(existsSync(resolve(publicRoot, founder.photoSrc!.slice(1)))).toBe(true);
    }
    expect(read("components/TeamPage.tsx")).toContain("photoSrc");
    expect(read("components/TeamPage.tsx")).toContain("photoAlt");
  });

  it("keeps the waitlist website field as a honeypot and links privacy nearby", () => {
    const waitlist = read("components/Waitlist.tsx");
    expect(waitlist).toContain("WAITLIST_HONEYPOT_FIELD");
    expect(waitlist).toContain("honeypot");
    expect(waitlist).toContain('to="/privacy"');
    expect(waitlist).toContain("(optional)");
    expect(waitlist).not.toMatch(
      /label htmlFor="wl-website"[^>]*>Website<\/label>\s*<input[^>]*className="h-11/,
    );
    expect(read("components/Footer.tsx")).toContain('to="/privacy"');
    expect(read("routes/privacy.tsx")).toContain('createFileRoute("/privacy")');
  });

  it("exposes Workbench, Explore, and Waitlist homepage anchors", () => {
    expect(read("components/IdeStory.tsx")).toContain('id="why"');
    expect(read("components/Playground.tsx")).toContain('id="explore"');
    expect(read("components/Waitlist.tsx")).toContain('id="waitlist"');
    expect(read("components/Footer.tsx")).toContain('id="why"');
    expect(read("components/Footer.tsx")).toContain('id="explore"');
    expect(read("components/Footer.tsx")).toContain('id="waitlist"');
    expect(read("components/Footer.tsx")).toContain('to="/why"');
    expect(read("components/Footer.tsx")).toContain('to="/team"');
  });

  it("does not invent a parent About route or nest Team under Why", () => {
    expect(read("routes/why.tsx")).not.toContain("/about");
    expect(read("routes/team.tsx")).not.toContain("/why/team");
    expect(read("components/NavDrawer.tsx")).not.toContain("About");
    expect(read("lib/nav.ts")).not.toContain("/about");
  });
});

describe("copy", () => {
  it("does not use em dashes or stock startup phrases on Why and Team", () => {
    const why = read("components/WhyPage.tsx");
    const team = read("components/TeamPage.tsx");
    for (const source of [why, team]) {
      expect(source).not.toContain("—");
      expect(source).not.toMatch(/Our mission is simple/i);
      expect(source).not.toMatch(/At PreBase, we/i);
      expect(source).not.toMatch(/Meet Our Amazing Team/i);
    }
    expect(why).not.toContain("Network Graph");
    expect(why).not.toContain("Temporal Graph");
    expect(why).not.toContain("Magnus");
    expect(why).not.toContain("Open VSX");
  });
});
