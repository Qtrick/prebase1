import { afterEach, describe, expect, it, vi } from "vitest";

const { jumpToSection } = vi.hoisted(() => ({
  jumpToSection: vi.fn(),
}));

vi.mock("@/lib/journey", () => ({ jumpToSection }));

import {
  isHomePath,
  isHomeSectionId,
  isPrimaryPath,
  onSectionClick,
  PRIMARY_PAGES,
  PRODUCT_ANCHORS,
  sectionHref,
} from "./nav";

describe("section navigation", () => {
  afterEach(() => {
    jumpToSection.mockReset();
    vi.unstubAllGlobals();
  });

  it("uses root-relative hashes so other pages can deep-link home sections", () => {
    expect(sectionHref("why")).toBe("/#why");
    expect(sectionHref("waitlist")).toBe("/#waitlist");
    expect(sectionHref("explore")).toBe("/#explore");
    expect(sectionHref("product")).toBe("/#product");
  });

  it("treats / as the homepage", () => {
    expect(isHomePath("/")).toBe(true);
    expect(isHomePath("")).toBe(true);
    expect(isHomePath("/privacy")).toBe(false);
    expect(isHomePath("/why")).toBe(false);
    expect(isHomePath("/team")).toBe(false);
  });

  it("does not intercept section clicks off the homepage so /#id can navigate home", () => {
    vi.stubGlobal("window", { location: { pathname: "/why" } });
    const preventDefault = vi.fn();
    onSectionClick({ preventDefault }, "explore");
    expect(preventDefault).not.toHaveBeenCalled();
    expect(jumpToSection).not.toHaveBeenCalled();
  });

  it("jumps in-page on the homepage instead of following /#id as a new navigation", () => {
    vi.stubGlobal("window", { location: { pathname: "/" } });
    const preventDefault = vi.fn();
    onSectionClick({ preventDefault }, "waitlist");
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(jumpToSection).toHaveBeenCalledWith("waitlist");
  });

  it("only lands on real homepage section hashes", () => {
    expect(isHomeSectionId("why")).toBe(true);
    expect(isHomeSectionId("explore")).toBe(true);
    expect(isHomeSectionId("waitlist")).toBe(true);
    expect(isHomeSectionId("about")).toBe(false);
    expect(isHomeSectionId("building")).toBe(false);
  });
});

describe("site information architecture", () => {
  it("treats Product, Why PreBase, and Team as peer top-level pages", () => {
    expect(PRIMARY_PAGES).toEqual([
      { to: "/", label: "Product" },
      { to: "/why", label: "Why PreBase" },
      { to: "/team", label: "Team" },
    ]);
    expect(isPrimaryPath("/", "/")).toBe(true);
    expect(isPrimaryPath("/why", "/why")).toBe(true);
    expect(isPrimaryPath("/team", "/team")).toBe(true);
    expect(isPrimaryPath("/why", "/")).toBe(false);
    expect(isPrimaryPath("/team", "/why")).toBe(false);
  });

  it("keeps Workbench as a homepage anchor at #why, not the /why page", () => {
    expect(PRODUCT_ANCHORS).toEqual([
      { id: "why", label: "Workbench" },
      { id: "explore", label: "Explore" },
      { id: "waitlist", label: "Join Waitlist" },
    ]);
  });
});
