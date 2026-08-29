import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { COMMITS, diffCounts, timelineProgressRatio } from "@/lib/demo-graph";

export function TemporalToolbar({
  commit,
  focusChanges,
  onFocusChanges,
  visible = true,
}: {
  commit: number;
  focusChanges: boolean;
  onFocusChanges?: ((v: boolean) => void) | undefined;
  visible?: boolean;
}) {
  const counts = diffCounts(commit);
  const interactive = Boolean(onFocusChanges);
  return (
    <motion.div
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      style={{ display: visible ? "block" : "none" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="shrink-0 overflow-hidden border-b border-border bg-surface-2/40"
    >
      <div className="flex flex-wrap items-center gap-2 px-2 py-1.5 text-[10px]">
        <div className="inline-flex rounded border border-border bg-surface-2 p-0.5">
          {[
            { id: "full", label: "Full Map" },
            { id: "changes", label: "Focus Changes" },
          ].map((o) => {
            const on = (o.id === "changes") === focusChanges;
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={on}
                tabIndex={interactive ? 0 : -1}
                onClick={() => onFocusChanges?.(o.id === "changes")}
                className={
                  "rounded-[4px] px-2 py-1 transition-colors duration-150 " +
                  (interactive ? "cursor-pointer " : "cursor-default ") +
                  (on ? "bg-teal/10 text-teal" : "text-muted-foreground hover:text-foreground")
                }
              >
                {o.label}
              </button>
            );
          })}
        </div>
        <span className="font-mono text-muted-foreground">
          {COMMITS[commit]?.label} vs {commit > 0 ? COMMITS[commit - 1]?.label : "root"}
        </span>
        <span className="ml-auto flex gap-1 font-mono">
          <Badge tone="added">+{counts.added}</Badge>
          <Badge tone="removed">-{counts.removed}</Badge>
          <Badge tone="modified">~{counts.modified}</Badge>
          <Badge tone="renamed">⇄{counts.renamed}</Badge>
        </span>
      </div>
    </motion.div>
  );
}

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  const color =
    tone === "added"
      ? "text-success border-success/30"
      : tone === "removed"
        ? "text-danger border-danger/30"
        : tone === "modified"
          ? "text-warning border-warning/30"
          : "text-info border-info/30";
  return <span className={"rounded border px-1.5 py-0.5 " + color}>{children}</span>;
}

/** Compact inline explanation of the temporal node states. */
export function TemporalLegend({ visible = true }: { visible?: boolean }) {
  const items: Array<{ label: string; color: string }> = [
    { label: "Added", color: "var(--success)" },
    { label: "Modified", color: "var(--warning)" },
    { label: "Removed", color: "var(--danger)" },
    { label: "Renamed", color: "var(--info)" },
    { label: "Unchanged", color: "var(--node-3)" },
  ];
  return (
    <motion.div
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      style={{ display: visible ? undefined : "none" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="hidden shrink-0 border-t border-border bg-surface-1/60 px-3 py-1.5 sm:block"
    >
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
        {items.map((i) => (
          <li key={i.label} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block size-1.5 rounded-full"
              style={{ background: i.color }}
            />
            {i.label}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export function TemporalTimeline({
  commit,
  onCommit,
  playing = false,
  onTogglePlay,
  visible = true,
  compact = false,
  markerTarget,
}: {
  commit: number;
  onCommit?: ((i: number) => void) | undefined;
  playing?: boolean;
  onTogglePlay?: (() => void) | undefined;
  visible?: boolean;
  compact?: boolean;
  markerTarget?: (index: number) => string | undefined;
}) {
  const interactive = Boolean(onCommit);
  const scrubId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  // Track geometry: the line should run from the first dot's center to the
  // last dot's center, not the full row width (buttons are wider than dots).
  const [edges, setEdges] = useState({ left: 4, right: 4, span: 0 });
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const dots = el.querySelectorAll<HTMLElement>("[data-dot]");
      if (dots.length < 2) return;
      const box = el.getBoundingClientRect();
      const first = dots[0]!.getBoundingClientRect();
      const last = dots[dots.length - 1]!.getBoundingClientRect();
      const left = first.left - box.left + first.width / 2;
      const right = box.right - last.right + last.width / 2;
      setEdges({ left, right, span: box.width - left - right });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <motion.div
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 16 }}
      style={{ display: visible ? "block" : "none" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="shrink-0 overflow-hidden border-t border-border bg-surface-1/90"
    >
      <div className={"flex items-center gap-3 " + (compact ? "px-2 py-1.5" : "px-3 py-2")}>
        {onTogglePlay && (
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={playing ? "Pause history playback" : "Play history playback"}
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded border border-border bg-surface-2 text-[10px] text-foreground transition-colors hover:border-border-strong"
          >
            {playing ? "❚❚" : "▶"}
          </button>
        )}
        <div ref={trackRef} className="relative flex min-w-0 flex-1 items-center">
          <div
            className="absolute top-[5px] h-px bg-border-strong"
            style={{ left: edges.left, right: edges.right }}
            aria-hidden="true"
          />
          <motion.div
            className="absolute top-[5px] h-px bg-teal"
            style={{ left: edges.left }}
            animate={{ width: timelineProgressRatio(commit) * edges.span }}
            transition={{ duration: 0.4 }}
            aria-hidden="true"
          />
          <div className="relative flex w-full items-start justify-between">
            {COMMITS.map((c, i) => {
              const on = i === commit;
              const markerClass =
                "group flex flex-col items-center gap-1 px-1 " +
                (compact ? "" : "min-h-11 ") +
                (interactive ? "cursor-pointer" : "cursor-default");
              const inner = (
                <>
                  <span
                    data-dot
                    className={
                      "size-2.5 rounded-full border transition-colors duration-200 " +
                      (on
                        ? "border-teal bg-teal"
                        : "border-border-strong bg-surface-2 group-hover:border-teal/60")
                    }
                  />
                  <span
                    className={
                      "font-mono transition-colors " +
                      (compact ? "text-[9px] " : "text-[10px] ") +
                      (on ? "text-teal" : "text-muted-foreground")
                    }
                  >
                    {c.label}
                  </span>
                </>
              );
              return interactive ? (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  aria-label={`Commit ${c.label}: ${c.message}`}
                  data-demo-target={markerTarget?.(i)}
                  onClick={() => onCommit?.(i)}
                  className={markerClass}
                >
                  {inner}
                </button>
              ) : (
                <span key={c.id} data-demo-target={markerTarget?.(i)} className={markerClass}>
                  {inner}
                </span>
              );
            })}
          </div>
        </div>
      </div>
      {interactive && (
        <div className="px-3 pb-2">
          <label htmlFor={scrubId} className="sr-only">
            Scrub through commit history
          </label>
          <input
            id={scrubId}
            type="range"
            min={0}
            max={COMMITS.length - 1}
            step={1}
            value={commit}
            onChange={(e) => onCommit?.(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer accent-[var(--teal)]"
          />
        </div>
      )}
    </motion.div>
  );
}

/** Autoplay through the demo commits. Never autoplays under reduced motion. */
export function useCommitPlayer(
  playing: boolean,
  commit: number,
  setCommit: (i: number) => void,
  stop: () => void,
) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!playing || reduce) return;
    const t = setTimeout(() => {
      if (commit >= COMMITS.length - 1) stop();
      else setCommit(commit + 1);
    }, 1500);
    return () => clearTimeout(t);
  }, [playing, commit, reduce, setCommit, stop]);
}
