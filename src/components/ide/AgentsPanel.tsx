import { motion, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AgentActionLog } from "@/components/ide/AgentActionLog";
import { NEIGHBORS, NODE_BY_ID } from "@/lib/demo-graph";
import {
  AGENT_MODES,
  fallbackActions,
  replyFor,
  type AgentMode,
  type ChatMessage,
} from "@/lib/agent-demo";
import { IDLE_RUN, scheduleActions, scheduleStream, type AgentRunSnapshot } from "@/lib/agent-run";
import {
  questionForPrompt,
  useDemoQuestion,
  type DemoAgentAction,
  type DemoSurface,
} from "@/lib/demo-questions";

let uid = 0;
const nextId = () => `m${++uid}`;

export function AgentsPanel({
  contextIds,
  selected,
  active = false,
  compact = false,
  chat = false,
  surface = "product",
}: {
  contextIds: string[] | null;
  selected: string | null;
  active?: boolean;
  compact?: boolean;
  /** enable the functional deterministic chat demo */
  chat?: boolean;
  /** which of the three canonical surfaces this panel belongs to */
  surface?: DemoSurface;
}) {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<AgentMode>("Ask");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [run, setRun] = useState<AgentRunSnapshot>(IDLE_RUN);
  const [runActions, setRunActions] = useState<readonly DemoAgentAction[]>([]);
  const [logExpanded, setLogExpanded] = useState(false);
  const [streaming, setStreaming] = useState(false);

  // Fall back to the selected node's direct edges so the header never claims
  // "+0 connected files" for a node that clearly has relationships.
  const ids = contextIds ?? (selected ? (NEIGHBORS[selected] ?? []) : []);
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
    setStreaming(false);
  };
  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.current = timers.current.filter((queued) => queued !== id);
      fn();
    }, ms);
    timers.current.push(id);
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
  }, [messages, run, streaming]);

  function newAgent() {
    cancel();
    setMessages([]);
    setRun(IDLE_RUN);
    setRunActions([]);
    setLogExpanded(false);
  }

  function send(text: string) {
    const value = text.trim();
    if (!value || streaming) return;
    cancel();
    const runToken = runId.current;
    pinned.current = true;
    setLogExpanded(false);

    setMessages((m) => [...m, { id: nextId(), role: "user", text: value }]);

    const matched = questionForPrompt(value);
    const actions = matched?.actions ?? fallbackActions(selected);
    const answer = matched?.response ?? replyFor(mode, selected, value);
    setRunActions(actions);
    setRun({
      phase: "acting",
      activeIndex: actions.length ? 0 : -1,
      completedCount: 0,
      collapsed: false,
      streamedChars: 0,
    });

    const laterIfLive = (fn: () => void, ms: number) => {
      later(() => {
        if (runToken !== runId.current) return;
        fn();
      }, ms);
    };

    if (reduce) {
      laterIfLive(() => {
        setRun({
          phase: "collapsed",
          activeIndex: -1,
          completedCount: actions.length,
          collapsed: true,
          streamedChars: answer.length,
        });
        setMessages((m) => [...m, { id: nextId(), role: "agent", text: answer }]);
      }, 180);
      return;
    }

    scheduleActions(
      actions,
      laterIfLive,
      (snap) => setRun(snap),
      () => {
        if (runToken !== runId.current) return;
        setStreaming(true);
        const id = nextId();
        setMessages((m) => [...m, { id, role: "agent", text: "" }]);
        scheduleStream(answer, {
          later: laterIfLive,
          onSlice: (slice) => {
            setRun((s) => ({ ...s, phase: "streaming", streamedChars: slice.length }));
            setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, text: slice } : msg)));
          },
          onDone: () => {
            setStreaming(false);
            setRun((s) => ({ ...s, phase: "complete", streamedChars: answer.length }));
          },
        });
      },
    );
  }

  const assigned = useDemoQuestion(surface);
  const question = assigned?.prompt ?? "";

  return (
    <div className="flex h-full min-h-0 flex-col text-[12.5px]">
      <div className="flex shrink-0 items-center justify-between gap-2 pb-3">
        <p className="text-[10px] tracking-[0.16em] text-muted-foreground">AGENTS</p>
        {chat && (
          <button
            type="button"
            aria-label="New Agent"
            onClick={newAgent}
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>
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
          <StaticPreview
            mode={mode}
            count={related.length}
            compact={compact}
            related={related}
            prompt={question}
          />
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
              {run.phase !== "idle" && (
                <AgentActionLog
                  actions={runActions}
                  snapshot={run}
                  expandable
                  expanded={logExpanded}
                  onToggle={() => setLogExpanded((v) => !v)}
                />
              )}
            </div>

            <div className="flex shrink-0 flex-col gap-1.5">
              <span className="text-[10px] tracking-[0.14em] text-muted-foreground/70">
                SUGGESTED
              </span>
              {question ? (
                <button
                  type="button"
                  disabled={streaming || run.phase === "acting"}
                  onClick={() => send(question)}
                  className="cursor-pointer rounded-md border border-border bg-surface-2/70 px-2.5 py-2 text-left text-[12.5px] leading-[1.45] text-foreground/90 transition-all duration-200 hover:translate-x-0.5 hover:border-border-strong hover:bg-surface-2 hover:text-foreground disabled:opacity-40"
                >
                  {question}
                </button>
              ) : (
                <div className="h-[42px] rounded-md border border-border bg-surface-2/40" />
              )}
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
  prompt,
}: {
  mode: AgentMode;
  count: number;
  compact: boolean;
  related: string[];
  prompt: string;
}) {
  const shown = prompt || (mode === "Ask" ? "Ask about this file" : "Prepare a change");
  const answer =
    mode === "Ask"
      ? `${count} connected modules`
      : mode === "Edit"
        ? `${count} files staged for edit`
        : `Plan across ${count} modules`;
  return (
    <div className="space-y-2">
      <div className="rounded-md border border-border bg-surface-2 px-2 py-1.5 text-foreground/85">
        {shown}
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
