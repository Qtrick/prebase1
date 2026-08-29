import { Pause, Play } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { DemoGraph } from "@/components/graph/DemoGraph";
import { COMMITS, EXPLORER, contextFor } from "@/lib/demo-graph";
import { useDemoQuestion } from "@/lib/demo-questions";
import {
  HERO_TARGETS,
  HeroTourClock,
  INITIAL_TOUR_STATE,
  TEMPORAL_TO_COMMIT,
  measureTarget,
  reducedMotionState,
  shouldPlay,
  type ActivityId,
  type PauseReasons,
  type TourVisualState,
} from "@/lib/hero-tour";

const DEMO_LABEL =
  "PreBase demonstration showing a file selected in Explorer, its relationships in the Network Graph, changes through Temporal Graph history, and graph context sent to an agent.";

export function HeroDemo() {
  const reduce = useReducedMotion();
  const question = useDemoQuestion("home");
  const rootRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef<HTMLSpanElement>(null);
  const visualRef = useRef<TourVisualState>(INITIAL_TOUR_STATE);
  const clockRef = useRef<HeroTourClock | null>(null);
  const reasonsRef = useRef<PauseReasons>({
    manual: false,
    offscreen: false,
    hidden: false,
    reducedMotion: Boolean(reduce),
  });
  const playingRef = useRef(false);
  const startedRef = useRef(false);
  const rafRef = useRef(0);

  const [visual, setVisual] = useState<TourVisualState>(INITIAL_TOUR_STATE);
  const [manualPaused, setManualPaused] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    reasonsRef.current.reducedMotion = Boolean(reduce);
  }, [reduce]);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const update = () => setCompact(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const onVis = () => {
      reasonsRef.current.hidden = document.hidden;
    };
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        reasonsRef.current.offscreen = !entry || entry.intersectionRatio < 0.28;
      },
      { threshold: [0, 0.28, 0.5, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => clockRef.current?.remeasure());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (reduce) {
      const promptLen = question?.prompt.length ?? 0;
      const next = reducedMotionState(promptLen);
      visualRef.current = next;
      setVisual(next);
      if (typedRef.current && question) typedRef.current.textContent = question.prompt;
      return;
    }
    if (!question) return;
    const root = rootRef.current;
    const cursor = cursorRef.current;
    if (!root || !cursor) return;

    const writeCursor = (x: number, y: number, clicking: boolean, opacity: number) => {
      cursor.style.opacity = String(opacity);
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-1px, -1px) scale(${clicking ? 0.86 : 1})`;
      const ring = cursor.querySelector<HTMLElement>("[data-demo-click-ring]");
      if (ring) ring.style.opacity = clicking ? "0.65" : "0";
    };

    const clock = new HeroTourClock({
      compact: () => compact,
      promptLength: () => question.prompt.length,
      measure: (target) => {
        if (!target) return { x: 28, y: 36 };
        return measureTarget(root, target) ?? { x: 28, y: 36 };
      },
      onCursor: writeCursor,
      onVisual: (next) => {
        const prev = visualRef.current;
        const typingOnly =
          next.typedChars !== prev.typedChars &&
          next.selectedFile === prev.selectedFile &&
          next.selectedNode === prev.selectedNode &&
          next.mode === prev.mode &&
          next.commit === prev.commit &&
          next.sent === prev.sent &&
          next.showResponse === prev.showResponse;
        visualRef.current = next;
        if (typedRef.current) {
          typedRef.current.textContent = question.prompt.slice(0, next.typedChars);
        }
        if (!typingOnly) setVisual(next);
      },
    });
    clockRef.current = clock;

    const loop = (now: number) => {
      const play = shouldPlay(reasonsRef.current);
      if (play) {
        if (!startedRef.current) {
          clock.start(now);
          clock.remeasure();
          startedRef.current = true;
          playingRef.current = true;
        } else if (clock.paused) {
          clock.resume(now);
          clock.remeasure();
          playingRef.current = true;
        }
        clock.tick(now);
      } else if (playingRef.current) {
        clock.pause(now);
        playingRef.current = false;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clockRef.current = null;
      playingRef.current = false;
      startedRef.current = false;
    };
  }, [question, reduce, compact]);

  function togglePause() {
    const next = !manualPaused;
    setManualPaused(next);
    reasonsRef.current.manual = next;
  }

  const prompt = question?.prompt ?? "";
  const response = question?.response ?? "";
  const contextIds = visual.selectedFile ? contextFor(visual.selectedFile) : null;

  return (
    <div className="relative">
      <div
        ref={rootRef}
        className="relative flex h-[min(58svh,420px)] flex-col overflow-hidden rounded-xl border border-border bg-surface-1 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] sm:h-[min(62svh,480px)] lg:h-[min(64vh,540px)]"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface-2/70 px-2 py-1.5">
          {!reduce && (
            <button
              type="button"
              onClick={togglePause}
              aria-pressed={manualPaused}
              aria-label={manualPaused ? "Play PreBase demonstration" : "Pause PreBase demonstration"}
              className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-surface-2 text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {manualPaused ? (
                <Play className="size-3.5" fill="currentColor" aria-hidden="true" />
              ) : (
                <Pause className="size-3.5" aria-hidden="true" />
              )}
            </button>
          )}
          <span aria-hidden="true" className="px-1 font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
            prebase
          </span>
          <span aria-hidden="true" className="ml-auto">
            <ModePills mode={visual.mode} />
          </span>
        </div>

        <div
          role="img"
          aria-label={DEMO_LABEL}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div aria-hidden="true" className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <div className="flex min-h-0 min-w-0 flex-1">
                <ActivityBar active={visual.activity} />
                <Explorer selected={visual.selectedFile} />
                <div className="relative flex min-w-0 flex-1 flex-col">
                  <div className="flex shrink-0 items-center gap-1 border-b border-border bg-surface-2/40 px-2 py-1 text-[10px]">
                    <span className="rounded-sm border border-border bg-surface-1 px-2 py-0.5 text-foreground">
                      {visual.mode === "temporal" ? "Temporal Graph" : "Code Graph"}
                    </span>
                  </div>
                  <div className="relative min-h-0 flex-1">
                    <DemoGraph
                      className="absolute inset-0 size-full"
                      mode={visual.mode}
                      layout="organic"
                      commit={visual.commit}
                      selected={visual.selectedNode}
                      agentContext={visual.showResponse ? contextIds : null}
                      interactionMode="none"
                      labelAll={false}
                    />
                  </div>
                  <TemporalStrip visible={visual.mode === "temporal"} commit={visual.commit} />
                </div>
              </div>
              <AgentPane
                visual={visual}
                prompt={prompt}
                response={response}
                typedRef={typedRef}
              />
            </div>
          </div>
        </div>

        {!reduce && (
          <div
            ref={cursorRef}
            className="pointer-events-none absolute left-0 top-0 z-30 origin-top-left will-change-transform"
            style={{ opacity: 0 }}
          >
            <CursorGlyph />
            <span
              data-demo-click-ring
              className="pointer-events-none absolute -left-[5px] -top-[5px] size-[12px] rounded-full border border-foreground/50 opacity-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ModePills({ mode }: { mode: TourVisualState["mode"] }) {
  return (
    <div className="inline-flex rounded-md border border-border bg-surface-2 p-0.5 text-[10px]">
      {(["network", "temporal"] as const).map((m) => {
        const active = mode === m;
        return (
          <span
            key={m}
            data-demo-target={m === "temporal" ? HERO_TARGETS.temporalToggle : undefined}
            className={
              "relative rounded-[5px] px-2 py-0.5 " + (active ? "text-teal" : "text-muted-foreground/60")
            }
          >
            {active && (
              <span className="absolute inset-0 rounded-[5px] border border-teal/30 bg-teal/10" />
            )}
            <span className="relative">{m === "network" ? "Network" : "Temporal"}</span>
          </span>
        );
      })}
    </div>
  );
}

function ActivityBar({ active }: { active: ActivityId }) {
  const items: Array<{ id: ActivityId; label: string; badge?: string; icon: ReactNode }> = [
    { id: "explorer", label: "Explorer", icon: <FilesIcon /> },
    { id: "search", label: "Search", icon: <SearchIcon /> },
    { id: "scm", label: "Source Control", badge: "3", icon: <ScmIcon /> },
    { id: "graph", label: "Code Graph", icon: <GraphIcon /> },
    { id: "agent", label: "Agent", icon: <AgentIcon /> },
  ];
  return (
    <div className="flex w-9 shrink-0 flex-col items-center border-r border-border bg-surface-2/80 py-1.5 sm:w-10">
      <div className="flex flex-1 flex-col items-center gap-0.5">
        {items.map((item) => {
          const on = item.id === active;
          return (
            <span
              key={item.id}
              data-demo-target={item.id === "graph" ? "graph-activity" : undefined}
              className="relative flex size-8 items-center justify-center"
            >
              {on && <span className="absolute left-0 top-1.5 h-[18px] w-0.5 rounded-full bg-teal" />}
              <span className={on ? "text-teal" : "text-muted-foreground/70"}>{item.icon}</span>
              {item.badge && (
                <span className="absolute right-0.5 top-0.5 min-w-[12px] rounded-full bg-teal px-0.5 text-center font-mono text-[8px] leading-3 text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </span>
          );
        })}
      </div>
      <div className="hidden flex-col items-center gap-0.5 sm:flex">
        <span className="flex size-8 items-center justify-center text-muted-foreground/70">
          <AccountIcon />
        </span>
        <span className="flex size-8 items-center justify-center text-muted-foreground/70">
          <GearIcon />
        </span>
      </div>
    </div>
  );
}

function Explorer({ selected }: { selected: string | null }) {
  return (
    <aside className="w-[118px] shrink-0 overflow-hidden border-r border-border bg-surface-1/80 py-2 sm:w-[140px] md:w-[156px]">
      <p className="px-2.5 pb-1.5 text-[9px] tracking-[0.14em] text-muted-foreground">EXPLORER</p>
      <ul className="space-y-px font-mono text-[10px] md:text-[11px]">
        {EXPLORER.map((f) => {
          const isSelected = f.id && selected === f.id;
          return (
            <li key={f.name + f.depth}>
              <span
                data-demo-target={f.id === "graph" ? HERO_TARGETS.fileGraphService : undefined}
                style={{ paddingLeft: 8 + f.depth * 10 }}
                className={
                  "block truncate py-[2px] pr-2 " +
                  (f.dir
                    ? "text-foreground/70"
                    : isSelected
                      ? "bg-teal/10 text-teal"
                      : "text-muted-foreground")
                }
              >
                {f.dir ? `▸ ${f.name}` : f.name}
              </span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function TemporalStrip({ visible, commit }: { visible: boolean; commit: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden border-t border-border bg-surface-1/90 transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0, height: visible ? undefined : 0 }}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-1.5">
        {COMMITS.map((c, i) => {
          const on = i === commit;
          return (
            <span
              key={c.id}
              data-demo-target={i === TEMPORAL_TO_COMMIT ? HERO_TARGETS.temporalCommit : undefined}
              className="flex flex-col items-center gap-1"
            >
              <span
                className={
                  "size-2 rounded-full border " +
                  (on ? "border-teal bg-teal" : "border-border-strong bg-surface-2")
                }
              />
              <span className={"font-mono text-[9px] " + (on ? "text-teal" : "text-muted-foreground")}>
                {c.label}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function AgentPane({
  visual,
  prompt,
  response,
  typedRef,
}: {
  visual: TourVisualState;
  prompt: string;
  response: string;
  typedRef: RefObject<HTMLSpanElement | null>;
}) {
  return (
    <aside className="flex h-[124px] shrink-0 flex-col overflow-hidden border-t border-border bg-surface-1/95 p-2.5 lg:h-auto lg:w-[176px] lg:border-l lg:border-t-0 xl:w-[196px]">
      <p className="pb-2 text-[9px] tracking-[0.16em] text-muted-foreground">AGENTS</p>
      <div className="flex items-center gap-1.5 font-mono text-[10px] text-teal">
        <span className="inline-block size-1.5 rounded-full bg-teal" />
        {visual.selectedFile ? "Context ready" : "No context"}
      </div>
      {visual.selectedFile && (
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">graphService.ts · +7 files</p>
      )}
      <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-hidden">
        {visual.sent && (
          <div className="rounded-md border border-border bg-surface-2 px-2 py-1.5 text-[11px] leading-[1.45] text-foreground/90">
            {prompt}
          </div>
        )}
        {visual.showResponse && (
          <div className="rounded-md border border-teal/25 bg-teal/[0.07] px-2 py-1.5 text-[11px] leading-[1.45] text-teal">
            {response}
          </div>
        )}
      </div>
      <div
        data-demo-target={HERO_TARGETS.agentInput}
        className={
          "mt-2 min-h-[44px] rounded-md border px-2 py-1.5 text-[11px] leading-[1.45] " +
          (visual.agentFocused
            ? "border-teal/40 bg-surface-2"
            : "border-border bg-surface-2/70 text-muted-foreground")
        }
      >
        <span ref={typedRef} className="text-foreground">
          {visual.typedChars ? prompt.slice(0, visual.typedChars) : ""}
        </span>
        {visual.agentFocused && <span className="pb-caret ml-px inline-block h-[1em] w-[1.5px] translate-y-[2px] bg-foreground" />}
        {!visual.typedChars && !visual.agentFocused && (
          <span className="text-muted-foreground/70">Ask about this codebase…</span>
        )}
      </div>
      <span
        data-demo-target={HERO_TARGETS.agentSend}
        className="mt-1.5 inline-flex items-center justify-center rounded-md border border-teal/35 bg-teal/10 px-2 py-1 font-mono text-[10px] text-teal"
      >
        Send
      </span>
    </aside>
  );
}

function CursorGlyph() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden="true">
      <path
        d="M1.2 1.2 L1.4 16.2 L5.4 12.4 L8.6 19.1 L11.4 17.7 L8.1 11.1 L14.6 10.7 Z"
        fill="var(--foreground)"
        stroke="var(--background)"
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 4.5h7l2 2H20v13H4z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15.5 15.5 L20 20" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function ScmIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="7" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="18" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 8.2 V15.8 M9 12 H14.8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function GraphIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6.5" cy="17" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="17" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.4 8.6 L7.8 15.1 M13.6 8.6 L16.2 15.1 M8.7 17 H15.3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function AgentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 8.5h14v9.5H12l-3 3v-3H5z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="13" r="0.9" fill="currentColor" />
      <circle cx="15" cy="13" r="0.9" fill="currentColor" />
    </svg>
  );
}
function AccountIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 19c1.4-3 4-4.5 6.5-4.5s5.1 1.5 6.5 4.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 3.5 V6.2 M12 17.8 V20.5 M4.8 7.2 L7.1 8.6 M16.9 15.4 L19.2 16.8 M19.2 7.2 L16.9 8.6 M7.1 15.4 L4.8 16.8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
