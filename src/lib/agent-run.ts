/**
 * Shared Agent-run primitive for Home, Product, and Explore.
 *
 * Observable tool activity first, then a collapsed summary, then the
 * existing Magnus-faithful stream pace. Never exposes chain-of-thought.
 */

import { STREAM_CHARS_PER_TICK, STREAM_INTERVAL_MS } from "./agent-demo";
import type { DemoAgentAction } from "./demo-questions";

export const DEFAULT_ACTION_MS = 340;
export const ACTION_GAP_MS = 80;
export const ACTION_COLLAPSE_MS = 160;
export const STREAM_SETTLE_MS = 60;

export type AgentRunPhase = "idle" | "acting" | "collapsed" | "streaming" | "complete";

export type AgentRunSnapshot = {
  phase: AgentRunPhase;
  /** Currently active action, or -1 if none. */
  activeIndex: number;
  /** How many actions have completed. */
  completedCount: number;
  collapsed: boolean;
  streamedChars: number;
};

export const IDLE_RUN: AgentRunSnapshot = {
  phase: "idle",
  activeIndex: -1,
  completedCount: 0,
  collapsed: false,
  streamedChars: 0,
};

export function actionDuration(action: DemoAgentAction) {
  return action.durationMs ?? DEFAULT_ACTION_MS;
}

export function actionsDuration(actions: readonly DemoAgentAction[]) {
  if (actions.length === 0) return ACTION_COLLAPSE_MS;
  const work = actions.reduce((sum, action, i) => {
    return sum + actionDuration(action) + (i < actions.length - 1 ? ACTION_GAP_MS : 0);
  }, 0);
  return work + ACTION_COLLAPSE_MS;
}

export function streamDuration(responseLength: number) {
  if (responseLength <= 0) return 0;
  const ticks = Math.ceil(responseLength / STREAM_CHARS_PER_TICK);
  return Math.max(0, (ticks - 1) * STREAM_INTERVAL_MS) + STREAM_SETTLE_MS;
}

export function streamedCharsAt(elapsedMs: number, responseLength: number) {
  if (responseLength <= 0) return 0;
  const ticks = Math.floor(elapsedMs / STREAM_INTERVAL_MS) + 1;
  return Math.min(responseLength, ticks * STREAM_CHARS_PER_TICK);
}

export function holdDuration(responseLength: number) {
  return Math.min(1500, Math.max(900, 700 + responseLength * 1.6));
}

/**
 * Action-log snapshot for `elapsed` milliseconds after send.
 * Response streaming is a separate phase and must not overlap.
 */
export function actionSnapshotAt(elapsedMs: number, actions: readonly DemoAgentAction[]): AgentRunSnapshot {
  if (actions.length === 0) {
    return {
      phase: elapsedMs >= ACTION_COLLAPSE_MS ? "collapsed" : "acting",
      activeIndex: -1,
      completedCount: 0,
      collapsed: elapsedMs >= ACTION_COLLAPSE_MS,
      streamedChars: 0,
    };
  }

  let t = 0;
  for (let i = 0; i < actions.length; i++) {
    const dur = actionDuration(actions[i]!);
    if (elapsedMs < t + dur) {
      return {
        phase: "acting",
        activeIndex: i,
        completedCount: i,
        collapsed: false,
        streamedChars: 0,
      };
    }
    t += dur;
    if (i < actions.length - 1) {
      if (elapsedMs < t + ACTION_GAP_MS) {
        return {
          phase: "acting",
          activeIndex: -1,
          completedCount: i + 1,
          collapsed: false,
          streamedChars: 0,
        };
      }
      t += ACTION_GAP_MS;
    }
  }

  const collapsed = elapsedMs >= t + ACTION_COLLAPSE_MS;
  return {
    phase: collapsed ? "collapsed" : "acting",
    activeIndex: -1,
    completedCount: actions.length,
    collapsed,
    streamedChars: 0,
  };
}

export function actionsComplete(snapshot: AgentRunSnapshot, actionCount: number) {
  return snapshot.completedCount >= actionCount && snapshot.collapsed;
}

export function finishedLabel(count: number) {
  return `Finished with ${count} step${count === 1 ? "" : "s"}`;
}

export type StreamSchedule = {
  later: (fn: () => void, ms: number) => void;
  onSlice: (text: string) => void;
  onDone: () => void;
  reducedMotion?: boolean;
};

/** Shared reveal used by Product/Explore. Home uses the same math in the tour clock. */
export function scheduleStream(text: string, schedule: StreamSchedule) {
  if (schedule.reducedMotion || text.length === 0) {
    schedule.onSlice(text);
    schedule.onDone();
    return;
  }
  let i = 0;
  const tick = () => {
    i = Math.min(text.length, i + STREAM_CHARS_PER_TICK);
    schedule.onSlice(text.slice(0, i));
    if (i < text.length) schedule.later(tick, STREAM_INTERVAL_MS);
    else schedule.onDone();
  };
  tick();
}

export function scheduleActions(
  actions: readonly DemoAgentAction[],
  later: (fn: () => void, ms: number) => void,
  onSnapshot: (snapshot: AgentRunSnapshot) => void,
  onComplete: () => void,
) {
  let t = 0;
  if (actions.length === 0) {
    later(() => {
      onSnapshot({ ...IDLE_RUN, phase: "collapsed", collapsed: true });
      onComplete();
    }, ACTION_COLLAPSE_MS);
    return;
  }
  actions.forEach((action, i) => {
    later(() => {
      onSnapshot({
        phase: "acting",
        activeIndex: i,
        completedCount: i,
        collapsed: false,
        streamedChars: 0,
      });
    }, t);
    t += actionDuration(action);
    later(() => {
      onSnapshot({
        phase: "acting",
        activeIndex: -1,
        completedCount: i + 1,
        collapsed: false,
        streamedChars: 0,
      });
    }, t);
    if (i < actions.length - 1) t += ACTION_GAP_MS;
  });
  later(() => {
    onSnapshot({
      phase: "collapsed",
      activeIndex: -1,
      completedCount: actions.length,
      collapsed: true,
      streamedChars: 0,
    });
    onComplete();
  }, t + ACTION_COLLAPSE_MS);
}
