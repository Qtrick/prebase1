import { describe, expect, it } from "vitest";
import {
  CLICK_MS,
  HERO_DWELL,
  HERO_MOVE,
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
import { DEMO_QUESTIONS, type DemoAgentAction } from "./demo-questions";
import {
  ACTION_SUMMARY_HOLD_MS,
  RESPONSE_HOLD_MAX_MS,
  RESPONSE_HOLD_MIN_MS,
  actionsDuration,
  holdDuration,
} from "./agent-run";

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
  responseText: DEMO_QUESTIONS[0]!.response,
  actions: DEMO_QUESTIONS[0]!.actions,
};

function makeClock(opts?: {
  compact?: boolean;
  prompt?: number;
  responseText?: string;
  actions?: readonly DemoAgentAction[];
}) {
  const visuals: TourVisualState[] = [];
  const cursors: Array<{ x: number; y: number; clicking: boolean }> = [];
  const responseText = opts?.responseText ?? "short reply here";
  const actions = opts?.actions ?? [
    { id: "a", label: "Reading src/graph/graphService.ts", durationMs: 40 },
  ];
  const instance = new HeroTourClock({
    onVisual: (s) => visuals.push({ ...s }),
    onCursor: (x, y, clicking) => cursors.push({ x, y, clicking }),
    measure: (target) => {
      if (target === HERO_TARGETS.fileGraphService) return { x: 40, y: 80 };
      if (target === HERO_TARGETS.networkNodeParser) return { x: 180, y: 140 };
      if (target === HERO_TARGETS.agentNew) return { x: 400, y: 40 };
      if (target === HERO_TARGETS.networkToggle) return { x: 360, y: 24 };
      return { x: 20, y: 30 };
    },
    promptLength: () => opts?.prompt ?? 12,
    responseText: () => responseText,
    actions: () => actions,
    compact: () => opts?.compact ?? false,
  });
  return { clock: instance, visuals, cursors };
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
    expect(ids).toContain("holdResponse");
    expect(ids).toContain("clickNewAgent");
    expect(ids).toContain("switchNetwork");
    expect(ids).toContain("cursorHome");
    expect(ids.indexOf("runActions")).toBeLessThan(ids.indexOf("streamResponse"));
    expect(ids.indexOf("streamResponse")).toBeLessThan(ids.indexOf("holdResponse"));
    expect(ids.indexOf("holdResponse")).toBeLessThan(ids.indexOf("moveToNewAgent"));
    expect(ids.indexOf("moveToNewAgent")).toBeLessThan(ids.indexOf("clickNewAgent"));
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

  it("gives file selection a comprehension dwell before the cursor leaves", () => {
    const select = phasesFor(false).find((p) => p.id === "selectFile")!;
    const move = phasesFor(false).find((p) => p.id === "moveToNode")!;
    expect(select.dwellMs).toBeGreaterThan(CLICK_MS * 5);
    expect(select.dwellMs).toBeGreaterThanOrEqual(850);
    expect(select.dwellMs).toBeLessThanOrEqual(1100);
    expect(move.moveMs).toBeLessThanOrEqual(700);
    expect(select.dwellMs).toBeGreaterThan(move.moveMs * 0.9);
  });

  it("holds network, temporal, and commit states as comprehension beats", () => {
    const byId = Object.fromEntries(phasesFor(false).map((p) => [p.id, p]));
    expect(byId.selectNode!.dwellMs).toBeGreaterThanOrEqual(950);
    expect(byId.switchTemporal!.dwellMs).toBeGreaterThanOrEqual(800);
    expect(byId.selectCommit!.dwellMs).toBeGreaterThanOrEqual(1000);
    expect(byId.moveToTemporal!.moveMs).toBeLessThan(byId.selectNode!.dwellMs);
    expect(byId.selectNode!.dwellMs).toBeGreaterThan(byId.moveToTemporal!.moveMs);
  });

  it("does not slow cursor travel to create comprehension time", () => {
    expect(HERO_MOVE.graph).toBeLessThanOrEqual(700);
    expect(HERO_MOVE.file).toBeLessThanOrEqual(600);
    expect(HERO_DWELL.fileSelected).toBeGreaterThan(HERO_MOVE.file * 1.4);
  });

  it("gives compact screens equal or longer semantic dwells", () => {
    const desktop = Object.fromEntries(phasesFor(false).map((p) => [p.id, p]));
    const compact = Object.fromEntries(phasesFor(true).map((p) => [p.id, p]));
    expect(compact.selectFile!.dwellMs).toBeGreaterThanOrEqual(desktop.selectFile!.dwellMs);
    expect(compact.switchTemporal!.dwellMs).toBeGreaterThanOrEqual(desktop.switchTemporal!.dwellMs);
    expect(compact.selectCommit!.dwellMs).toBeGreaterThanOrEqual(desktop.selectCommit!.dwellMs);
  });

  it("runs actions, then summary, then stream, then a readable hold, then New Agent", () => {
    const ids = phasesFor(false).map((p) => p.id);
    expect(ids.indexOf("runActions")).toBeLessThan(ids.indexOf("streamResponse"));
    expect(ids.indexOf("streamResponse")).toBeLessThan(ids.indexOf("holdResponse"));
    expect(ids.indexOf("holdResponse")).toBeLessThan(ids.indexOf("moveToNewAgent"));
    expect(actionsDuration(sample.actions)).toBeGreaterThan(2400);
    expect(ACTION_SUMMARY_HOLD_MS).toBeGreaterThanOrEqual(300);
    expect(ACTION_SUMMARY_HOLD_MS).toBeLessThanOrEqual(500);
    expect(holdDuration(sample.responseText)).toBeGreaterThanOrEqual(RESPONSE_HOLD_MIN_MS);
    expect(holdDuration(sample.responseText)).toBeLessThanOrEqual(RESPONSE_HOLD_MAX_MS);
    const hold = phasesFor(false).find((p) => p.id === "holdResponse")!;
    expect(hold.moveMs).toBe(0);
    expect(hold.target).toBeNull();
    expect(phaseDuration(hold, sample)).toBe(holdDuration(sample.responseText));
  });

  it("keeps a full loop readable without becoming an unbounded movie", () => {
    const ms = loopDuration(false, sample);
    expect(ms).toBeGreaterThanOrEqual(18_000);
    expect(ms).toBeLessThan(32_000);
  });
});

