import { describe, expect, it } from "vitest";
import {
  CLICK_MS,
  HERO_TARGETS,
  HeroTourClock,
  INITIAL_TOUR_STATE,
  TYPE_MS_PER_CHAR,
  easeCursor,
  isLoopStartState,
  loopDuration,
  phaseDuration,
  phasesFor,
  reducedMotionState,
  shouldPlay,
  type TourTiming,
  type TourVisualState,
} from "./hero-tour";
import { DEMO_QUESTIONS } from "./demo-questions";

function reasons(patch: Partial<Parameters<typeof shouldPlay>[0]> = {}) {
  return {
    manual: false,
    offscreen: false,
    hidden: false,
    reducedMotion: false,
    ...patch,
  };
}

const sample: TourTiming = {
  promptLength: DEMO_QUESTIONS[0]!.prompt.length,
  responseLength: DEMO_QUESTIONS[0]!.response.length,
  actions: DEMO_QUESTIONS[0]!.actions,
};

function makeClock(opts?: { compact?: boolean; prompt?: number; response?: number }) {
  const visuals: TourVisualState[] = [];
  const instance = new HeroTourClock({
    onVisual: (s) => visuals.push({ ...s }),
    onCursor: () => {},
    measure: (target) => {
      if (target === HERO_TARGETS.fileGraphService) return { x: 40, y: 80 };
      if (target === HERO_TARGETS.networkNodeParser) return { x: 180, y: 140 };
      if (target === HERO_TARGETS.agentNew) return { x: 400, y: 40 };
      if (target === HERO_TARGETS.networkToggle) return { x: 360, y: 24 };
      return { x: 20, y: 30 };
    },
    promptLength: () => opts?.prompt ?? 12,
    responseLength: () => opts?.response ?? 9,
    actions: () => [{ id: "a", label: "Reading src/graph/graphService.ts", durationMs: 40 }],
    compact: () => opts?.compact ?? false,
  });
  return { clock: instance, visuals };
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
  it("closes the loop with New Agent and Network return instead of a hidden reset", () => {
    const ids = phasesFor(false).map((p) => p.id);
    expect(ids[0]).toBe("enter");
    expect(ids.at(-1)).toBe("loopDwell");
    expect(ids).not.toContain("reset");
    expect(ids).toContain("runActions");
    expect(ids).toContain("streamResponse");
    expect(ids).toContain("clickNewAgent");
    expect(ids).toContain("switchNetwork");
    expect(ids).toContain("cursorHome");
    expect(ids.indexOf("runActions")).toBeLessThan(ids.indexOf("streamResponse"));
    expect(ids.indexOf("streamResponse")).toBeLessThan(ids.indexOf("clickNewAgent"));
    expect(ids.indexOf("clickNewAgent")).toBeLessThan(ids.indexOf("switchNetwork"));
  });

  it("omits the extra network hop on compact screens but still closes the loop", () => {
    const compact = phasesFor(true).map((p) => p.id);
    expect(compact).not.toContain("moveToNode");
    expect(compact).not.toContain("selectNode");
    expect(compact).toContain("clickNewAgent");
    expect(compact).toContain("switchNetwork");
    expect(compact).toContain("cursorHome");
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

  it("keeps a full loop moving without becoming a long movie", () => {
    const ms = loopDuration(false, sample);
    expect(ms).toBeGreaterThanOrEqual(14_000);
    expect(ms).toBeLessThan(28_000);
  });
});

describe("hero tour clock", () => {
  it("applies file selection then network selection, and pause freezes advancement", () => {
    const { clock, visuals } = makeClock();
    clock.start(0);
    expect(visuals.at(-1)?.cursorVisible).toBe(true);

    let t = 0;
    const step = 16;
    while (t < 360 + 520 + 60 + CLICK_MS + 80 && visuals.every((v) => v.selectedFile !== "graph")) {
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
    const { clock } = makeClock({ compact: true, prompt: 8 });
    clock.start(0);
    for (let i = 0; i < 16000; i += 30) {
      clock.tick(i);
      typed = clock.snapshot.typedChars;
      if (typed > 0 && typed < 8) break;
    }
    expect(typed).toBeGreaterThan(0);
    expect(typed).toBeLessThan(8);
  });

  it("runs actions before any response characters, then streams", () => {
    const { clock, visuals } = makeClock({ compact: true, prompt: 4, response: 12 });
    clock.start(0);
    let sawAction = false;
    let streamedDuringAction = false;
    let streamedAfter = false;
    for (let t = 0; t <= 22000; t += 20) {
      clock.tick(t);
      const s = clock.snapshot;
      if (s.actionCompleted > 0 || s.actionIndex >= 0) sawAction = true;
      if (
        (s.actionIndex >= 0 || (s.actionCompleted > 0 && !s.actionsCollapsed)) &&
        s.streamedChars > 0
      ) {
        streamedDuringAction = true;
      }
      if (s.actionsCollapsed && s.streamedChars > 0 && s.streamedChars < 12) streamedAfter = true;
    }
    expect(sawAction).toBe(true);
    expect(streamedDuringAction).toBe(false);
    expect(streamedAfter).toBe(true);
    expect(visuals.some((v) => v.sent)).toBe(true);
  });

  it("clears the agent on New Agent, then returns to Network matching loop start", () => {
    const { clock } = makeClock({ compact: true, prompt: 4, response: 6 });
    clock.start(0);
    let sawTemporal = false;
    let sawNewAgent = false;
    let sawNetworkReturn = false;
    let startAfterReturn: TourVisualState | null = null;
    for (let t = 0; t <= 28000; t += 25) {
      clock.tick(t);
      const s = clock.snapshot;
      if (s.mode === "temporal") sawTemporal = true;
      if (s.sent && s.showResponse) {
        /* hold */
      }
      if (sawTemporal && !s.sent && s.actionCompleted === 0 && s.mode === "temporal")
        sawNewAgent = true;
      if (sawNewAgent && s.mode === "network" && isLoopStartState(s)) {
        sawNetworkReturn = true;
        startAfterReturn = s;
        break;
      }
    }
    expect(sawTemporal).toBe(true);
    expect(sawNewAgent).toBe(true);
    expect(sawNetworkReturn).toBe(true);
    expect(startAfterReturn && isLoopStartState(startAfterReturn)).toBe(true);
  });

  it("keeps the completed conversation through the New Agent click, then clears", () => {
    const { clock } = makeClock({ compact: true, prompt: 4, response: 6 });
    clock.start(0);
    let sawClickWithTranscript = false;
    let clearedAfterClick = false;
    for (let t = 0; t <= 28000; t += 20) {
      clock.tick(t);
      const s = clock.snapshot;
      if (s.agentResetting && s.sent && s.showResponse) sawClickWithTranscript = true;
      if (sawClickWithTranscript && !s.sent && s.mode === "temporal" && !s.agentResetting) {
        clearedAfterClick = true;
        break;
      }
    }
    expect(sawClickWithTranscript).toBe(true);
    expect(clearedAfterClick).toBe(true);
  });

  it("does not accumulate agent or graph state across five loops", () => {
    const { clock } = makeClock({ compact: true, prompt: 4, response: 6 });
    clock.start(0);
    let loops = 0;
    let prevHome = false;
    const starts: TourVisualState[] = [];
    for (let t = 0; t <= 90000; t += 40) {
      clock.tick(t);
      const s = clock.snapshot;
      const home = isLoopStartState(s) && s.cursorVisible;
      if (home && !prevHome) {
        loops += 1;
        starts.push({ ...s });
      }
      prevHome = home;
      if (loops >= 6) break;
    }
    expect(loops).toBeGreaterThanOrEqual(5);
    for (const start of starts) {
      expect(isLoopStartState(start)).toBe(true);
      expect(start.streamedChars).toBe(0);
      expect(start.actionCompleted).toBe(0);
      expect(start.mode).toBe("network");
    }
  });
});

describe("reduced motion presentation", () => {
  it("shows the same information without a roaming cursor", () => {
    const state = reducedMotionState(23, 40, 3);
    expect(state.cursorVisible).toBe(false);
    expect(state.selectedFile).toBe("graph");
    expect(state.selectedNode).toBe("graph");
    expect(state.mode).toBe("network");
    expect(state.typedChars).toBe(23);
    expect(state.showResponse).toBe(true);
    expect(state.actionsCollapsed).toBe(true);
    expect(state.actionCompleted).toBe(3);
    expect(INITIAL_TOUR_STATE.mode).toBe("network");
    expect(isLoopStartState(INITIAL_TOUR_STATE)).toBe(true);
  });
});
