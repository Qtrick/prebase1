import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { NODE_BY_ID } from "@/lib/demo-graph";

const MODES = [
  {
    id: "Ask",
    prompt: "What depends on this service?",
    answer: (n: number) => `${n} connected modules`,
  },
  {
    id: "Edit",
    prompt: "Update this service and its direct dependents.",
    answer: (n: number) => `${n} files staged for edit`,
  },
  {
    id: "Agent",
    prompt: "Trace the affected modules, make the change, and verify it.",
    answer: (n: number) => `Plan across ${n} modules`,
  },
] as const;

export function AgentsPanel({
  contextIds,
  selected,
  active = false,
  compact = false,
}: {
  contextIds: string[] | null;
  selected: string | null;
  active?: boolean;
  compact?: boolean;
}) {
  const [tab, setTab] = useState<(typeof MODES)[number]["id"]>("Ask");
  const mode = MODES.find((m) => m.id === tab)!;
  const ids = contextIds ?? [];
  const related = ids.filter((id) => id !== selected);

  return (
    <div className="text-[11px]">
      <p className="pb-3 text-[10px] tracking-[0.14em] text-muted-foreground">AGENTS</p>
      <div className="flex gap-1 text-[10px]" role="group" aria-label="Agent mode">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={tab === m.id}
            onClick={() => setTab(m.id)}
            className={
              "cursor-pointer rounded border px-1.5 py-1 transition-colors duration-150 " +
              (tab === m.id
                ? "border-teal/30 bg-teal/10 text-teal"
                : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground")
            }
          >
            {m.id}
          </button>
        ))}
      </div>

      <motion.div animate={{ opacity: active ? 1 : 0.45 }} transition={{ duration: 0.4 }} className="mt-3 space-y-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${tab}-${selected ?? "none"}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-teal">
              <span className="inline-block size-1.5 rounded-full bg-teal" />
              {ids.length ? "Context ready" : "No context"}
            </div>
            {selected && (
              <p className="font-mono text-[10px] text-muted-foreground">
                {NODE_BY_ID[selected]?.label} · +{related.length} connected files
              </p>
            )}
            <div className="rounded-md border border-border bg-surface-2 px-2 py-1.5 text-foreground/85">
              {mode.prompt}
            </div>
            <div className="rounded-md border border-teal/25 bg-teal/[0.07] px-2 py-1.5 font-mono text-teal">
              {mode.answer(related.length)}
            </div>
            {!compact && (
              <ul className="space-y-1 pl-1 font-mono text-[10px] text-muted-foreground">
                {related.slice(0, 5).map((id) => (
                  <li key={id}>{NODE_BY_ID[id]?.label}</li>
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
