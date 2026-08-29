/**
 * Guided hero demonstration timeline.
 *
 * Visual state is discrete (phase changes). Cursor motion is continuous and
 * is written to the DOM via transform — it does not live in React state.
 *
 * The loop is closed: last frame after cursorHome/loopDwell equals the
 * first frame of the next enter. Returning to that state is visible UI
 * (New Agent +, then Network), not a hidden snap.
 */

import {
  actionSnapshotAt,
  actionsDuration,
  holdDuration,
  streamedCharsAt,
  streamDuration,
  type AgentRunSnapshot,
} from "./agent-run";
import type { DemoAgentAction } from "./demo-questions";

type GraphMode = "network" | "temporal";

export const HERO_TARGETS = {
  fileGraphService: "file-graph-service",
  networkNodeParser: "network-node-parser",
  temporalToggle: "temporal-toggle",
  networkToggle: "network-toggle",
  temporalCommit: "temporal-commit",
  agentInput: "agent-input",
  agentSend: "agent-send",
  agentNew: "agent-new",
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
  streamedChars: number;
  actionIndex: number;
  actionCompleted: number;
  actionsCollapsed: boolean;
  agentResetting: boolean;
  cursorVisible: boolean;
  clicking: boolean;
};

export const NETWORK_COMMIT = 3;
export const TEMPORAL_FROM_COMMIT = 3;
export const TEMPORAL_TO_COMMIT = 1;
export const CURSOR_PARK = { x: -28, y: -40 };

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
  streamedChars: 0,
  actionIndex: -1,
  actionCompleted: 0,
  actionsCollapsed: false,
  agentResetting: false,
  cursorVisible: false,
  clicking: false,
};

/** Visible start of each loop: Network, empty agent, cursor parked. */
export const LOOP_START_STATE: TourVisualState = {
  ...INITIAL_TOUR_STATE,
  cursorVisible: true,
};

export function isLoopStartState(state: TourVisualState) {
  return (
    state.mode === "network" &&
    state.commit === NETWORK_COMMIT &&
    state.selectedFile === null &&
    state.selectedNode === null &&
    state.sent === false &&
    state.showResponse === false &&
    state.typedChars === 0 &&
    state.streamedChars === 0 &&
    state.actionIndex < 0 &&
    state.actionCompleted === 0 &&
    state.actionsCollapsed === false &&
    state.agentResetting === false &&
    state.agentFocused === false
  );
}

