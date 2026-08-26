/**
 * Deterministic, local-only Agent demonstration logic for the launch site.
 *
 * There is no LLM here. Responses are generated from the illustrative demo
 * graph (NEIGHBORS / NODE_BY_ID) so the answers stay truthful about the model
 * that is on screen. Pacing mirrors the PreBase Magnus extension's
 * `streamPace.ts` defaults (~3 chars per 22ms tick).
 */

import { NEIGHBORS, NODE_BY_ID } from "@/lib/demo-graph";

export type AgentMode = "Ask" | "Edit" | "Agent";
export const AGENT_MODES: AgentMode[] = ["Ask", "Edit", "Agent"];

/** streamPace.ts defaults */
export const STREAM_CHARS_PER_TICK = 3;
export const STREAM_INTERVAL_MS = 22;

export type ChatMessage = {
  id: string;
  role: "user" | "agent";
  text: string;
};

function list(ids: string[]) {
  const labels = ids.map((id) => NODE_BY_ID[id]?.label ?? id);
  if (labels.length <= 1) return labels[0] ?? "nothing";
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/** 2–3 node-specific prompt suggestions. */
export function suggestionsFor(id: string | null): string[] {
  if (!id) return ["What is the Code Graph?", "How does Temporal Graph work?"];
  const label = NODE_BY_ID[id]?.label ?? id;
  switch (id) {
    case "auth":
      return ["Where is auth used?", "Trace session dependencies", "What would this change affect?"];
    case "runtime":
      return ["What launches Runtime Preview?", "Trace runtime dependencies", "What depends on this?"];
    case "api":
      return ["What consumes this API?", "Trace its relationships", "What changes if I edit this?"];
    default:
      return [`What depends on ${label}?`, "Trace its relationships", "What changes if I edit this?"];
  }
}

/** Short pre-response activity steps, mode aware. */
export function activityFor(mode: AgentMode, id: string | null): string[] {
  const n = NEIGHBORS[id ?? ""]?.length ?? 0;
  if (mode === "Edit") {
    return ["Reading selected node…", "Tracing direct dependents…", "Preparing change scope…"];
  }
  if (mode === "Agent") {
    return [
      "Reading Code Graph…",
      `Tracing ${n} relationships…`,
      "Checking affected modules…",
      "Preparing verification…",
    ];
  }
  return ["Reading graph context…"];
}

export function placeholderFor(id: string | null) {
  const label = id ? NODE_BY_ID[id]?.label : null;
  return label ? `Ask about ${label}…` : "Ask about this codebase…";
}

/** Deterministic reply built from the graph model. */
export function replyFor(mode: AgentMode, id: string | null, prompt: string): string {
  const node = id ? NODE_BY_ID[id] : undefined;
  const rel = id ? (NEIGHBORS[id] ?? []) : [];
  const p = prompt.toLowerCase();

  if (!node) {
    return "Select a file in the graph and I'll use it — plus everything it connects to — as context.";
  }

  const relText = rel.length ? list(rel) : "no direct relationships in this model";

  if (mode === "Edit") {
    return `I'd update ${node.label} first, then verify the ${rel.length} directly connected module${rel.length === 1 ? "" : "s"}: ${relText}. Unrelated graph nodes stay outside the change scope.`;
  }

  if (mode === "Agent") {
    return `Plan for ${node.label} (${node.path}):\n1. Read ${node.label} and its ${rel.length} direct edges.\n2. Apply the change, then follow through to ${relText}.\n3. Re-index the affected subgraph and verify nothing outside it moved.`;
  }

  // Ask
  if (p.includes("change") || p.includes("edit") || p.includes("affect")) {
    return `Editing ${node.label} propagates to its ${rel.length} direct relationship${rel.length === 1 ? "" : "s"}: ${relText}. Everything else in the map stays untouched, so the blast radius is visible before you start.`;
  }
  if (p.includes("trace") || p.includes("path") || p.includes("depend")) {
    return `${node.label} sits at ${node.path}. Following its edges reaches ${relText}. PreBase walks those edges for you instead of guessing from filenames.`;
  }
  return `${node.label} has ${rel.length} direct relationship${rel.length === 1 ? "" : "s"}: ${relText}. It lives at ${node.path} in the ${node.category} area of the map.`;
}
