/**
 * Guided hero demonstration timeline.
 *
 * Visual state is discrete (phase changes). Cursor motion is continuous and
 * is written to the DOM via transform — it does not live in React state.
 */

type GraphMode = "network" | "temporal";

export const HERO_TARGETS = {
  fileGraphService: "file-graph-service",
  networkNodeParser: "network-node-parser",
  temporalToggle: "temporal-toggle",
  temporalCommit: "temporal-commit",
  agentInput: "agent-input",
  agentSend: "agent-send",
} as const;

export type HeroTarget = (typeof HERO_TARGETS)[keyof typeof HERO_TARGETS];

export type ActivityId = "explorer" | "search" | "scm" | "graph" | "agent";

export type TourVisualState = {
  selectedFile: string | null;
  selectedNode: string | null;
  mode: GraphMode;
  commit: number;
  activity: ActivityId;
  agentFocused: boolean;
  typedChars: number;
  sent: boolean;
  showResponse: boolean;
  cursorVisible: boolean;
  clicking: boolean;
};

export const NETWORK_COMMIT = 3;
export const TEMPORAL_FROM_COMMIT = 3;
export const TEMPORAL_TO_COMMIT = 1;

export const INITIAL_TOUR_STATE: TourVisualState = {
  selectedFile: null,
  selectedNode: null,
  mode: "network",
  commit: NETWORK_COMMIT,
  activity: "explorer",
  agentFocused: false,
  typedChars: 0,
  sent: false,
  showResponse: false,
  cursorVisible: false,
  clicking: false,
};

/** Representative reduced-motion state: same information, no roaming cursor. */
export function reducedMotionState(promptLength: number): TourVisualState {
  return {
    selectedFile: "graph",
    selectedNode: "graph",
    mode: "network",
    commit: NETWORK_COMMIT,
    activity: "graph",
    agentFocused: true,
    typedChars: promptLength,
    sent: true,
    showResponse: true,
    cursorVisible: false,
    clicking: false,
  };
}

export type TourPhaseId =
  | "enter"
  | "moveToFile"
  | "selectFile"
  | "moveToNode"
  | "selectNode"
  | "moveToTemporal"
  | "switchTemporal"
  | "moveToCommit"
  | "selectCommit"
  | "moveToAgent"
  | "focusAgent"
  | "typeQuestion"
  | "send"
  | "showResponse"
  | "hold"
  | "reset";

export type TourPhase = {
  id: TourPhaseId;
  target: HeroTarget | null;
  moveMs: number;
  dwellMs: number;
  click?: boolean;
  /** Character-by-character typing; dwellMs is replaced by length * msPerChar. */
  type?: boolean;
  apply: (state: TourVisualState, promptLength: number) => TourVisualState;
};

function set(
  patch: Partial<TourVisualState>,
): (state: TourVisualState, promptLength: number) => TourVisualState {
  return (state) => ({ ...state, ...patch });
}

