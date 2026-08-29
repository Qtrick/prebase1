import { describe, expect, it } from "vitest";
import { replyFor } from "./agent-demo";
import { DEMO_QUESTIONS, responseForPrompt } from "./demo-questions";
import * as agentDemo from "./agent-demo";

describe("canonical answers vs graph replies", () => {
  it("maps each canonical prompt to its dedicated response", () => {
    for (const q of DEMO_QUESTIONS) {
      expect(responseForPrompt(q.prompt)).toBe(q.response);
    }
  });

  it("does not keep a parallel suggested-question bank or CoT activity helper", () => {
    expect("suggestionsFor" in agentDemo).toBe(false);
    expect("exploreSuggestionsFor" in agentDemo).toBe(false);
    expect("activityFor" in agentDemo).toBe(false);
  });

  it("still answers freeform graph questions from the selected node", () => {
    const answer = replyFor("Ask", "graph", "What depends on graphService.ts?");
    expect(answer).toContain("graphService.ts");
    expect(answer).toMatch(/parser|indexer|api/i);
  });
});
