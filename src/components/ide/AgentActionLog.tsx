import { finishedLabel, type AgentRunSnapshot } from "@/lib/agent-run";
import type { DemoAgentAction } from "@/lib/demo-questions";

export function AgentActionLog({
  actions,
  snapshot,
  expandable = false,
  expanded = false,
  onToggle,
  presentational = false,
}: {
  actions: readonly DemoAgentAction[];
  snapshot: AgentRunSnapshot;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  presentational?: boolean;
}) {
  if (actions.length === 0) return null;
  if (snapshot.phase === "idle") return null;

  const showSteps = !snapshot.collapsed || expanded;
  const summary = finishedLabel(actions.length);

  return (
    <div className="space-y-1">
      {showSteps &&
        actions.map((action, i) => {
          const done = i < snapshot.completedCount;
          const active = i === snapshot.activeIndex;
          const pending = !done && !active;
          return (
            <div
              key={action.id}
              className={
                "flex items-start gap-1.5 font-mono text-[10px] leading-[1.4] " +
                (active
                  ? "text-foreground"
                  : done
                    ? "text-muted-foreground"
                    : "text-muted-foreground/40")
              }
            >
              <span className="mt-[1px] flex size-3 shrink-0 items-center justify-center">
                {active ? <ActionSpinner /> : done ? <ActionCheck /> : <span className="size-1 rounded-full bg-border-strong" />}
              </span>
              <span className={pending ? "truncate" : ""}>{action.label}</span>
            </div>
          );
        })}

      {snapshot.collapsed &&
        (expandable && !presentational ? (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={onToggle}
            className="flex w-full cursor-pointer items-center gap-1 font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Chevron open={expanded} />
            {summary}
          </button>
        ) : (
          <p className="font-mono text-[10px] text-muted-foreground">{summary}</p>
        ))}
    </div>
  );
}

function ActionSpinner() {
  return (
    <span
      aria-hidden="true"
      className="size-2.5 animate-spin rounded-full border border-teal/25 border-t-teal"
    />
  );
}

function ActionCheck() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2 5.2 L4.1 7.2 L8.2 2.8" stroke="currentColor" strokeWidth="1.4" className="text-teal" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 8 10"
      fill="none"
      aria-hidden="true"
      className={"transition-transform duration-150 " + (open ? "rotate-90" : "")}
    >
      <path d="M2 1.5 L6 5 L2 8.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