/** Representative reduced-motion state: same information, no roaming cursor. */
export function reducedMotionState(
  promptLength: number,
  responseLength: number,
  actionCount: number,
): TourVisualState {
  return {
    selectedFile: "graph",
    selectedNode: "graph",
    mode: "network",
    commit: NETWORK_COMMIT,
    activity: "graph",
    agentFocused: false,
    typedChars: promptLength,
    sent: true,
    showResponse: true,
    streamedChars: responseLength,
    actionIndex: -1,
    actionCompleted: actionCount,
    actionsCollapsed: true,
    agentResetting: false,
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
  | "runActions"
  | "streamResponse"
  | "holdResponse"
  | "moveToNewAgent"
  | "clickNewAgent"
  | "settleAgent"
  | "moveToNetwork"
  | "switchNetwork"
  | "settleNetwork"
  | "cursorHome"
  | "loopDwell";

export type TourTiming = {
  promptLength: number;
  responseLength: number;
  responseText: string;
  actions: readonly DemoAgentAction[];
  compact?: boolean;
};

/**
 * Comprehension dwells: stillness AFTER a visual change, before the next
 * attention cue. These are not cursor-travel times.
 */
export const HERO_DWELL = {
  enter: 360,
  fileSelected: 920,
  fileSelectedCompact: 1000,
  networkRelationship: 1020,
  temporalEntered: 880,
  temporalEnteredCompact: 940,
  temporalCommit: 1100,
  temporalCommitCompact: 1180,
  /** Micro-pauses so a click reads as a click, not comprehension beats. */
  preClick: 50,
  afterFocus: 140,
  afterSend: 80,
  afterNewAgentClick: 80,
  settleAgent: 180,
  afterNetworkClick: 420,
  settleNetwork: 220,
  afterHome: 80,
  loop: 280,
} as const;

/**
 * Cursor travel. Keep these relatively quick — dwell around them, do not
 * inflate them.
 */
export const HERO_MOVE = {
  file: 520,
  graph: 620,
  temporal: 480,
  temporalCompact: 400,
  commit: 440,
  agent: 560,
  send: 260,
  newAgent: 480,
  network: 500,
  home: 480,
} as const;

export type TourPhase = {
  id: TourPhaseId;
  target: HeroTarget | null;
  moveMs: number;
  dwellMs: number;
  click?: boolean;
  type?: boolean;
  actions?: boolean;
  stream?: boolean;
  hold?: boolean;
  park?: boolean;
  apply: (state: TourVisualState, timing: TourTiming) => TourVisualState;
};

function set(patch: Partial<TourVisualState>): TourPhase["apply"] {
  return (state) => ({ ...state, ...patch });
}

const FRESH_AGENT: Partial<TourVisualState> = {
  sent: false,
  showResponse: false,
  streamedChars: 0,
  typedChars: 0,
  agentFocused: false,
  actionIndex: -1,
  actionCompleted: 0,
  actionsCollapsed: false,
  agentResetting: false,
};

const FULL: TourPhase[] = [
  {
    id: "enter",
    target: null,
    moveMs: 0,
    dwellMs: HERO_DWELL.enter,
    park: true,
    apply: set({ ...LOOP_START_STATE }),
  },
  {
    id: "moveToFile",
    target: HERO_TARGETS.fileGraphService,
    moveMs: HERO_MOVE.file,
    dwellMs: HERO_DWELL.preClick,
    apply: set({ activity: "explorer", cursorVisible: true }),
  },
  {
    id: "selectFile",
    target: HERO_TARGETS.fileGraphService,
    moveMs: 0,
    dwellMs: HERO_DWELL.fileSelected,
    click: true,
    apply: set({
      selectedFile: "graph",
      selectedNode: "graph",
      activity: "explorer",
    }),
  },
  {
    id: "moveToNode",
    target: HERO_TARGETS.networkNodeParser,
    moveMs: HERO_MOVE.graph,
    dwellMs: HERO_DWELL.preClick,
    apply: set({ activity: "graph" }),
  },
  {
    id: "selectNode",
    target: HERO_TARGETS.networkNodeParser,
    moveMs: 0,
    dwellMs: HERO_DWELL.networkRelationship,
    click: true,
    apply: set({ selectedNode: "parser", activity: "graph" }),
  },
  {
    id: "moveToTemporal",
    target: HERO_TARGETS.temporalToggle,
    moveMs: HERO_MOVE.temporal,
    dwellMs: HERO_DWELL.preClick,
    apply: set({ activity: "graph" }),
  },
  {
    id: "switchTemporal",
    target: HERO_TARGETS.temporalToggle,
    moveMs: 0,
    dwellMs: HERO_DWELL.temporalEntered,
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
    moveMs: HERO_MOVE.commit,
    dwellMs: HERO_DWELL.preClick,
    apply: set({ mode: "temporal" }),
  },
  {
    id: "selectCommit",
    target: HERO_TARGETS.temporalCommit,
    moveMs: 0,
    dwellMs: HERO_DWELL.temporalCommit,
    click: true,
    apply: set({ commit: TEMPORAL_TO_COMMIT, mode: "temporal" }),
  },
  {
    id: "moveToAgent",
    target: HERO_TARGETS.agentInput,
    moveMs: HERO_MOVE.agent,
    dwellMs: HERO_DWELL.preClick,
    apply: set({ activity: "agent" }),
  },
  {
    id: "focusAgent",
    target: HERO_TARGETS.agentInput,
    moveMs: 0,
    dwellMs: HERO_DWELL.afterFocus,
    click: true,
    apply: set({ agentFocused: true, activity: "agent", typedChars: 0 }),
  },
  {
    id: "typeQuestion",
    target: HERO_TARGETS.agentInput,
    moveMs: 0,
    dwellMs: 0,
    type: true,
    apply: (state, timing) => ({
      ...state,
      agentFocused: true,
      typedChars: timing.promptLength,
      activity: "agent",
    }),
  },
  {
    id: "send",
    target: HERO_TARGETS.agentSend,
    moveMs: HERO_MOVE.send,
    dwellMs: HERO_DWELL.afterSend,
    click: true,
    apply: set({ sent: true, agentFocused: false, typedChars: 0, streamedChars: 0 }),
  },
  {
    id: "runActions",
    target: null,
    moveMs: 0,
    dwellMs: 0,
    actions: true,
    apply: set({ sent: true, showResponse: false, streamedChars: 0 }),
  },
  {
    id: "streamResponse",
    target: null,
    moveMs: 0,
    dwellMs: 0,
    stream: true,
    apply: (state, timing) => ({
      ...state,
      sent: true,
      showResponse: true,
      actionsCollapsed: true,
      actionCompleted: timing.actions.length,
      actionIndex: -1,
      streamedChars: 0,
    }),
  },
  {
    id: "holdResponse",
    target: null,
    moveMs: 0,
    dwellMs: 0,
    hold: true,
    apply: (state, timing) => ({
      ...state,
      showResponse: true,
      streamedChars: timing.responseLength,
      actionsCollapsed: true,
      cursorVisible: true,
    }),
  },
  {
    id: "moveToNewAgent",
    target: HERO_TARGETS.agentNew,
    moveMs: HERO_MOVE.newAgent,
    dwellMs: HERO_DWELL.preClick,
    apply: set({ activity: "agent", cursorVisible: true }),
  },
  {
    id: "clickNewAgent",
    target: HERO_TARGETS.agentNew,
    moveMs: 0,
    dwellMs: HERO_DWELL.afterNewAgentClick,
    click: true,
    apply: (state) => ({
      ...state,
      activity: "agent",
      agentFocused: false,
      agentResetting: true,
    }),
  },
  {
    id: "settleAgent",
    target: HERO_TARGETS.agentNew,
    moveMs: 0,
    dwellMs: HERO_DWELL.settleAgent,
    apply: (state) => ({ ...state, ...FRESH_AGENT, activity: "agent" }),
  },
  {
    id: "moveToNetwork",
    target: HERO_TARGETS.networkToggle,
    moveMs: HERO_MOVE.network,
    dwellMs: HERO_DWELL.preClick,
    apply: set({ activity: "graph" }),
  },
  {
    id: "switchNetwork",
    target: HERO_TARGETS.networkToggle,
    moveMs: 0,
    dwellMs: HERO_DWELL.afterNetworkClick,
    click: true,
    apply: set({
      mode: "network",
      commit: NETWORK_COMMIT,
      selectedFile: null,
      selectedNode: null,
      activity: "explorer",
    }),
  },
  {
    id: "settleNetwork",
    target: HERO_TARGETS.networkToggle,
    moveMs: 0,
    dwellMs: HERO_DWELL.settleNetwork,
    apply: set({
      mode: "network",
      commit: NETWORK_COMMIT,
      selectedFile: null,
      selectedNode: null,
      ...FRESH_AGENT,
      activity: "explorer",
    }),
  },
  {
    id: "cursorHome",
    target: null,
    moveMs: HERO_MOVE.home,
    dwellMs: HERO_DWELL.afterHome,
    park: true,
    apply: set({ ...LOOP_START_STATE }),
  },
  {
    id: "loopDwell",
    target: null,
    moveMs: 0,
    dwellMs: HERO_DWELL.loop,
    park: true,
    apply: set({ ...LOOP_START_STATE }),
  },
];

/** Narrow screens: file → graph → temporal → agent, then the same closed return. */
const COMPACT: TourPhase[] = FULL.filter((p) => p.id !== "moveToNode" && p.id !== "selectNode").map(
  (p) => {
    if (p.id === "selectFile") return { ...p, dwellMs: HERO_DWELL.fileSelectedCompact };
    if (p.id === "switchTemporal") return { ...p, dwellMs: HERO_DWELL.temporalEnteredCompact };
    if (p.id === "selectCommit") return { ...p, dwellMs: HERO_DWELL.temporalCommitCompact };
    if (p.id === "moveToTemporal") return { ...p, moveMs: HERO_MOVE.temporalCompact };
    return { ...p };
  },
);

export function phasesFor(compact: boolean): TourPhase[] {
  return compact ? COMPACT : FULL;
}

export const TYPE_MS_PER_CHAR = 28;
export const CLICK_MS = 90;

export function typeDuration(promptLength: number) {
  return Math.max(280, promptLength * TYPE_MS_PER_CHAR);
}

export function phaseDuration(phase: TourPhase, timing: TourTiming | number) {
  const ctx: TourTiming =
    typeof timing === "number"
      ? { promptLength: timing, responseLength: 0, responseText: "", actions: [] }
      : timing;
  if (phase.type) return typeDuration(ctx.promptLength);
  if (phase.actions) return actionsDuration(ctx.actions);
  if (phase.stream) return streamDuration(ctx.responseLength);
  if (phase.hold) return holdDuration(ctx.responseText, Boolean(ctx.compact));
  return phase.moveMs + (phase.click ? CLICK_MS : 0) + phase.dwellMs;
}

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeCursor(t: number) {
  return easeInOutCubic(Math.min(1, Math.max(0, t)));
}

export function loopDuration(compact: boolean, timing: TourTiming) {
  return phasesFor(compact).reduce((sum, phase) => sum + phaseDuration(phase, timing), 0);
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

export function parkPoint(file: Point): Point {
  return { x: file.x + CURSOR_PARK.x, y: file.y + CURSOR_PARK.y };
}

export function applyActionSnapshot(
  state: TourVisualState,
  snap: AgentRunSnapshot,
): TourVisualState {
  return {
    ...state,
    actionIndex: snap.activeIndex,
    actionCompleted: snap.completedCount,
    actionsCollapsed: snap.collapsed,
    showResponse: false,
    streamedChars: 0,
  };
}

export type TourClockHandlers = {
  onVisual: (state: TourVisualState) => void;
  onCursor: (x: number, y: number, clicking: boolean, opacity: number) => void;
  measure: (target: HeroTarget | null) => Point;
  promptLength: () => number;
  responseText: () => string;
  actions: () => readonly DemoAgentAction[];
  compact: () => boolean;
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
  private streamed = 0;
  private pausedAt: number | null = null;
  private appliedPhase = "";

  constructor(private handlers: TourClockHandlers) {
    this.phases = phasesFor(handlers.compact());
  }

  get snapshot(): TourVisualState {
    return this.visual;
  }

  start(now: number) {
    this.phases = phasesFor(this.handlers.compact());
    this.index = 0;
    this.elapsedInPhase = 0;
    this.phaseStart = now;
    this.pausedAt = null;
    this.visual = { ...INITIAL_TOUR_STATE };
    this.typed = 0;
    this.streamed = 0;
    this.appliedPhase = "";
    this.from = this.park();
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
    if (!phase) return;
    if (phase.hold) {
      this.to = { ...this.from };
      return;
    }
    const next = this.targetPoint(phase);
    this.from = next;
    this.to = next;
  }

  tick(now: number) {
    if (this.pausedAt !== null) return;
    const phase = this.phases[this.index];
    if (!phase) return;

    const timing = this.timing();
    const duration = phaseDuration(phase, timing);
    const t = now - this.phaseStart;

    if (phase.type) {
      const next = Math.min(timing.promptLength, Math.floor(t / TYPE_MS_PER_CHAR));
      if (next !== this.typed) {
        this.typed = next;
        this.visual = { ...this.visual, typedChars: next, agentFocused: true };
        this.handlers.onVisual(this.visual);
      }
    }

    if (phase.actions) {
      const snap = actionSnapshotAt(t, timing.actions);
      const next = applyActionSnapshot(this.visual, snap);
      if (
        next.actionIndex !== this.visual.actionIndex ||
        next.actionCompleted !== this.visual.actionCompleted ||
        next.actionsCollapsed !== this.visual.actionsCollapsed
      ) {
        this.visual = next;
        this.handlers.onVisual(this.visual);
      }
    }

    if (phase.stream) {
      const next = streamedCharsAt(t, timing.responseLength);
      if (next !== this.streamed) {
        this.streamed = next;
        this.visual = {
          ...this.visual,
          streamedChars: next,
          showResponse: true,
          actionsCollapsed: true,
        };
        this.handlers.onVisual(this.visual);
      }
    }

    // Hold is a reading beat: never interpolate toward a later target.
    const moving = !phase.hold && phase.moveMs > 0 && t < phase.moveMs;
    const p = moving ? easeCursor(t / phase.moveMs) : 1;
    const x = this.from.x + (this.to.x - this.from.x) * p;
    const y = this.from.y + (this.to.y - this.from.y) * p;
    const clicking =
      Boolean(phase.click) && !phase.hold && t >= phase.moveMs && t < phase.moveMs + CLICK_MS;
    this.handlers.onCursor(x, y, clicking, this.visual.cursorVisible ? 1 : 0);

    if (t >= duration) {
      this.advance(now);
    }
  }

  private timing(): TourTiming {
    const responseText = this.handlers.responseText();
    return {
      promptLength: this.handlers.promptLength(),
      responseLength: responseText.length,
      responseText,
      actions: this.handlers.actions(),
      compact: this.handlers.compact(),
    };
  }

  private park() {
    return parkPoint(this.handlers.measure(HERO_TARGETS.fileGraphService));
  }

  private targetPoint(phase: TourPhase): Point {
    if (phase.park) return this.park();
    if (phase.target) return this.handlers.measure(phase.target);
    return this.to;
  }

  private enterPhase(now: number) {
    const phase = this.phases[this.index]!;
    const timing = this.timing();
    this.from = { ...this.to };
    this.to = this.targetPoint(phase);
    if (phase.hold) {
      this.to = { ...this.from };
    }

    if (this.appliedPhase !== phase.id) {
      this.visual = phase.apply(this.visual, timing);
      if (phase.id === "typeQuestion") {
        this.visual = { ...this.visual, typedChars: this.typed };
      }
      if (phase.id === "streamResponse") {
        this.visual = { ...this.visual, streamedChars: this.streamed };
      }
      if (phase.id === "runActions") {
        this.visual = applyActionSnapshot(this.visual, actionSnapshotAt(0, timing.actions));
      }
      this.appliedPhase = phase.id;
      this.handlers.onVisual(this.visual);
    }
    this.phaseStart = now;
    this.elapsedInPhase = 0;
  }

  private advance(now: number) {
    this.index = (this.index + 1) % this.phases.length;
    if (this.index === 0) {
      this.typed = 0;
      this.streamed = 0;
      this.appliedPhase = "";
      this.visual = { ...LOOP_START_STATE };
      this.handlers.onVisual(this.visual);
    }
    this.enterPhase(now);
  }
}
