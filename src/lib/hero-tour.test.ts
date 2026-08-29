import { describe, expect, it } from "vitest";
import {
  CLICK_MS,
  HERO_TARGETS,
  HeroTourClock,
  INITIAL_TOUR_STATE,
  TYPE_MS_PER_CHAR,
  easeCursor,
  loopDuration,
  phaseDuration,
  phasesFor,
  reducedMotionState,
  shouldPlay,
  type TourVisualState,
} from "./hero-tour";

function reasons(patch: Partial<Parameters<typeof shouldPlay>[0]> = {}) {
  return {
    manual: false,
    offscreen: false,
    hidden: false,
    reducedMotion: false,
    ...patch,
  };
}

describe("hero tour playback gates", () => {
  it("plays only when no pause reason is set", () => {
    expect(shouldPlay(reasons())).toBe(true);
    expect(shouldPlay(reasons({ manual: true }))).toBe(false);
    expect(shouldPlay(reasons({ offscreen: true }))).toBe(false);
    expect(shouldPlay(reasons({ hidden: true }))).toBe(false);
    expect(shouldPlay(reasons({ reducedMotion: true }))).toBe(false);
  });

  it("keeps manual pause independent of visibility", () => {
    expect(shouldPlay(reasons({ manual: true, hidden: false, offscreen: false }))).toBe(false);
  });
});

describe("hero tour phases", () => {
  it("advances through the full loop and resets", () => {
    const full = phasesFor(false);
    const ids = full.map((p) => p.id);
    expect(ids[0]).toBe("enter");
    expect(ids.at(-1)).toBe("reset");
    expect(ids).toContain("selectFile");
    expect(ids).toContain("selectNode");
    expect(ids).toContain("switchTemporal");
    expect(ids).toContain("typeQuestion");
    expect(ids).toContain("send");
  });

  it("omits the extra network hop on compact screens", () => {
    const compact = phasesFor(true).map((p) => p.id);
    expect(compact).not.toContain("moveToNode");
    expect(compact).not.toContain("selectNode");
    expect(compact).toContain("selectFile");
    expect(compact).toContain("switchTemporal");
    expect(compact).toContain("typeQuestion");
  });

  it("sizes typing from the prompt length, not a fixed pause", () => {
    const typePhase = phasesFor(false).find((p) => p.id === "typeQuestion")!;
    expect(phaseDuration(typePhase, 10)).toBe(10 * TYPE_MS_PER_CHAR);
    expect(phaseDuration(typePhase, 2)).toBeGreaterThanOrEqual(280);
    expect(CLICK_MS).toBeLessThan(200);
  });

  it("eases cursor travel rather than using linear motion", () => {
    expect(easeCursor(0)).toBe(0);
    expect(easeCursor(1)).toBe(1);
    expect(easeCursor(0.5)).toBe(0.5);
    expect(easeCursor(0.25)).toBeLessThan(0.25);
    expect(easeCursor(0.75)).toBeGreaterThan(0.75);
  });

  it("keeps a full loop in a calm 12–16s band for the canonical prompts", () => {
    for (const len of [22, 23, 35]) {
      const ms = loopDuration(false, len);
      expect(ms).toBeGreaterThanOrEqual(12_000);
      expect(ms).toBeLessThanOrEqual(16_000);
    }
  });
});

describe("hero tour clock", () => {
  it("applies file selection then network selection, and pause freezes advancement", () => {
    const visuals: TourVisualState[] = [];
    const clock = new HeroTourClock({
      onVisual: (s) => visuals.push({ ...s }),
      onCursor: () => {},
      measure: (target) => {
        if (target === HERO_TARGETS.fileGraphService) return { x: 40, y: 80 };
        if (target === HERO_TARGETS.networkNodeParser) return { x: 180, y: 140 };
        return { x: 20, y: 30 };
      },
      promptLength: () => 12,
      compact: () => false,
    });

    clock.start(0);
    expect(visuals.at(-1)?.cursorVisible).toBe(true);

    // enter dwell (480) + moveToFile (560+80) → selectFile applies on phase enter
    let t = 0;
    const step = 16;
    while (t < 480 + 560 + 80 + CLICK_MS + 80 && visuals.every((v) => v.selectedFile !== "graph")) {
      t += step;
      clock.tick(t);
    }
    expect(visuals.some((v) => v.selectedFile === "graph")).toBe(true);

    clock.pause(t);
    const count = visuals.length;
    clock.tick(t + 5000);
    expect(visuals.length).toBe(count);

    clock.resume(t + 5000);
    clock.tick(t + 5000 + 16);
    expect(visuals.length).toBeGreaterThanOrEqual(count);
  });

  it("types the prompt character by character", () => {
    let typed = 0;
    const clock = new HeroTourClock({
      onVisual: (s) => {
        typed = s.typedChars;
      },
      onCursor: () => {},
      measure: () => ({ x: 10, y: 10 }),
      promptLength: () => 8,
      compact: () => true,
    });
    clock.start(0);
    // Fast-forward into typeQuestion by ticking past earlier compact phases.
    let now = 0;
    for (let i = 0; i < 14000; i += 30) {
      now = i;
      clock.tick(now);
      if (typed > 0 && typed < 8) break;
    }
    expect(typed).toBeGreaterThan(0);
    expect(typed).toBeLessThan(8);
  });

  it("resets and begins another loop", () => {
    let sawReset = false;
    let reentered = false;
    let selected = false;
    const clock = new HeroTourClock({
      onVisual: (s) => {
        if (s.selectedFile === "graph") selected = true;
        if (selected && !s.cursorVisible && !s.selectedFile) sawReset = true;
        if (sawReset && s.cursorVisible) reentered = true;
      },
      onCursor: () => {},
      measure: () => ({ x: 10, y: 10 }),
      promptLength: () => 4,
      compact: () => true,
    });
    clock.start(0);
    for (let t = 0; t <= 20000; t += 50) clock.tick(t);
    expect(sawReset).toBe(true);
    expect(reentered).toBe(true);
  });
});

describe("reduced motion presentation", () => {
  it("shows the same information without a roaming cursor", () => {
    const state = reducedMotionState(23);
    expect(state.cursorVisible).toBe(false);
    expect(state.selectedFile).toBe("graph");
    expect(state.selectedNode).toBe("graph");
    expect(state.mode).toBe("network");
    expect(state.typedChars).toBe(23);
    expect(state.showResponse).toBe(true);
    expect(INITIAL_TOUR_STATE.mode).toBe("network");
  });
});
