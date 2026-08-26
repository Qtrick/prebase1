/**
 * Deterministic, local-only Agent demonstration logic for the launch site.
 *
 * There is no LLM here. Responses are generated from the illustrative demo
 * graph (NEIGHBORS / NODE_BY_ID) so the answers stay truthful about the model
 * that is on screen. Pacing mirrors the PreBase Magnus extension's
 * `streamPace.ts` defaults (~3 chars per 22ms tick).
 */

import { CATEGORY_LABEL, NEIGHBORS, NODE_BY_ID, type DemoNode } from "@/lib/demo-graph";

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

/** Distinct question shapes the deterministic demo can answer. */
export type PromptIntent =
  | "dependency"
  | "relationship_trace"
  | "impact"
  | "verify"
  | "general";

export function classifyPromptIntent(prompt: string): PromptIntent {
  const p = prompt.toLowerCase();
  if (/\btrace\b|\bpath\b|\bwalk\b|\bfollow\b|relationship/.test(p)) return "relationship_trace";
  if (/\bchange\b|\bedit\b|\bimpact\b|\baffect\b|blast|break/.test(p)) return "impact";
  if (/\bverify\b|\btest\b|\bcheck\b/.test(p)) return "verify";
  if (/depends|dependenc|\buses\b|\bused\b|consume|import/.test(p)) return "dependency";
  return "general";
}

function labelsOf(ids: string[]) {
  return ids.map((id) => NODE_BY_ID[id]?.label ?? id);
}

function list(ids: string[]) {
  const labels = labelsOf(ids);
  if (labels.length === 0) return "nothing";
  if (labels.length === 1) return labels[0]!;
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/** Group neighbours by their area of the map so a trace reads like a trace. */
function groupByCategory(ids: string[]) {
  const groups = new Map<string, string[]>();
  for (const id of ids) {
    const n = NODE_BY_ID[id];
    if (!n) continue;
    const key = CATEGORY_LABEL[n.category] ?? n.category;
    groups.set(key, [...(groups.get(key) ?? []), n.label]);
  }
  return [...groups.entries()];
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** Mode-aware prompt suggestions, node specific where possible. */
export function suggestionsFor(id: string | null, mode: AgentMode = "Ask"): string[] {
  if (!id) {
    return mode === "Ask"
      ? ["What is the Code Graph?", "How does the Temporal Graph work?", "What loads as context?"]
      : mode === "Edit"
        ? ["Select a file to edit", "How is change scope decided?", "What stays untouched?"]
        : ["Select a file to plan against", "How are modules verified?", "What gets re-indexed?"];
  }
  const label = NODE_BY_ID[id]?.label ?? id;

  if (mode === "Edit") {
    return [
      `Update ${label} safely`,
      "Include its direct dependents",
      "Prepare the smallest change",
    ];
  }
  if (mode === "Agent") {
    return ["Trace and fix the issue", "Verify the affected modules", "Make the change and test it"];
  }
  return [`What depends on ${label}?`, "Trace its relationships", "What changes if I edit this?"];
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

/* ------------------------------------------------------------------ */
/* Ask-mode answers, one per intent                                    */
/* ------------------------------------------------------------------ */

function dependencyAnswer(node: DemoNode, rel: string[]) {
  if (rel.length === 0) {
    return `${node.label} has no direct relationships in this illustrative model — nothing else in the map connects to it yet.`;
  }
  return `${node.label} is directly connected to ${rel.length} ${plural(rel.length, "module", "modules")} in this model: ${list(rel)}.\nThese are the files PreBase surfaces first when inspecting its immediate relationship scope.`;
}

function traceAnswer(node: DemoNode, rel: string[]) {
  if (rel.length === 0) {
    return `Starting at ${node.label} (${node.path}), the trace ends immediately — this node sits on the edge of the illustrative model.`;
  }
  const groups = groupByCategory(rel);
  const legs = groups
    .map(([area, labels]) => `${labels.join(" and ")} in ${area.toLowerCase()}`)
    .join(", then ");
  return `Starting at ${node.label}, PreBase reaches ${legs}.\nThose edges define the immediate path an Agent would inspect before expanding farther out.`;
}

function impactAnswer(node: DemoNode, rel: string[]) {
  if (rel.length === 0) {
    return `Editing ${node.label} has no connected modules in this model, so the verification scope is the file itself.`;
  }
  return `Editing ${node.label} puts its ${rel.length} directly connected ${plural(rel.length, "module", "modules")} inside the first verification scope: ${list(rel)}.\nEverything outside that set stays untouched, so the blast radius is visible before you start.`;
}

function verifyAnswer(node: DemoNode, rel: string[]) {
  return `To verify ${node.label}, PreBase would re-check the ${rel.length} connected ${plural(rel.length, "module", "modules")} first (${list(rel)}), then re-index that subgraph and confirm nothing outside it moved.`;
}

function generalAnswer(node: DemoNode, rel: string[]) {
  return `${node.label} lives at ${node.path} in the ${CATEGORY_LABEL[node.category].toLowerCase()} area of the map, with ${rel.length} direct ${plural(rel.length, "relationship", "relationships")}: ${list(rel)}.`;
}

/** Deterministic reply built from the graph model. */
export function replyFor(mode: AgentMode, id: string | null, prompt: string): string {
  const node = id ? NODE_BY_ID[id] : undefined;
  const rel = id ? (NEIGHBORS[id] ?? []) : [];

  if (!node) {
    return "Select a file in the graph and I'll use it — plus everything it connects to — as context.";
  }

  const intent = classifyPromptIntent(prompt);

  if (mode === "Edit") {
    if (intent === "impact" || intent === "dependency") {
      return `Change scope for ${node.label}: the file itself, then its ${rel.length} direct ${plural(rel.length, "dependent", "dependents")} — ${list(rel)}. Nothing else is staged.`;
    }
    if (intent === "relationship_trace") {
      return `Before editing, I'd walk ${node.label} → ${list(rel)} so the edit follows real edges rather than filename guesses.`;
    }
    return `I'd update ${node.label} first, then verify the ${rel.length} directly connected ${plural(rel.length, "module", "modules")}: ${list(rel)}. Unrelated graph nodes stay outside the change scope.`;
  }

  if (mode === "Agent") {
    if (intent === "verify") {
      return `Verification plan for ${node.label}:\n1. Re-run checks touching ${list(rel)}.\n2. Re-index the affected subgraph.\n3. Confirm no node outside those ${rel.length} edges changed.`;
    }
    if (intent === "relationship_trace") {
      return `Trace from ${node.label} (${node.path}):\n${groupByCategory(rel)
        .map(([area, labels]) => `· ${area}: ${labels.join(", ")}`)
        .join("\n")}\nThat subgraph is where I'd start locating the issue.`;
    }
    return `Plan for ${node.label} (${node.path}):\n1. Read ${node.label} and its ${rel.length} direct edges.\n2. Apply the change, then follow through to ${list(rel)}.\n3. Re-index the affected subgraph and verify nothing outside it moved.`;
  }

  // Ask
  switch (intent) {
    case "dependency":
      return dependencyAnswer(node, rel);
    case "relationship_trace":
      return traceAnswer(node, rel);
    case "impact":
      return impactAnswer(node, rel);
    case "verify":
      return verifyAnswer(node, rel);
    default:
      return generalAnswer(node, rel);
  }
}
