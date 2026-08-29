/**
 * Deterministic Home-hero timing report for tests and development.
 * Not used by production UI.
 */

import {
  ACTION_COLLAPSE_MS,
  ACTION_SUMMARY_HOLD_MS,
  actionsDuration,
  estimatedReadMs,
  holdDuration,
  streamDuration,
  wordCount,
} from "./agent-run";
import type { DemoQuestion } from "./demo-questions";
import { DEMO_QUESTIONS } from "./demo-questions";
import {
  CLICK_MS,
  loopDuration,
  phaseDuration,
  phasesFor,
  type TourPhaseId,
  type TourTiming,
} from "./hero-tour";

export type HeroPhaseMs = { id: TourPhaseId; ms: number };

export type HeroTimingReport = {
  questionId: DemoQuestion["id"];
  prompt: string;
  compact: boolean;
  words: number;
  estimatedReadMs: number;
  phases: HeroPhaseMs[];
  fileSelectionMs: number;
  networkDwellMs: number;
  temporalEnteredMs: number;
  temporalCommitMs: number;
  actionsMs: number;
  summaryHoldMs: number;
  streamMs: number;
  responseHoldMs: number;
  responseVisibleMs: number;
  resetMs: number;
  loopMs: number;
};

function timingFor(question: DemoQuestion, compact: boolean): TourTiming {
  return {
    promptLength: question.prompt.length,
    responseLength: question.response.length,
    responseText: question.response,
    actions: question.actions,
    compact,
  };
}

function phaseMs(id: TourPhaseId, phases: HeroPhaseMs[]) {
  return phases.find((p) => p.id === id)?.ms ?? 0;
}

function sumIds(phases: HeroPhaseMs[], ids: readonly TourPhaseId[]) {
  const set = new Set(ids);
  return phases.reduce((sum, p) => (set.has(p.id) ? sum + p.ms : sum), 0);
}

export function reportHeroTiming(question: DemoQuestion, compact = false): HeroTimingReport {
  const timing = timingFor(question, compact);
  const phases = phasesFor(compact).map((phase) => ({
    id: phase.id,
    ms: phaseDuration(phase, timing),
  }));
  const filePhase = phasesFor(compact).find((p) => p.id === "selectFile");
  const streamMs = streamDuration(question.response.length);
  const responseHoldMs = holdDuration(question.response, compact);
  const actionsMs = actionsDuration(question.actions);
  return {
    questionId: question.id,
    prompt: question.prompt,
    compact,
    words: wordCount(question.response),
    estimatedReadMs: estimatedReadMs(question.response),
    phases,
    fileSelectionMs: filePhase ? filePhase.dwellMs + (filePhase.click ? CLICK_MS : 0) : 0,
    networkDwellMs: phaseMs("selectNode", phases),
    temporalEnteredMs: phaseMs("switchTemporal", phases),
    temporalCommitMs: phaseMs("selectCommit", phases),
    actionsMs,
    summaryHoldMs: ACTION_SUMMARY_HOLD_MS,
    streamMs,
    responseHoldMs,
    responseVisibleMs: streamMs + responseHoldMs,
    resetMs: sumIds(phases, [
      "moveToNewAgent",
      "clickNewAgent",
      "settleAgent",
      "moveToNetwork",
      "switchNetwork",
      "settleNetwork",
      "cursorHome",
      "loopDwell",
    ]),
    loopMs: loopDuration(compact, timing),
  };
}

export function reportAllHeroTimings(compact = false): HeroTimingReport[] {
  return DEMO_QUESTIONS.map((q) => reportHeroTiming(q, compact));
}

/** Collapse completes this many ms before streaming starts. */
export function summaryLeadMs() {
  return ACTION_COLLAPSE_MS + ACTION_SUMMARY_HOLD_MS;
}

export function formatHeroTimingReport(report: HeroTimingReport) {
  const sec = (ms: number) => `${(ms / 1000).toFixed(2)}s`;
  return [
    `Question: ${report.prompt}`,
    `Loop:`,
    `  file selection        ${sec(report.fileSelectionMs)}`,
    `  network dwell         ${sec(report.networkDwellMs)}`,
    `  temporal              ${sec(report.temporalEnteredMs)}`,
    `  commit                ${sec(report.temporalCommitMs)}`,
    `  actions               ${sec(report.actionsMs)}  (includes ${sec(report.summaryHoldMs)} summary hold)`,
    `  stream                ${sec(report.streamMs)}`,
    `  response hold         ${sec(report.responseHoldMs)}`,
    `  reset                 ${sec(report.resetMs)}`,
    `  TOTAL                 ${sec(report.loopMs)}`,
  ].join("\n");
}
