import { describe, expect, it } from "vitest";
import { isSiteTheme, readDocumentTheme, THEME_STORAGE_KEY } from "./theme";

describe("site theme", () => {
  it("stores the preference under a stable key", () => {
    expect(THEME_STORAGE_KEY).toBe("prebase-theme");
  });

  it("accepts only light and dark", () => {
    expect(isSiteTheme("dark")).toBe(true);
    expect(isSiteTheme("light")).toBe(true);
    expect(isSiteTheme("auto")).toBe(false);
    expect(isSiteTheme(null)).toBe(false);
  });

  it("defaults to dark when no document is present", () => {
    expect(readDocumentTheme()).toBe("dark");
  });
});
