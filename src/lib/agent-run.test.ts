import { describe, expect, it } from "vitest";
import {
  ACTION_COLLAPSE_MS,
  ACTION_GAP_MS,
  ACTION_SUMMARY_HOLD_MS,
  COMPACT_HOLD_EXTRA_MS,
  RESPONSE_HOLD_MAX_MS,
  RESPONSE_HOLD_MIN_MS,
  STREAM_SETTLE_MS,
  actionDuration,
  actionSnapshotAt,
  actionsComplete,
  actionsDuration,
  estimatedReadMs,
  finishedLabel,
  holdDuration,
  scheduleActions,
  scheduleStream,
  streamedCharsAt,
  streamDuration,
  suggestedActionMs,
  wordCount,
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
    const during = actionSnapshotAt(actionDuration(first) / 2, actions);
    expect(during.activeIndex).toBe(0);
    expect(during.completedCount).toBe(0);
  });

  it("keeps completed rows visible while the next action is active", () => {
    const first = actionDuration(actions[0]!);
    const afterFirst = actionSnapshotAt(first + ACTION_GAP_MS + 10, actions);
    expect(afterFirst.completedCount).toBe(1);
    expect(afterFirst.activeIndex).toBe(1);
    expect(afterFirst.collapsed).toBe(false);
  });

  it("gives a 3-step sequence a multi-second readable window", () => {
    const ms = actionsDuration(actions);
    expect(ms).toBeGreaterThan(2400);
    expect(ms).toBeLessThan(4500);
  });

  it("shows the collapsed summary before the action window ends", () => {
    const total = actionsDuration(actions);
    const beforeSummaryHold = total - ACTION_SUMMARY_HOLD_MS / 2;
    const snap = actionSnapshotAt(beforeSummaryHold, actions);
    expect(snap.collapsed).toBe(true);
    expect(snap.completedCount).toBe(actions.length);
    expect(actionsComplete(snap, actions.length)).toBe(true);
  });

  it("collapses only after the last action, then holds the summary", () => {
    const work = actions.reduce(
      (sum, action, i) =>
        sum + actionDuration(action) + (i < actions.length - 1 ? ACTION_GAP_MS : 0),
      0,
    );
    expect(actionSnapshotAt(work + ACTION_COLLAPSE_MS / 2, actions).collapsed).toBe(false);
    expect(actionSnapshotAt(work + ACTION_COLLAPSE_MS, actions).collapsed).toBe(true);
    expect(
      actionSnapshotAt(work + ACTION_COLLAPSE_MS + ACTION_SUMMARY_HOLD_MS / 2, actions).collapsed,
    ).toBe(true);
  });

  it("gives longer action labels more time within a narrow range", () => {
    const short = suggestedActionMs("Searching workspace code");
    const mid = suggestedActionMs("Inspecting Code Graph architecture overview");
    const long = suggestedActionMs(
      'Inspecting incoming/outgoing dependencies for "src/graph/graphService.ts"',
    );
    expect(short).toBeLessThan(mid);
    expect(mid).toBeLessThan(long);
    expect(long - short).toBeLessThanOrEqual(160);
    expect(short).toBeGreaterThanOrEqual(600);
    expect(long).toBeLessThanOrEqual(850);
  });

  it("labels the collapsed summary with the action count", () => {
    expect(finishedLabel(3)).toBe("Finished with 3 steps");
    expect(finishedLabel(1)).toBe("Finished with 1 step");
  });

  it("delays stream start until after the summary hold (Product/Explore parity)", () => {
    const delays: number[] = [];
    scheduleActions(
      actions,
      (_fn, ms) => delays.push(ms),
      () => {},
      () => {},
    );
    expect(delays).toContain(actionsDuration(actions) - ACTION_SUMMARY_HOLD_MS);
    expect(Math.max(...delays)).toBe(actionsDuration(actions));
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
    expect(actionSnapshotAt(actionMs - ACTION_COLLAPSE_MS / 2, actions).collapsed).toBe(true);
    expect(actionSnapshotAt(actionMs - ACTION_SUMMARY_HOLD_MS - 10, actions).streamedChars).toBe(0);
  });

  it("can cancel an in-flight stream", () => {
    const slices: string[] = [];
    let live = true;
    scheduleStream("abcdefghi", {
      later: (fn, ms) => {
        if (!live) return;
        if (ms === 0) fn();
        else {
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
});

describe("reading-aware response hold", () => {
  it("sizes hold from word count, not a character clamp around one second", () => {
    const short = "The Code Graph maps this repository.";
    const long = DEMO_QUESTIONS[1]!.response;
    const manyCharsFewWords = "A".repeat(400);
    const manyWords = Array.from({ length: 40 }, () => "word").join(" ");
    expect(wordCount(long)).toBeGreaterThan(wordCount(short));
    expect(holdDuration(long)).toBeGreaterThanOrEqual(holdDuration(short));
    expect(holdDuration(short)).toBeGreaterThanOrEqual(RESPONSE_HOLD_MIN_MS);
    expect(holdDuration(long)).toBeLessThanOrEqual(RESPONSE_HOLD_MAX_MS);
    expect(holdDuration(long)).toBeGreaterThan(4000);
    expect(manyCharsFewWords.length).toBeGreaterThan(manyWords.length);
    expect(wordCount(manyWords)).toBeGreaterThan(wordCount(manyCharsFewWords));
    expect(holdDuration(manyWords)).toBeGreaterThan(holdDuration(manyCharsFewWords));
  });

  it("gives current canonical responses a multi-second readable hold", () => {
    for (const q of DEMO_QUESTIONS) {
      const hold = holdDuration(q.response);
      expect(hold).toBeGreaterThanOrEqual(RESPONSE_HOLD_MIN_MS);
      expect(hold).toBeLessThanOrEqual(RESPONSE_HOLD_MAX_MS);
      expect(hold).toBeGreaterThan(estimatedReadMs(q.response) * 0.35);
    }
  });

  it("adds a modest compact reading extra without unbounded growth", () => {
    const text = DEMO_QUESTIONS[0]!.response;
    expect(holdDuration(text, true)).toBeGreaterThanOrEqual(holdDuration(text, false));
    expect(holdDuration(text, true) - holdDuration(text, false)).toBeLessThanOrEqual(
      COMPACT_HOLD_EXTRA_MS,
    );
  });

  it("clamps an unreadably long response so the hold cannot stall the loop", () => {
    const huge = Array.from({ length: 400 }, () => "word").join(" ");
    expect(estimatedReadMs(huge)).toBeGreaterThan(RESPONSE_HOLD_MAX_MS * 2);
    expect(holdDuration(huge)).toBeLessThanOrEqual(RESPONSE_HOLD_MAX_MS);
    expect(holdDuration(huge, true)).toBeLessThanOrEqual(
      RESPONSE_HOLD_MAX_MS + COMPACT_HOLD_EXTRA_MS,
    );
    expect(holdDuration(huge)).toBeGreaterThanOrEqual(RESPONSE_HOLD_MIN_MS);
  });

  it("keeps stream duration independent of the reading hold", () => {
    expect(streamDuration(9)).toBe(
      (Math.ceil(9 / STREAM_CHARS_PER_TICK) - 1) * STREAM_INTERVAL_MS + STREAM_SETTLE_MS,
    );
    expect(streamDuration(9)).toBeLessThan(holdDuration("one two three four five six"));
  });
});