const FULL: TourPhase[] = [
  {
    id: "enter",
    target: null,
    moveMs: 0,
    dwellMs: 480,
    apply: set({ cursorVisible: true, clicking: false }),
  },
  {
    id: "moveToFile",
    target: HERO_TARGETS.fileGraphService,
    moveMs: 560,
    dwellMs: 80,
    apply: set({ activity: "explorer", cursorVisible: true }),
  },
  {
    id: "selectFile",
    target: HERO_TARGETS.fileGraphService,
    moveMs: 0,
    dwellMs: 560,
    click: true,
    apply: set({
      selectedFile: "graph",
      selectedNode: "graph",
      activity: "explorer",
      clicking: false,
    }),
  },
  {
    id: "moveToNode",
    target: HERO_TARGETS.networkNodeParser,
    moveMs: 680,
    dwellMs: 80,
    apply: set({ activity: "graph" }),
  },
  {
    id: "selectNode",
    target: HERO_TARGETS.networkNodeParser,
    moveMs: 0,
    dwellMs: 920,
    click: true,
    apply: set({ selectedNode: "parser", activity: "graph" }),
  },
  {
    id: "moveToTemporal",
    target: HERO_TARGETS.temporalToggle,
    moveMs: 520,
    dwellMs: 60,
    apply: set({ activity: "graph" }),
  },
  {
    id: "switchTemporal",
    target: HERO_TARGETS.temporalToggle,
    moveMs: 0,
    dwellMs: 720,
    click: true,
    apply: set({
      mode: "temporal",
      commit: TEMPORAL_FROM_COMMIT,
      selectedNode: "graph",
      selectedFile: "graph",
      activity: "graph",
    }),
  },
  {
    id: "moveToCommit",
    target: HERO_TARGETS.temporalCommit,
    moveMs: 480,
    dwellMs: 60,
    apply: set({ mode: "temporal" }),
  },
  {
    id: "selectCommit",
    target: HERO_TARGETS.temporalCommit,
    moveMs: 0,
    dwellMs: 1040,
    click: true,
    apply: set({ commit: TEMPORAL_TO_COMMIT, mode: "temporal" }),
  },
  {
    id: "moveToAgent",
    target: HERO_TARGETS.agentInput,
    moveMs: 640,
    dwellMs: 40,
    apply: set({ activity: "agent" }),
  },
  {
    id: "focusAgent",
    target: HERO_TARGETS.agentInput,
    moveMs: 0,
    dwellMs: 180,
    click: true,
    apply: set({ agentFocused: true, activity: "agent", typedChars: 0 }),
  },
  {
    id: "typeQuestion",
    target: HERO_TARGETS.agentInput,
    moveMs: 0,
    dwellMs: 0,
    type: true,
    apply: (state, promptLength) => ({
      ...state,
      agentFocused: true,
      typedChars: promptLength,
      activity: "agent",
    }),
  },
  {
    id: "send",
    target: HERO_TARGETS.agentSend,
    moveMs: 280,
    dwellMs: 160,
    click: true,
    apply: set({ sent: true, agentFocused: false, typedChars: 0 }),
  },
  {
    id: "showResponse",
    target: null,
    moveMs: 0,
    dwellMs: 720,
    apply: set({ showResponse: true, sent: true }),
  },
  {
    id: "hold",
    target: null,
    moveMs: 0,
    dwellMs: 2000,
    apply: set({ showResponse: true, cursorVisible: true }),
  },
  {
    id: "reset",
    target: null,
    moveMs: 0,
    dwellMs: 640,
    apply: (state) => ({
      ...INITIAL_TOUR_STATE,
      cursorVisible: false,
      clicking: false,
      selectedFile: state.selectedFile,
      selectedNode: state.selectedNode,
      mode: state.mode,
      commit: state.commit,
      showResponse: state.showResponse,
      sent: state.sent,
      typedChars: state.typedChars,
      activity: state.activity,
    }),
  },
];

/** Narrow screens: file → graph → temporal → agent, fewer pointer hops. */
const COMPACT: TourPhase[] = FULL.filter(
  (p) => p.id !== "moveToNode" && p.id !== "selectNode",
).map((p) => {
  if (p.id === "selectFile") {
    return { ...p, dwellMs: 640 };
  }
  if (p.id === "moveToTemporal") {
    return { ...p, moveMs: 420 };
  }
  return p;
});

export function phasesFor(compact: boolean): TourPhase[] {
  return compact ? COMPACT : FULL;
}

export const TYPE_MS_PER_CHAR = 28;
export const CLICK_MS = 90;

export function typeDuration(promptLength: number) {
  return Math.max(280, promptLength * TYPE_MS_PER_CHAR);
}

export function phaseDuration(phase: TourPhase, promptLength: number) {
  const dwell = phase.type ? typeDuration(promptLength) : phase.dwellMs;
  return phase.moveMs + (phase.click ? CLICK_MS : 0) + dwell;
}

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Ease-in-out for cursor travel (compositor-friendly transform interpolation). */
export function easeCursor(t: number) {
  return easeInOutCubic(Math.min(1, Math.max(0, t)));
}

export function loopDuration(compact: boolean, promptLength: number) {
  return phasesFor(compact).reduce((sum, phase) => sum + phaseDuration(phase, promptLength), 0);
}

export type PauseReasons = {
  manual: boolean;
  offscreen: boolean;
  hidden: boolean;
  reducedMotion: boolean;
};

export function shouldPlay(reasons: PauseReasons) {
  return !reasons.manual && !reasons.offscreen && !reasons.hidden && !reasons.reducedMotion;
}

export type Point = { x: number; y: number };

export function measureTarget(root: HTMLElement, target: string): Point | null {
  const el = root.querySelector<HTMLElement>(`[data-demo-target="${target}"]`);
  if (!el) return null;
  const rootBox = root.getBoundingClientRect();
  const box = el.getBoundingClientRect();
  return {
    x: box.left - rootBox.left + box.width / 2,
    y: box.top - rootBox.top + box.height / 2,
  };
}

export type TourClockHandlers = {
  onVisual: (state: TourVisualState) => void;
  onCursor: (x: number, y: number, clicking: boolean, opacity: number) => void;
  measure: (target: HeroTarget | null) => Point;
  promptLength: () => number;
  compact: () => boolean;
  now?: () => number;
};

