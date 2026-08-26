import { useEffect, useRef, useState } from "react";

/**
 * One product journey, one dataset. The rail, the workbench tab strip and the
 * two scroll stories all derive their labels, bounds and navigation targets
 * from this file so they can never drift apart.
 */

export type JourneyGroup = "NETWORK" | "TEMPORAL" | "EXPLORE" | "WORKBENCH";

export type JourneySection = "product" | "explore" | "why";

export type JourneyStep = {
  /** stable id */
  id: string;
  /** continuous 01–11 numbering across the whole journey */
  n: string;
  group: JourneyGroup;
  label: string;
  section: JourneySection;
  /** chapter index inside its scroll story (ignored for `explore`) */
  chapter: number;
};

/** Chapter boundaries of the Network/Temporal story, as scroll progress. */
export const STORY_BOUNDS = [0, 0.19, 0.38, 0.57, 0.8, 1] as const;
/** Chapter boundaries of the Workbench story, as scroll progress. */
export const WORKBENCH_BOUNDS = [0, 0.16, 0.32, 0.48, 0.78, 1] as const;

export const PRODUCT_JOURNEY: JourneyStep[] = [
  { id: "map", n: "01", group: "NETWORK", label: "Map", section: "product", chapter: 0 },
  { id: "relationships", n: "02", group: "NETWORK", label: "Relationships", section: "product", chapter: 1 },
  { id: "context", n: "03", group: "NETWORK", label: "Context", section: "product", chapter: 2 },
  { id: "history", n: "04", group: "TEMPORAL", label: "History", section: "product", chapter: 3 },
  { id: "change", n: "05", group: "TEMPORAL", label: "Change", section: "product", chapter: 4 },
  { id: "playground", n: "06", group: "EXPLORE", label: "Playground", section: "explore", chapter: 0 },
  { id: "editor", n: "07", group: "WORKBENCH", label: "Editor", section: "why", chapter: 0 },
  { id: "terminal", n: "08", group: "WORKBENCH", label: "Terminal", section: "why", chapter: 1 },
  { id: "source-control", n: "09", group: "WORKBENCH", label: "Source Control", section: "why", chapter: 2 },
  { id: "runtime", n: "10", group: "WORKBENCH", label: "Runtime", section: "why", chapter: 3 },
  { id: "extensions", n: "11", group: "WORKBENCH", label: "Extensions", section: "why", chapter: 4 },
];

export const JOURNEY_GROUPS: JourneyGroup[] = ["NETWORK", "TEMPORAL", "EXPLORE", "WORKBENCH"];

const SECTION_ID: Record<JourneySection, string> = {
  product: "product",
  explore: "explore",
  why: "why",
};

const NAV_OFFSET = 72;

function boundsFor(section: JourneySection) {
  return section === "why" ? WORKBENCH_BOUNDS : STORY_BOUNDS;
}

/** Absolute page Y for a journey step, derived from real story geometry. */
export function stepTargetY(step: JourneyStep): number | null {
  const el = document.getElementById(SECTION_ID[step.section]);
  if (!el) return null;
  const top = el.getBoundingClientRect().top + window.scrollY;
  if (step.section === "explore") return Math.max(0, top - NAV_OFFSET);

  const bounds = boundsFor(step.section);
  const range = el.offsetHeight - window.innerHeight;
  if (range <= 0) return Math.max(0, top - NAV_OFFSET);
  const target = Math.min((bounds[step.chapter] ?? 0) + 0.04, 0.985);
  return top + range * target;
}

/**
 * Navigation jumps straight to the target step. Smooth scrolling would replay
 * every intermediate chapter of the story, which reads as noise when the
 * visitor has already asked to be somewhere specific.
 */
export const JOURNEY_JUMP_EVENT = "journey:jump";

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

/**
 * Move between distant page sections without visibly scrubbing every sticky
 * story in between. Supporting browsers crossfade the current and destination
 * view; reduced-motion and older browsers use the same direct jump without the
 * transition.
 */
export function jumpToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  const jump = () => {
    const top = target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
    window.scrollTo({ top: Math.max(0, top), behavior: "instant" as ScrollBehavior });
    window.history.pushState(null, "", `#${id}`);
    window.dispatchEvent(new CustomEvent(JOURNEY_JUMP_EVENT));
  };

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as ViewTransitionDocument;
  if (reduce || !doc.startViewTransition) {
    jump();
    return;
  }

  // The destination's own content settles in a beat after the page arrives.
  target.classList.remove("pb-jump-arrive");
  void target.offsetWidth;
  target.classList.add("pb-jump-arrive");
  window.setTimeout(() => target.classList.remove("pb-jump-arrive"), 1400);

  doc.startViewTransition(jump);
}


export function scrollToStep(step: JourneyStep, _reduce = false) {
  const y = stepTargetY(step);
  if (y == null) return;
  window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
  // Stories run their scroll progress through springs; without this the spring
  // eases across every chapter in between, which is exactly the "scrolling
  // through" the jump is meant to avoid.
  window.dispatchEvent(new CustomEvent(JOURNEY_JUMP_EVENT));
}

/** Snap motion values to their current target after a journey jump. */
export function useJourneyJump(snap: () => void) {
  const ref = useRef(snap);
  ref.current = snap;
  useEffect(() => {
    const handler = () => {
      // let the browser commit the new scroll position first
      requestAnimationFrame(() => requestAnimationFrame(() => ref.current()));
    };
    window.addEventListener(JOURNEY_JUMP_EVENT, handler);
    return () => window.removeEventListener(JOURNEY_JUMP_EVENT, handler);
  }, []);
}

export function chapterFromProgress(v: number, bounds: readonly number[], max: number) {
  let ch = 0;
  for (let i = 1; i < bounds.length; i++) if (v >= bounds[i]!) ch = i;
  return Math.min(ch, max);
}

export type JourneyPosition = {
  /** index into PRODUCT_JOURNEY, or -1 when outside the journey */
  index: number;
  visible: boolean;
};

/**
 * Single scroll-derived location model for the whole middle of the page.
 * Scroll stays the only authority — nothing here mutates story state.
 */
export function useJourneyPosition(): JourneyPosition {
  const [pos, setPos] = useState<JourneyPosition>({ index: -1, visible: false });

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const product = document.getElementById("product");
      const explore = document.getElementById("explore");
      const why = document.getElementById("why");
      const waitlist = document.getElementById("waitlist");
      if (!product || !explore || !why) return;

      const y = window.scrollY;
      const vh = window.innerHeight;
      const topOf = (el: HTMLElement) => el.getBoundingClientRect().top + y;

      const pTop = topOf(product);
      const eTop = topOf(explore);
      const wTop = topOf(why);
      const wlTop = waitlist ? topOf(waitlist) : Number.POSITIVE_INFINITY;

      const visible = y + vh * 0.6 >= pTop && y + vh * 0.55 < wlTop;

      let index = -1;
      if (y + vh * 0.5 >= wTop) {
        const range = Math.max(1, why.offsetHeight - vh);
        const v = Math.min(1, Math.max(0, (y - wTop) / range));
        index = 6 + chapterFromProgress(v, WORKBENCH_BOUNDS, 4);
      } else if (y + vh * 0.5 >= eTop) {
        index = 5;
      } else if (y + vh * 0.5 >= pTop) {
        const range = Math.max(1, product.offsetHeight - vh);
        const v = Math.min(1, Math.max(0, (y - pTop) / range));
        index = chapterFromProgress(v, STORY_BOUNDS, 4);
      }

      setPos((prev) =>
        prev.index === index && prev.visible === visible ? prev : { index, visible },
      );
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return pos;
}