describe("hero tour clock", () => {
  it("applies file selection then network selection, and pause freezes advancement", () => {
    const { clock, visuals } = makeClock();
    clock.start(0);
    expect(visuals.at(-1)?.cursorVisible).toBe(true);

    let t = 0;
    const step = 16;
    const fileClickBy = HERO_DWELL.enter + HERO_MOVE.file + HERO_DWELL.preClick + CLICK_MS + 80;
    while (t < fileClickBy && visuals.every((v) => v.selectedFile !== "graph")) {
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

  it("does not start the next graph move immediately after the file click", () => {
    const { clock } = makeClock();
    clock.start(0);
    let clickedAt: number | null = null;
    let leftExplorerAt: number | null = null;
    for (let t = 0; t <= 4000; t += 10) {
      clock.tick(t);
      const s = clock.snapshot;
      if (clickedAt === null && s.selectedFile === "graph") clickedAt = t;
      if (clickedAt !== null && s.activity === "graph" && leftExplorerAt === null)
        leftExplorerAt = t;
    }
    expect(clickedAt).not.toBeNull();
    expect(leftExplorerAt).not.toBeNull();
    expect(leftExplorerAt! - clickedAt!).toBeGreaterThanOrEqual(HERO_DWELL.fileSelected);
  });

  it("keeps the cursor still while the completed response is held", () => {
    const { clock, cursors } = makeClock({
      compact: true,
      prompt: 4,
      responseText: "one two three four five",
    });
    clock.start(0);
    let holding = false;
    let holdStart = 0;
    const duringHold: Array<{ x: number; y: number }> = [];
    for (let t = 0; t <= 25000; t += 20) {
      const before = cursors.length;
      clock.tick(t);
      const s = clock.snapshot;
      if (s.showResponse && s.streamedChars >= 23 && !s.agentResetting) {
        if (!holding) {
          holding = true;
          holdStart = t;
        }
        if (t > holdStart + 80 && t < holdStart + 2000) {
          const last = cursors[cursors.length - 1];
          if (last && cursors.length > before) duringHold.push({ x: last.x, y: last.y });
        }
      }
    }
    expect(holding).toBe(true);
    expect(duringHold.length).toBeGreaterThan(5);
    const first = duringHold[0]!;
    for (const p of duringHold) {
      expect(Math.abs(p.x - first.x)).toBeLessThan(0.5);
      expect(Math.abs(p.y - first.y)).toBeLessThan(0.5);
    }
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
    const { clock, visuals } = makeClock({
      compact: true,
      prompt: 4,
      responseText: "abcdefghijkl",
    });
    clock.start(0);
    let sawAction = false;
    let streamedDuringAction = false;
    let streamedAfter = false;
    for (let t = 0; t <= 28000; t += 20) {
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
    const { clock } = makeClock({ compact: true, prompt: 4, responseText: "abcdef" });
    clock.start(0);
    let sawTemporal = false;
    let sawNewAgent = false;
    let sawNetworkReturn = false;
    let startAfterReturn: TourVisualState | null = null;
    for (let t = 0; t <= 40000; t += 25) {
      clock.tick(t);
      const s = clock.snapshot;
      if (s.mode === "temporal") sawTemporal = true;
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
    const { clock } = makeClock({ compact: true, prompt: 4, responseText: "abcdef" });
    clock.start(0);
    let sawClickWithTranscript = false;
    let clearedAfterClick = false;
    for (let t = 0; t <= 40000; t += 20) {
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

  it("shows a collapsed summary after actions finish and before any streamed characters", () => {
    const { clock } = makeClock({ compact: true, prompt: 4, responseText: "abcdefghijkl" });
    clock.start(0);
    let tAction: number | null = null;
    let tSummary: number | null = null;
    let tStream: number | null = null;
    let tHold: number | null = null;
    let tNewAgent: number | null = null;
    let summarySnap: TourVisualState | null = null;
    for (let t = 0; t <= 40000; t += 20) {
      clock.tick(t);
      const s = clock.snapshot;
      if (tAction === null && (s.actionIndex >= 0 || s.actionCompleted > 0)) tAction = t;
      if (tSummary === null && s.actionsCollapsed && !s.showResponse && s.streamedChars === 0) {
        tSummary = t;
        summarySnap = { ...s };
      }
      if (tStream === null && s.streamedChars > 0) tStream = t;
      if (tHold === null && s.showResponse && s.streamedChars >= 12 && !s.agentResetting) tHold = t;
      if (tNewAgent === null && s.agentResetting) {
        tNewAgent = t;
        break;
      }
    }
    expect(tAction).not.toBeNull();
    expect(tSummary).not.toBeNull();
    expect(tStream).not.toBeNull();
    expect(tHold).not.toBeNull();
    expect(tNewAgent).not.toBeNull();
    expect(summarySnap?.actionCompleted).toBeGreaterThan(0);
    expect(summarySnap?.actionIndex).toBe(-1);
    expect(tAction!).toBeLessThan(tSummary!);
    expect(tSummary!).toBeLessThan(tStream!);
    expect(tStream!).toBeLessThan(tHold!);
    expect(tHold!).toBeLessThan(tNewAgent!);
    expect(tNewAgent! - tHold!).toBeGreaterThanOrEqual(RESPONSE_HOLD_MIN_MS);
    expect(tNewAgent! - tHold!).toBeLessThan(RESPONSE_HOLD_MAX_MS + 2500);
  });

  it("does not begin disappearing the response while it is still streaming", () => {
    const reply = "abcdefghijkl";
    const { clock } = makeClock({ compact: true, prompt: 4, responseText: reply });
    clock.start(0);
    let sawPartialStream = false;
    for (let t = 0; t <= 40000; t += 20) {
      clock.tick(t);
      const s = clock.snapshot;
      if (s.streamedChars > 0 && s.streamedChars < reply.length) {
        sawPartialStream = true;
        expect(s.showResponse).toBe(true);
        expect(s.sent).toBe(true);
        expect(s.agentResetting).toBe(false);
        expect(s.actionsCollapsed).toBe(true);
      }
    }
    expect(sawPartialStream).toBe(true);
  });

  it("pauses the action log and resumes the same action instead of restarting", () => {
    const { clock } = makeClock({
      compact: true,
      prompt: 4,
      responseText: "abcdefghijkl",
      actions: [
        { id: "a", label: "Reading src/graph/graphService.ts", durationMs: 900 },
        { id: "b", label: "Inspecting Code Graph architecture overview", durationMs: 900 },
      ],
    });
    clock.start(0);
    let t = 0;
    for (; t <= 20000; t += 20) {
      clock.tick(t);
      if (clock.snapshot.actionIndex === 0 && clock.snapshot.sent) break;
    }
    expect(clock.snapshot.actionIndex).toBe(0);
    expect(clock.snapshot.actionCompleted).toBe(0);
    expect(clock.snapshot.showResponse).toBe(false);

    clock.pause(t);
    const frozen = { ...clock.snapshot };
    for (let i = 0; i < 4000; i += 20) {
      t += 20;
      clock.tick(t);
      expect(clock.snapshot.actionIndex).toBe(frozen.actionIndex);
      expect(clock.snapshot.actionCompleted).toBe(frozen.actionCompleted);
      expect(clock.snapshot.actionsCollapsed).toBe(false);
      expect(clock.snapshot.showResponse).toBe(false);
      expect(clock.snapshot.streamedChars).toBe(0);
    }

    clock.resume(t);
    clock.tick(t + 16);
    expect(clock.snapshot.actionIndex).toBe(0);
    expect(clock.snapshot.actionCompleted).toBe(0);
    expect(clock.snapshot.showResponse).toBe(false);

    let progressed = false;
    for (let i = t + 16; i <= t + 5000; i += 20) {
      clock.tick(i);
      const s = clock.snapshot;
      if (s.actionCompleted > 0 || s.actionIndex === 1 || s.actionsCollapsed) {
        progressed = true;
        expect(s.sent).toBe(true);
        break;
      }
    }
    expect(progressed).toBe(true);
  });

  it("pauses the response hold and resumes the same hold instead of skipping to New Agent", () => {
    const reply = "short reply here";
    const { clock } = makeClock({ compact: true, prompt: 4, responseText: reply });
    clock.start(0);
    let t = 0;
    let fullSince: number | null = null;
    for (; t <= 40000; t += 20) {
      clock.tick(t);
      const s = clock.snapshot;
      if (s.showResponse && s.streamedChars >= reply.length && !s.agentResetting) {
        if (fullSince === null) fullSince = t;
        // Past stream settle so this is the hold phase, not the last stream tick.
        if (t - fullSince > 200) break;
      }
    }
    expect(fullSince).not.toBeNull();
    expect(clock.snapshot.showResponse).toBe(true);
    expect(clock.snapshot.streamedChars).toBe(reply.length);
    expect(clock.snapshot.agentResetting).toBe(false);

    clock.pause(t);
    for (let i = 0; i < 10000; i += 20) {
      t += 20;
      clock.tick(t);
      expect(clock.snapshot.showResponse).toBe(true);
      expect(clock.snapshot.streamedChars).toBe(reply.length);
      expect(clock.snapshot.agentResetting).toBe(false);
      expect(clock.snapshot.sent).toBe(true);
    }

    clock.resume(t);
    clock.tick(t + 16);
    expect(clock.snapshot.showResponse).toBe(true);
    expect(clock.snapshot.streamedChars).toBe(reply.length);
    expect(clock.snapshot.agentResetting).toBe(false);

    let sawNewAgent = false;
    for (let i = t + 16; i <= t + 20000; i += 20) {
      clock.tick(i);
      if (clock.snapshot.agentResetting) {
        sawNewAgent = true;
        break;
      }
    }
    expect(sawNewAgent).toBe(true);
  });

  it("does not accumulate agent or graph state across five loops", () => {
    const { clock } = makeClock({ compact: true, prompt: 4, responseText: "abcdef" });
    clock.start(0);
    let loops = 0;
    let prevHome = false;
    const starts: TourVisualState[] = [];
    for (let t = 0; t <= 160000; t += 40) {
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