/**
 * One clock for the whole choreography. Call `tick(now)` from rAF while
 * `shouldPlay` is true. Pause freezes time; resume continues the current phase.
 */
export class HeroTourClock {
  private phases: TourPhase[];
  private index = 0;
  private phaseStart = 0;
  private elapsedInPhase = 0;
  private from: Point = { x: 24, y: 36 };
  private to: Point = { x: 24, y: 36 };
  private visual: TourVisualState = { ...INITIAL_TOUR_STATE };
  private typed = 0;
  private clickUntil = 0;
  private pausedAt: number | null = null;
  private appliedPhase = "";

  constructor(private handlers: TourClockHandlers) {
    this.phases = phasesFor(handlers.compact());
  }

  start(now: number) {
    this.phases = phasesFor(this.handlers.compact());
    this.index = 0;
    this.elapsedInPhase = 0;
    this.phaseStart = now;
    this.pausedAt = null;
    this.visual = { ...INITIAL_TOUR_STATE };
    this.typed = 0;
    this.appliedPhase = "";
    this.from = this.handlers.measure(null);
    this.to = this.from;
    this.enterPhase(now);
  }

  pause(now: number) {
    if (this.pausedAt !== null) return;
    this.pausedAt = now;
    this.elapsedInPhase = now - this.phaseStart;
  }

  resume(now: number) {
    if (this.pausedAt === null) return;
    this.phaseStart = now - this.elapsedInPhase;
    this.pausedAt = null;
  }

  get paused() {
    return this.pausedAt !== null;
  }

  remeasure() {
    const phase = this.phases[this.index];
    if (!phase?.target) return;
    const next = this.handlers.measure(phase.target);
    this.from = next;
    this.to = next;
  }

  tick(now: number) {
    if (this.pausedAt !== null) return;
    const phase = this.phases[this.index];
    if (!phase) return;

    const promptLen = this.handlers.promptLength();
    const duration = phaseDuration(phase, promptLen);
    const t = now - this.phaseStart;

    if (phase.click && t >= phase.moveMs && t < phase.moveMs + CLICK_MS) {
      if (now > this.clickUntil) {
        this.clickUntil = now + CLICK_MS;
      }
    }

    if (phase.type) {
      const typeT = Math.max(0, t - phase.moveMs);
      const next = Math.min(promptLen, Math.floor(typeT / TYPE_MS_PER_CHAR));
      if (next !== this.typed) {
        this.typed = next;
        this.visual = { ...this.visual, typedChars: next, agentFocused: true };
        this.handlers.onVisual(this.visual);
      }
    }

    const moving = phase.moveMs > 0 && t < phase.moveMs;
    const p = moving ? easeCursor(t / phase.moveMs) : 1;
    const x = this.from.x + (this.to.x - this.from.x) * p;
    const y = this.from.y + (this.to.y - this.from.y) * p;
    const clicking = Boolean(phase.click) && t >= phase.moveMs && t < phase.moveMs + CLICK_MS;
    const opacity = phase.id === "reset" ? Math.max(0, 1 - t / 280) : this.visual.cursorVisible ? 1 : 0;
    this.handlers.onCursor(x, y, clicking, opacity);

    if (t >= duration) {
      this.advance(now);
    }
  }

  private enterPhase(now: number) {
    const phase = this.phases[this.index]!;
    const promptLen = this.handlers.promptLength();
    this.from = { ...this.to };
    if (phase.target) {
      this.to = this.handlers.measure(phase.target);
    }
    if (phase.id === "enter") {
      this.to = this.handlers.measure(HERO_TARGETS.fileGraphService);
      this.from = { x: this.to.x - 28, y: this.to.y - 40 };
      this.to = this.from;
    }
    if (phase.id === "reset") {
      this.to = this.from;
    }

    if (this.appliedPhase !== phase.id) {
      this.visual = phase.apply(this.visual, promptLen);
      if (phase.id === "typeQuestion") {
        this.visual = { ...this.visual, typedChars: this.typed };
      }
      if (phase.id === "reset") {
        this.visual = { ...this.visual, cursorVisible: false };
      }
      this.appliedPhase = phase.id;
      this.handlers.onVisual(this.visual);
    }
    this.phaseStart = now;
    this.elapsedInPhase = 0;
  }

  private advance(now: number) {
    const phase = this.phases[this.index]!;
    if (phase.id === "reset") {
      this.visual = { ...INITIAL_TOUR_STATE };
      this.typed = 0;
      this.appliedPhase = "";
      this.handlers.onVisual(this.visual);
      this.index = 0;
      this.enterPhase(now);
      return;
    }
    this.index = (this.index + 1) % this.phases.length;
    this.enterPhase(now);
  }
}
