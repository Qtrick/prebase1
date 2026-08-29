import { afterEach, describe, expect, it } from "vitest";
import {
  DEMO_QUESTION_IDS,
  DEMO_QUESTIONS,
  DEMO_SURFACES,
  QUESTION_ORDER_KEY,
  SSR_QUESTION_ORDER,
  assignedQuestion,
  assignmentFromOrder,
  parseStoredOrder,
  questionById,
  questionForPrompt,
  resetQuestionOrderCache,
  resolveQuestionOrder,
  responseForPrompt,
  shuffle,
  type DemoQuestionId,
  type StorageLike,
} from "./demo-questions";

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem(key) {
      return data[key] ?? null;
    },
    setItem(key, value) {
      data[key] = value;
    },
  };
}

describe("canonical demo questions", () => {
  it("contains exactly three questions", () => {
    expect(DEMO_QUESTIONS).toHaveLength(3);
    expect(DEMO_QUESTION_IDS).toHaveLength(3);
  });

  it("has unique ids and prompts", () => {
    expect(new Set(DEMO_QUESTIONS.map((q) => q.id)).size).toBe(3);
    expect(new Set(DEMO_QUESTIONS.map((q) => q.prompt)).size).toBe(3);
  });

  it("maps every question to exactly one dedicated response", () => {
    for (const q of DEMO_QUESTIONS) {
      expect(questionById(q.id).response).toBe(q.response);
      expect(responseForPrompt(q.prompt)).toBe(q.response);
      expect(questionForPrompt(q.prompt)?.actions).toBe(q.actions);
    }
    expect(responseForPrompt("not a canonical question")).toBeNull();
    expect(questionForPrompt("not a canonical question")).toBeNull();
  });

  it("gives each question its own 2–4 observable actions", () => {
    const labels = DEMO_QUESTIONS.map((q) => q.actions.map((a) => a.label).join("|"));
    expect(new Set(labels).size).toBe(3);
    for (const q of DEMO_QUESTIONS) {
      expect(q.actions.length).toBeGreaterThanOrEqual(2);
      expect(q.actions.length).toBeLessThanOrEqual(4);
      expect(new Set(q.actions.map((a) => a.id)).size).toBe(q.actions.length);
      for (const action of q.actions) {
        expect(action.label).toMatch(/^(Searching|Reading|Inspecting|Checking|Running|Reviewing)\b/);
        expect(action.label).not.toMatch(/thinking|reasoning|considering|deciding|i think/i);
      }
    }
  });

  it("keeps question, actions, and response tied together across surfaces", () => {
    const order: DemoQuestionId[] = ["temporal-graph", "agent-context", "code-graph"];
    const home = assignedQuestion("home", order);
    const product = assignedQuestion("product", order);
    const explore = assignedQuestion("explore", order);
    expect(home.actions).toBe(questionById("temporal-graph").actions);
    expect(home.response).toBe(questionById("temporal-graph").response);
    expect(product.actions).toBe(questionById("agent-context").actions);
    expect(explore.actions).toBe(questionById("code-graph").actions);
    expect(home.actions[0]?.id).not.toBe(product.actions[0]?.id);
  });
});

describe("question assignment", () => {
  afterEach(() => {
    resetQuestionOrderCache();
  });

  it("assigns each surface exactly one unique question covering the canonical set", () => {
    const order: DemoQuestionId[] = ["temporal-graph", "agent-context", "code-graph"];
    const assignment = assignmentFromOrder(order);
    expect(DEMO_SURFACES).toHaveLength(3);
    expect(Object.keys(assignment)).toEqual(["home", "product", "explore"]);
    expect(assignment.home).toBe("temporal-graph");
    expect(assignment.product).toBe("agent-context");
    expect(assignment.explore).toBe("code-graph");
    expect(new Set(Object.values(assignment)).size).toBe(3);
    expect(new Set(Object.values(assignment))).toEqual(new Set(DEMO_QUESTION_IDS));
    expect(assignedQuestion("home", order).id).toBe("temporal-graph");
    expect(assignedQuestion("product", order).id).toBe("agent-context");
    expect(assignedQuestion("explore", order).id).toBe("code-graph");
  });

  it("reuses a valid stored permutation instead of reshuffling", () => {
    const stored: DemoQuestionId[] = ["agent-context", "code-graph", "temporal-graph"];
    const storage = memoryStorage({ [QUESTION_ORDER_KEY]: JSON.stringify(stored) });
    const first = resolveQuestionOrder(storage, () => 0.9);
    const second = resolveQuestionOrder(storage, () => 0.1);
    expect(first).toEqual(stored);
    expect(second).toEqual(stored);
  });

  it("does not reshuffle on repeated resolve calls (in-memory cache)", () => {
    const storage = memoryStorage();
    const first = resolveQuestionOrder(storage, () => 0.3);
    const second = resolveQuestionOrder(storage, () => 0.9);
    expect(second).toEqual(first);
    expect(JSON.parse(storage.getItem(QUESTION_ORDER_KEY)!)).toEqual(first);
  });

  it("regenerates invalid cached assignments", () => {
    const storage = memoryStorage({ [QUESTION_ORDER_KEY]: JSON.stringify(["code-graph", "code-graph"]) });
    const sequence = [0.9, 0.1, 0.2, 0.4, 0.8, 0.3];
    let i = 0;
    const order = resolveQuestionOrder(storage, () => sequence[i++] ?? 0.5);
    expect(order).toHaveLength(3);
    expect(new Set(order).size).toBe(3);
    expect(new Set(order)).toEqual(new Set(DEMO_QUESTION_IDS));
    expect(parseStoredOrder(storage.getItem(QUESTION_ORDER_KEY))).toEqual(order);
  });

  it("treats duplicate, unknown, and malformed cache values as invalid", () => {
    expect(parseStoredOrder(null)).toBeNull();
    expect(parseStoredOrder("not-json")).toBeNull();
    expect(parseStoredOrder(JSON.stringify(["code-graph"]))).toBeNull();
    expect(parseStoredOrder(JSON.stringify(["code-graph", "code-graph", "code-graph"]))).toBeNull();
    expect(parseStoredOrder(JSON.stringify(["code-graph", "temporal-graph", "nope"]))).toBeNull();
  });

  it("shuffles with an injected random function", () => {
    const a = shuffle(DEMO_QUESTION_IDS, () => 0);
    const b = shuffle(DEMO_QUESTION_IDS, () => 0.99);
    expect(a).toHaveLength(3);
    expect(new Set(a)).toEqual(new Set(DEMO_QUESTION_IDS));
    expect(b).toHaveLength(3);
    expect(a.join()).not.toBe(SSR_QUESTION_ORDER.join());
  });
});
