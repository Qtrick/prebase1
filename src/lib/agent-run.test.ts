import { describe, expect, it } from "vitest";
import {
  ACTION_COLLAPSE_MS,
  actionSnapshotAt,
  actionsComplete,
  actionsDuration,
  finishedLabel,
  holdDuration,
  scheduleStream,
  streamedCharsAt,
  streamDuration,
} from "./agent-run";
import { STREAM_CHARS_PER_TICK, STREAM_INTERVAL_MS } from "./agent-demo";
import { DEMO_QUESTIONS } from "./demo-questions";

const actions = DEMO_QUESTIONS[0]!.actions;

describe("agent action log timing", () => {
  it("keeps the response empty until every action has completed and collapsed", () => {
    const total = actionsDuration(actions);
    const mid = actionSnapshotAt(40, actions);
    expect(mid.phase).toBe("acting");
    expect(mid.collapsed).toBe(false);
    expect(mid.streamedChars).toBe(0);
    expect(actionsComplete(mid, actions.length)).toBe(false);

    const done = actionSnapshotAt(total, actions);
    expect(done.collapsed).toBe(true);
    expect(done.completedCount).toBe(actions.length);
    expect(done.activeIndex).toBe(-1);
    expect(done.streamedChars).toBe(0);
    expect(actionsComplete(done, actions.length)).toBe(true);
  });

  it("advances completedCount only after each action duration", () => {
    const first = actions[0]!;
    const during = actionSnapshotAt((first.durationMs ?? 340) / 2, actions);
    expect(during.activeIndex).toBe(0);
    expect(during.completedCount).toBe(0);
  });

  it("labels the collapsed summary with the action count", () => {
    expect(finishedLabel(3)).toBe("Finished with 3 steps");
    expect(finishedLabel(1)).toBe("Finished with 1 step");
  });
});

describe("shared response stream", () => {
  it("uses the site stream pace (3 chars / 22ms)", () => {
    expect(STREAM_CHARS_PER_TICK).toBe(3);
    expect(STREAM_INTERVAL_MS).toBe(22);
    expect(streamedCharsAt(0, 20)).toBe(3);
    expect(streamedCharsAt(STREAM_INTERVAL_MS, 20)).toBe(6);
    expect(streamedCharsAt(10_000, 20)).toBe(20);
  });

  it("does not begin streaming during the action window", () => {
    const actionMs = actionsDuration(actions);
    expect(streamedCharsAt(0, 100)).toBeGreaterThan(0);
    expect(actionSnapshotAt(actionMs - ACTION_COLLAPSE_MS / 2, actions).collapsed).toBe(false);
    expect(actionSnapshotAt(actionMs - ACTION_COLLAPSE_MS / 2, actions).streamedChars).toBe(0);
  });

  it("can cancel an in-flight stream", () => {
    const slices: string[] = [];
    let live = true;
    scheduleStream("abcdefghi", {
      later: (fn, ms) => {
        if (!live) return;
        if (ms === 0) fn();
        else {
          // Deterministic: run one queued tick then cancel.
          live = false;
        }
      },
      onSlice: (s) => slices.push(s),
      onDone: () => slices.push("done"),
    });
    expect(slices[0]).toBe("abc");
    expect(slices).not.toContain("done");
    expect(slices.at(-1)).not.toBe("abcdefghi");
  });

  it("shows the full response immediately under reduced motion", () => {
    let text = "";
    let done = false;
    scheduleStream("hello", {
      later: (fn) => fn(),
      onSlice: (s) => {
        text = s;
      },
      onDone: () => {
        done = true;
      },
      reducedMotion: true,
    });
    expect(text).toBe("hello");
    expect(done).toBe(true);
  });

  it("sizes hold from response length within a short bound", () => {
    expect(holdDuration(20)).toBeGreaterThanOrEqual(900);
    expect(holdDuration(400)).toBeLessThanOrEqual(1500);
    expect(streamDuration(9)).toBe((Math.ceil(9 / 3) - 1) * STREAM_INTERVAL_MS + 60);
  });
});
