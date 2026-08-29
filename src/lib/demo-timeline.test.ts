import { describe, expect, it } from "vitest";
import { COMMITS, timelineProgressRatio } from "./demo-graph";
import { NETWORK_COMMIT, INITIAL_TOUR_STATE, isLoopStartState } from "./hero-tour";

describe("shared demo commit timeline", () => {
  it("uses the same commit markers Home and Product render", () => {
    expect(COMMITS.map((c) => c.label)).toEqual(["a83fc2", "c192af", "7fd410", "HEAD"]);
  });

  it("sizes the connecting rail from measured span, not a fixed pixel length", () => {
    expect(timelineProgressRatio(0)).toBe(0);
    expect(timelineProgressRatio(COMMITS.length - 1)).toBe(1);
    expect(timelineProgressRatio(NETWORK_COMMIT) * 261).toBeCloseTo(261);
    expect(timelineProgressRatio(1, 4) * 200).toBeCloseTo(200 / 3);
  });

  it("does not keep Temporal selected at loop start", () => {
    expect(INITIAL_TOUR_STATE.mode).toBe("network");
    expect(INITIAL_TOUR_STATE.commit).toBe(NETWORK_COMMIT);
    expect(isLoopStartState(INITIAL_TOUR_STATE)).toBe(true);
  });
});
