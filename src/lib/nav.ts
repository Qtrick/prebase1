import { useEffect } from "react";
import { jumpToSection } from "@/lib/journey";

/** Hash href that still works from pages other than `/`. */
export function sectionHref(id: string) {
  return `/#${id}`;
}

export function isHomePath(pathname: string) {
  return pathname === "/" || pathname === "";
}

/** Homepage section ids that navigation and hash landing may target. */
export const HOME_SECTION_IDS = ["top", "product", "why", "explore", "waitlist"] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

export function isHomeSectionId(id: string): id is HomeSectionId {
  return (HOME_SECTION_IDS as readonly string[]).includes(id);
}

/** Top-level peer pages. Product, Why PreBase, and Team are siblings. */
export const PRIMARY_PAGES = [
  { to: "/", label: "Product" },
  { to: "/why", label: "Why PreBase" },
  { to: "/team", label: "Team" },
] as const;

/** Product-page anchors. Workbench lives at `#why` (the IDE story), not `/why`. */
export const PRODUCT_ANCHORS = [
  { id: "why", label: "Workbench" },
  { id: "explore", label: "Explore" },
  { id: "waitlist", label: "Join Waitlist" },
] as const;

export function isPrimaryPath(pathname: string, to: string) {
  if (to === "/") return isHomePath(pathname);
  return pathname === to;
}

/**
 * On the homepage, jump without scrubbing sticky stories.
 * On other routes, let the browser follow `/#section`.
 */
export function onSectionClick(event: { preventDefault: () => void }, id: string) {
  if (typeof window === "undefined") return;
  if (!isHomePath(window.location.pathname)) return;
  event.preventDefault();
  jumpToSection(id);
}

/**
 * Deep-links such as `/#explore` undershoot with native hash scrolling because
 * of the tall sticky product stories. Land with the same instant jump used by
 * in-page navigation. Unknown hashes are ignored.
 */
export function useHashLanding() {
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id || !isHomeSectionId(id)) return;
    const run = () => jumpToSection(id, { transition: false });
    run();
    const t = window.setTimeout(run, 200);
    return () => window.clearTimeout(t);
  }, []);
}
