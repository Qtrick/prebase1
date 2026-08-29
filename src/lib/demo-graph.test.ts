import { describe, expect, it } from "vitest";
import { networkFitScale } from "./demo-graph";

describe("network graph fit", () => {
  it("spreads the hero map instead of leaving a tight center cluster", () => {
    const hero = networkFitScale(600, 360, 312, 420);
    const previous = Math.min((312 - 112 - 56) / 600, (420 - 112 - 20) / 360);
    expect(hero).toBeGreaterThan(previous * 1.25);
    expect(hero).toBeLessThan(0.7);
  });
});
