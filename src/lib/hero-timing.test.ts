import { describe, expect, it } from "vitest";
import { RESPONSE_HOLD_MIN_MS, actionsDuration } from "./agent-run";
import { DEMO_QUESTIONS } from "./demo-questions";
import { formatHeroTimingReport, reportAllHeroTimings, reportHeroTiming } from "./hero-timing";
import { HERO_DWELL, HERO_MOVE } from "./hero-tour";

describe("hero timing diagnostic", () => {
  it("reports a readable timeline for each canonical Home question", () => {
    const reports = reportAllHeroTimings(false);
    expect(reports).toHaveLength(3);

    for (const report of reports) {
      expect(report.fileSelectionMs).toBeGreaterThan(CLICKISH);
      expect(report.networkDwellMs).toBeGreaterThan(900);
      expect(report.temporalEnteredMs).toBeGreaterThan(800);
      expect(report.temporalCommitMs).toBeGreaterThan(1000);
      expect(report.actionsMs).toBeGreaterThan(2400);
      expect(report.summaryHoldMs).toBeGreaterThanOrEqual(300);
      expect(report.summaryHoldMs).toBeLessThanOrEqual(500);
      expect(report.actionsMs).toBeGreaterThan(report.summaryHoldMs);
      expect(report.streamMs).toBeGreaterThan(1000);
      expect(report.responseHoldMs).toBeGreaterThanOrEqual(RESPONSE_HOLD_MIN_MS);
      expect(report.responseVisibleMs).toBeGreaterThan(report.streamMs);
      expect(report.loopMs).toBeGreaterThanOrEqual(18_000);
      expect(report.loopMs).toBeLessThan(32_000);
      expect(report.phases[0]?.id).toBe("enter");
      expect(report.phases.at(-1)?.id).toBe("loopDwell");

      const ids = report.phases.map((p) => p.id);
      expect(ids.indexOf("runActions")).toBeLessThan(ids.indexOf("streamResponse"));
      expect(ids.indexOf("streamResponse")).toBeLessThan(ids.indexOf("holdResponse"));
      expect(ids.indexOf("holdResponse")).toBeLessThan(ids.indexOf("moveToNewAgent"));

      const text = formatHeroTimingReport(report);
      expect(text).toContain(report.prompt);
      expect(text).toContain("summary hold");
      expect(text).toContain("TOTAL");
    }
  });

  it("keeps cursor travel shorter than the surrounding comprehension dwells", () => {
    const report = reportHeroTiming(DEMO_QUESTIONS[0]!, false);
    const graphMove = report.phases.find((p) => p.id === "moveToNode")!;
    expect(graphMove.ms).toBeLessThanOrEqual(HERO_MOVE.graph + 80);
    expect(report.fileSelectionMs).toBeGreaterThan(graphMove.ms * 0.8);
  });

  it("does not drop the summary hold from compact timelines", () => {
    for (const q of DEMO_QUESTIONS) {
      const desktop = reportHeroTiming(q, false);
      const compact = reportHeroTiming(q, true);
      expect(compact.networkDwellMs).toBe(0);
      expect(compact.fileSelectionMs).toBeGreaterThanOrEqual(desktop.fileSelectionMs);
      expect(compact.fileSelectionMs).toBeGreaterThanOrEqual(HERO_DWELL.fileSelectedCompact);
      expect(compact.summaryHoldMs).toBeGreaterThanOrEqual(300);
      expect(compact.actionsMs).toBe(actionsDuration(q.actions));
      expect(compact.responseHoldMs).toBeGreaterThanOrEqual(desktop.responseHoldMs);
    }
  });
});

const CLICKISH = 800;
