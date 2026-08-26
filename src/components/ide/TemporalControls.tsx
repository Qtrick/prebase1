import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId } from "react";
import { COMMITS, diffCounts } from "@/lib/demo-graph";

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

export function TemporalTimeline({
  commit,
  onCommit,
  playing = false,
  onTogglePlay,
  visible = true,
}: {
  commit: number;
  onCommit?: ((i: number) => void) | undefined;
  playing?: boolean;
  onTogglePlay?: (() => void) | undefined;
  visible?: boolean;
}) {
  const interactive = Boolean(onCommit);
  const scrubId = useId();
  return (
    <motion.div
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 16 }}
      style={{ display: visible ? "block" : "none" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="shrink-0 overflow-hidden border-t border-border bg-surface-1/90"
    >
      <div className="flex items-center gap-3 px-3 py-2">
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
        <div className="relative flex min-w-0 flex-1 items-center">
          <div className="absolute inset-x-1 top-[5px] h-px bg-border-strong" aria-hidden="true" />
          <motion.div
            className="absolute left-1 top-[5px] h-px bg-teal"
            animate={{ width: `${(commit / (COMMITS.length - 1)) * 100}%` }}
            transition={{ duration: 0.4 }}
            aria-hidden="true"
          />
          <div className="relative flex w-full items-start justify-between">
            {COMMITS.map((c, i) => {
              const on = i === commit;
              return (
                <button
                  key={c.id}
                  type="button"
                  tabIndex={interactive ? 0 : -1}
                  aria-pressed={on}
                  aria-label={`Commit ${c.label}: ${c.message}`}
                  onClick={() => onCommit?.(i)}
                  className={
                    "group flex min-h-11 flex-col items-center gap-1 px-1 " +
                    (interactive ? "cursor-pointer" : "cursor-default")
                  }
                >
                  <span
                    className={
                      "size-2.5 rounded-full border transition-colors duration-200 " +
                      (on
                        ? "border-teal bg-teal"
                        : "border-border-strong bg-surface-2 group-hover:border-teal/60")
                    }
                  />
                  <span
                    className={
                      "font-mono text-[10px] transition-colors " +
                      (on ? "text-teal" : "text-muted-foreground")
                    }
                  >
                    {c.label}
                  </span>
                </button>
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
