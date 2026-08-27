import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NEIGHBORS, NODE_BY_ID } from "@/lib/demo-graph";
import {
  AGENT_MODES,
  STREAM_CHARS_PER_TICK,
  STREAM_INTERVAL_MS,
  activityFor,
  exploreSuggestionsFor,
  replyFor,
  suggestionsFor,
  type AgentMode,
  type ChatMessage,
} from "@/lib/agent-demo";

let uid = 0;
const nextId = () => `m${++uid}`;

export function AgentsPanel({
  contextIds,
  selected,
  active = false,
  compact = false,
  chat = false,
  variant = "guided",
}: {
  contextIds: string[] | null;
  selected: string | null;
  active?: boolean;
  compact?: boolean;
  /** enable the functional deterministic chat demo */
  chat?: boolean;
  /** which suggestion set to show in chat mode */
  variant?: "guided" | "explore";
}) {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<AgentMode>("Ask");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activity, setActivity] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);

  // Fall back to the selected node's direct edges so the header never claims
  // "+0 connected files" for a node that clearly has relationships.
  const ids = contextIds ?? (selected ? NEIGHBORS[selected] ?? [] : []);
  const related = ids.filter((id) => id !== selected);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  // --- cancellation -------------------------------------------------------
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const runId = useRef(0);
  const cancel = () => {
    runId.current += 1;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setActivity(null);
    setStreaming(false);
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  // Cancel in-flight streaming when the context or mode changes, or on unmount.
  useEffect(() => cancel, []);
  useEffect(() => {
    cancel();
  }, [selected, mode]);

  // Only follow new content when the reader has not scrolled up. Never touches
  // the document scroll position — this container scrolls itself.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [messages, activity]);

  function send(text: string) {
    const value = text.trim();
    if (!value || streaming) return;
    cancel();
    const run = runId.current;
    pinned.current = true;

    setMessages((m) => [...m, { id: nextId(), role: "user", text: value }]);

    const steps = activityFor(mode, selected);
    const answer = replyFor(mode, selected, value);

    if (reduce) {
      setActivity(steps[0] ?? null);
      later(() => {
        if (run !== runId.current) return;
        setActivity(null);
        setMessages((m) => [...m, { id: nextId(), role: "agent", text: answer }]);
      }, 220);
      return;
    }

    steps.forEach((s, i) => {
      later(() => {
        if (run !== runId.current) return;
        setActivity(s);
      }, i * 260);
    });

    later(
      () => {
        if (run !== runId.current) return;
        setActivity(null);
        setStreaming(true);
        const id = nextId();
        setMessages((m) => [...m, { id, role: "agent", text: "" }]);
        let i = 0;
        const tick = () => {
          if (run !== runId.current) return;
          i = Math.min(answer.length, i + STREAM_CHARS_PER_TICK);
          const slice = answer.slice(0, i);
          setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, text: slice } : msg)));
          if (i < answer.length) later(tick, STREAM_INTERVAL_MS);
          else setStreaming(false);
        };
        tick();
      },
      steps.length * 260 + 120,
    );
  }

  const allSuggestions = suggestionsFor(selected, mode);
  const [questionIndex] = useState(() =>
    Math.max(0, Math.floor(Math.random() * allSuggestions.length)),
  );
  const question = allSuggestions[questionIndex] ?? allSuggestions[0] ?? "Ask about this file";

  return (
    <div className="flex h-full min-h-0 flex-col text-[12.5px]">
      <p className="shrink-0 pb-3 text-[10px] tracking-[0.16em] text-muted-foreground">AGENTS</p>
      <div className="flex shrink-0 gap-1.5 text-[11px]" role="group" aria-label="Agent mode">
        {AGENT_MODES.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={
              "cursor-pointer rounded-md border px-2.5 py-1.5 transition-colors duration-150 " +
              (mode === m
                ? "border-teal/30 bg-teal/10 text-teal"
                : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground")
            }
          >
            {m}
          </button>
        ))}
      </div>

      <motion.div
        animate={{ opacity: active || chat ? 1 : 0.45 }}
        transition={{ duration: 0.4 }}
        className="mt-3.5 flex min-h-0 flex-1 flex-col gap-2.5"
      >
        <div className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-teal">
          <span className="inline-block size-1.5 rounded-full bg-teal" />
          {ids.length || selected ? "Context ready" : "No context"}
        </div>
        {selected && (
          <p className="shrink-0 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {NODE_BY_ID[selected]?.label} · +{related.length} connected files
          </p>
        )}

        {!chat ? (
          <StaticPreview mode={mode} count={related.length} compact={compact} related={related} />
        ) : (
          <>
            <div
              ref={scrollRef}
              onScroll={(e) => {
                const el = e.currentTarget;
                pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
              }}
              className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain pr-0.5"
            >
              {messages.length === 0 && (
                <p className="text-[12.5px] leading-[1.55] text-muted-foreground">
                  {selected
                    ? "This file and its relationships are loaded as context. Ask something."
                    : "Select a file in the graph to load it as context."}
                </p>
              )}
              {messages.map((m) =>
                m.role === "user" ? (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="ml-4 rounded-md border border-border bg-surface-2 px-2.5 py-2 leading-[1.45] text-foreground/90"
                  >
                    {m.text}
                  </motion.div>
                ) : (
                  <div
                    key={m.id}
                    className="whitespace-pre-line rounded-md border border-teal/25 bg-teal/[0.07] px-2.5 py-2 leading-[1.5] text-teal"
                  >
                    {m.text}
                    {streaming && m.text.length > 0 && (
                      <span className="pb-caret ml-px inline-block h-[1em] w-[2px] translate-y-[2px] bg-teal" />
                    )}
                  </div>
                ),
              )}
              <AnimatePresence>
                {activity && (
                  <motion.p
                    key={activity}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-mono text-[10.5px] text-muted-foreground"
                  >
                    {activity}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex shrink-0 flex-col gap-1.5">
              <span className="text-[10px] tracking-[0.14em] text-muted-foreground/70">
                SUGGESTED
              </span>
              <button
                type="button"
                disabled={streaming}
                onClick={() => send(question)}
                className="cursor-pointer rounded-md border border-border bg-surface-2/70 px-2.5 py-2 text-left text-[12.5px] leading-[1.45] text-foreground/90 transition-all duration-200 hover:translate-x-0.5 hover:border-border-strong hover:bg-surface-2 hover:text-foreground disabled:opacity-40"
              >
                {question}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function StaticPreview({
  mode,
  count,
  compact,
  related,
}: {
  mode: AgentMode;
  count: number;
  compact: boolean;
  related: string[];
}) {
  const prompt =
    mode === "Ask"
      ? "What depends on this service?"
      : mode === "Edit"
        ? "Update this service and its direct dependents."
        : "Trace the affected modules, make the change, and verify it.";
  const answer =
    mode === "Ask"
      ? `${count} connected modules`
      : mode === "Edit"
        ? `${count} files staged for edit`
        : `Plan across ${count} modules`;
  return (
    <div className="space-y-2">
      <div className="rounded-md border border-border bg-surface-2 px-2 py-1.5 text-foreground/85">
        {prompt}
      </div>
      <div className="rounded-md border border-teal/25 bg-teal/[0.07] px-2 py-1.5 font-mono text-teal">
        {answer}
      </div>
      {!compact && (
        <ul className="space-y-1 pl-1 font-mono text-[10px] text-muted-foreground">
          {related.slice(0, 5).map((id) => (
            <li key={id}>{NODE_BY_ID[id]?.label}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
