import { useEffect, useState } from "react";

/**
 * Canonical demo questions for the launch site.
 *
 * There are exactly three questions and exactly three surfaces. A session
 * permutation assigns each question to one surface and stays stable for the
 * tab lifetime (sessionStorage). Randomness is UX-only.
 */

export const DEMO_SURFACES = ["home", "product", "explore"] as const;
export type DemoSurface = (typeof DEMO_SURFACES)[number];

export const DEMO_QUESTION_IDS = ["code-graph", "temporal-graph", "agent-context"] as const;
export type DemoQuestionId = (typeof DEMO_QUESTION_IDS)[number];

export type DemoQuestion = {
  id: DemoQuestionId;
  prompt: string;
  response: string;
};

/**
 * The three strongest existing Ask-mode prompts from the previous suggestion
 * banks, with dedicated responses that stay truthful about the illustrative
 * demo graph (not claimed product capabilities beyond what the model shows).
 */
export const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    id: "code-graph",
    prompt: "What is the Code Graph?",
    response:
      "The Code Graph is a map of how this repository connects. graphService.ts sits at the center of Graph core, with direct edges to parser.ts, indexer.ts, api.ts, app.tsx, views.ts, auth.ts, and temporalStore.ts. Those edges are what PreBase surfaces first.",
  },
  {
    id: "temporal-graph",
    prompt: "How does the Temporal Graph work?",
    response:
      "The Temporal Graph shows the same map as structural snapshots over Git history. Files appear as added, removed, modified, or renamed — temporalStore.ts appears later, cache.ts is removed, and dependencyIndex.ts is renamed from graphIndex.ts — while the surrounding codebase stays in view.",
  },
  {
    id: "agent-context",
    prompt: "What loads as context?",
    response:
      "When a file is selected, PreBase loads it plus its connected modules. For graphService.ts that is parser.ts, indexer.ts, api.ts, app.tsx, views.ts, auth.ts, and temporalStore.ts. That subgraph is the first context an agent would receive.",
  },
];

export const QUESTION_ORDER_KEY = "prebase.demoQuestionOrder.v1";

export const QUESTION_BY_ID: Record<DemoQuestionId, DemoQuestion> = Object.fromEntries(
  DEMO_QUESTIONS.map((q) => [q.id, q]),
) as Record<DemoQuestionId, DemoQuestion>;

export function isQuestionId(value: unknown): value is DemoQuestionId {
  return typeof value === "string" && (DEMO_QUESTION_IDS as readonly string[]).includes(value);
}

export function questionById(id: DemoQuestionId): DemoQuestion {
  return QUESTION_BY_ID[id];
}

export function responseForPrompt(prompt: string): string | null {
  const match = DEMO_QUESTIONS.find((q) => q.prompt === prompt);
  return match?.response ?? null;
}

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

/** Fisher–Yates. Inject `random` so tests can pin a permutation. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const a = out[i]!;
    out[i] = out[j]!;
    out[j] = a;
  }
  return out;
}

export function parseStoredOrder(raw: string | null): DemoQuestionId[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== DEMO_QUESTION_IDS.length) return null;
    if (!parsed.every(isQuestionId)) return null;
    if (new Set(parsed).size !== DEMO_QUESTION_IDS.length) return null;
    if (!DEMO_QUESTION_IDS.every((id) => parsed.includes(id))) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function assignmentFromOrder(order: readonly DemoQuestionId[]): Record<DemoSurface, DemoQuestionId> {
  return {
    home: order[0]!,
    product: order[1]!,
    explore: order[2]!,
  };
}

export function assignedQuestion(surface: DemoSurface, order: readonly DemoQuestionId[]): DemoQuestion {
  return questionById(assignmentFromOrder(order)[surface]);
}

let cachedOrder: DemoQuestionId[] | null = null;

export function resetQuestionOrderCache() {
  cachedOrder = null;
}

function readSessionStorage(): StorageLike | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Resolve the session permutation. Reuses memory + sessionStorage so React
 * re-renders and in-tab navigations never reshuffle. Regenerates if the cache
 * is missing or invalid. Safe to call during SSR — returns canonical order
 * without writing, then the client effect replaces it after hydration.
 */
export function resolveQuestionOrder(
  storage: StorageLike | null = readSessionStorage(),
  random: () => number = Math.random,
): DemoQuestionId[] {
  if (cachedOrder) return cachedOrder;

  const stored = parseStoredOrder(storage?.getItem(QUESTION_ORDER_KEY) ?? null);
  if (stored) {
    cachedOrder = stored;
    return stored;
  }

  const next = shuffle(DEMO_QUESTION_IDS, random);
  cachedOrder = next;
  try {
    storage?.setItem(QUESTION_ORDER_KEY, JSON.stringify(next));
  } catch {
    // Private mode / blocked storage: keep the in-memory permutation.
  }
  return next;
}

/** Canonical order used for the SSR/first paint so hydration matches. */
export const SSR_QUESTION_ORDER: DemoQuestionId[] = [...DEMO_QUESTION_IDS];

/**
 * Client-only assignment. Returns null until after mount so SSR HTML cannot
 * disagree with a session permutation.
 */
export function useDemoQuestion(surface: DemoSurface): DemoQuestion | null {
  const [question, setQuestion] = useState<DemoQuestion | null>(null);
  useEffect(() => {
    setQuestion(assignedQuestion(surface, resolveQuestionOrder()));
  }, [surface]);
  return question;
}
