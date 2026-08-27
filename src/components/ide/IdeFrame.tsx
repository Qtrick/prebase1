import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NODES } from "@/lib/demo-graph";
import type { GraphMode } from "@/components/graph/DemoGraph";

/** Small SSR-safe media query hook used for responsive IDE chrome sizing. */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);
  return matches;
}


/** Files shown in the "PreBase Maps" explorer, derived from the demo model. */
const EXPLORER: Array<{ id?: string; name: string; depth: number; dir?: boolean }> = [
  { name: "src", depth: 0, dir: true },
  { id: "app", name: "app.tsx", depth: 1 },
  { id: "auth", name: "auth.ts", depth: 1 },
  { name: "graph", depth: 1, dir: true },
  { id: "graph", name: "graphService.ts", depth: 2 },
  { id: "parser", name: "parser.ts", depth: 2 },
  { id: "indexer", name: "indexer.ts", depth: 2 },
  { id: "depIndex", name: "dependencyIndex.ts", depth: 2 },
  { id: "temporalStore", name: "temporalStore.ts", depth: 2 },
  { id: "api", name: "api.ts", depth: 1 },
  { id: "runtime", name: "runtime.ts", depth: 1 },
];

export function ModeToggle({
  mode,
  onChange,
  idPrefix,
}: {
  mode: GraphMode;
  onChange?: ((m: GraphMode) => void) | undefined;
  idPrefix: string;
}) {
  const interactive = Boolean(onChange);
  const modes = ["network", "temporal"] as GraphMode[];
  const labelOf = (m: GraphMode) => (m === "network" ? "Network" : "Temporal");

  // Indicator-only: no buttons, no focus, no hover affordance. Scroll owns the
  // mode in the guided story, so this must not look or behave like a control.
  if (!interactive) {
    return (
      <div
        className="inline-flex cursor-default select-none rounded-md border border-border bg-surface-2 p-0.5 text-[11px]"
        role="status"
        aria-live="polite"
        aria-label={`Current graph mode: ${labelOf(mode)}`}
      >
        {modes.map((m) => {
          const active = mode === m;
          return (
            <span key={m} className="relative rounded-[5px] px-2.5 py-1">
              {active && (
                <motion.span
                  layoutId={`pb-seg-${idPrefix}`}
                  className="absolute inset-0 rounded-[5px] border border-teal/30 bg-teal/10"
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <span
                aria-hidden="true"
                className={"relative " + (active ? "text-teal" : "text-muted-foreground/60")}
              >
                {labelOf(m)}
              </span>
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="inline-flex rounded-md border border-border bg-surface-2 p-0.5 text-[11px]"
      role="group"
      aria-label="Graph mode"
    >
      {modes.map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            aria-pressed={active}
            onClick={() => onChange?.(m)}
            className={
              "relative cursor-pointer rounded-[5px] px-2.5 py-1 transition-colors duration-200 " +
              (active ? "text-teal" : "text-muted-foreground hover:text-foreground")
            }
          >
            {active && (
              <motion.span
                layoutId={`pb-seg-${idPrefix}`}
                className="absolute inset-0 rounded-[5px] border border-teal/30 bg-teal/10"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            <span className="relative">{labelOf(m)}</span>
          </button>
        );
      })}
    </div>
  );
}

export function IdeFrame({
  mode,
  onModeChange,
  selected = null,
  hovered = null,
  onHoverFile,
  onSelectFile,
  showExplorer = true,
  explorerDim = 0,
  agentsWide = false,
  agentsOpen = true,
  agents,
  toolbar,
  timeline,
  statusLeft,
  statusRight,
  animateIn = false,
  parallax = true,
  className = "",
  graphClassName = "",
  children,
}: {
  mode: GraphMode;
  onModeChange?: ((m: GraphMode) => void) | undefined;
  selected?: string | null;
  hovered?: string | null;
  onHoverFile?: ((id: string | null) => void) | undefined;
  onSelectFile?: ((id: string | null) => void) | undefined;
  showExplorer?: boolean;
  /** 0..1 — how much the explorer recedes as the graph takes over */
  explorerDim?: number;
  agentsWide?: boolean;
  agentsOpen?: boolean;
  agents?: ReactNode;
  toolbar?: ReactNode;
  timeline?: ReactNode;
  statusLeft?: ReactNode;
  statusRight?: ReactNode;
  animateIn?: boolean;
  parallax?: boolean;
  className?: string;
  graphClassName?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const wideExplorer = useMediaQuery("(min-width: 1024px)");


  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || !parallax || e.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    ref.current.style.setProperty("--mx", `${px * 100}%`);
    ref.current.style.setProperty("--my", `${py * 100}%`);
    ref.current.style.setProperty("--rx", `${(0.5 - py) * 0.9}deg`);
    ref.current.style.setProperty("--ry", `${(px - 0.5) * 1.1}deg`);

  }

  function onPointerLeave() {
    if (!ref.current) return;
    ref.current.style.setProperty("--rx", "0deg");
    ref.current.style.setProperty("--ry", "0deg");
  }

  const active = hovered ?? selected;

  return (
    <motion.div
      initial={animateIn && !reduce ? { opacity: 0, y: 28 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className={"[perspective:1600px] " + className}
    >
      <div
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={
          {
            "--mx": "50%",
            "--my": "0%",
            transform: "rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))",
            transition: "transform 500ms cubic-bezier(0.22,1,0.36,1)",
          } as React.CSSProperties
        }
        className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface-1 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]"
      >
        {parallax && !reduce && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(135px circle at var(--mx) var(--my), oklch(1 0 0 / 5.5%), transparent 70%)",
            }}
          />
        )}


        {/* title bar */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface-2/70 px-3 py-2">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-surface-3" />
            <span className="size-2.5 rounded-full bg-surface-3" />
            <span className="size-2.5 rounded-full bg-surface-3" />
          </div>
          <div className="mx-auto hidden max-w-[220px] flex-1 rounded-md border border-border bg-background/60 px-3 py-1 text-center font-mono text-[11px] text-muted-foreground sm:block">
            prebase · code graph
          </div>
          <ModeToggle mode={mode} onChange={onModeChange} idPrefix={String(showExplorer)} />
        </div>

        <div className="relative flex min-h-0 flex-1">
          {/* explorer */}
          {showExplorer && (
            <motion.aside
              initial={false}
              animate={{
                opacity: 1 - explorerDim * 0.85,
                width: explorerDim > 0.5 ? 0 : wideExplorer ? 208 : 156,
              }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="hidden shrink-0 overflow-hidden border-r border-border bg-surface-1/80 py-3 sm:block"
            >

              <p className="px-3 pb-2 text-[10px] tracking-[0.14em] text-muted-foreground">
                PREBASE MAPS
              </p>
              <ul className="space-y-[1px] font-mono text-[11px]">
                {EXPLORER.map((f) => {
                  const isActive = f.id && active === f.id;
                  const isSelected = f.id && selected === f.id;
                  return (
                    <li key={f.name + f.depth}>
                      {f.dir || !f.id ? (
                        <span
                          style={{ paddingLeft: 12 + f.depth * 12 }}
                          className="block py-[3px] pr-2 text-foreground/70"
                        >
                          ▸ {f.name}
                        </span>
                      ) : (
                        <button
                          type="button"
                          style={{ paddingLeft: 12 + f.depth * 12 }}
                          onPointerEnter={() => onHoverFile?.(f.id!)}
                          onPointerLeave={() => onHoverFile?.(null)}
                          onFocus={() => onHoverFile?.(f.id!)}
                          onBlur={() => onHoverFile?.(null)}
                          onClick={() => onSelectFile?.(isSelected ? null : f.id!)}
                          aria-pressed={Boolean(isSelected)}
                          className={
                            "block w-full cursor-pointer py-[3px] pr-2 text-left transition-colors duration-150 " +
                            (isActive
                              ? "bg-teal/10 text-teal"
                              : "text-muted-foreground hover:bg-surface-2 hover:text-foreground")
                          }
                        >
                          {f.name}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </motion.aside>
          )}

          {/* graph workspace */}
          <div className="relative flex min-w-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center gap-1 border-b border-border bg-surface-2/40 px-2 py-1.5 text-[11px]">
              <span className="rounded-t-sm px-2 py-1 text-muted-foreground">Welcome</span>
              <span className="rounded-sm border border-border bg-surface-1 px-2 py-1 text-foreground">
                {mode === "temporal" ? "Temporal Graph" : "Code Graph"}
              </span>
            </div>
            {toolbar}
            <div className={"relative min-h-0 flex-1 " + graphClassName}>{children}</div>
            {timeline}
            <div className="flex shrink-0 items-center justify-between border-t border-border px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
              <span>{statusLeft ?? `${NODES.length} nodes · 23 edges`}</span>
              <span className="text-teal">{statusRight ?? "indexed"}</span>
            </div>
          </div>

          {/* agents panel — always mounted, slides over the workspace so the graph never reflows */}
          {agents && (
            <motion.aside
              initial={{ x: "100%", opacity: 0 }}
              animate={{
                x: agentsOpen ? "0%" : "100%",
                opacity: agentsOpen ? 1 : 0,
              }}
              transition={
                reduce
                  ? { duration: 0.001 }
                  : { type: "spring", stiffness: 180, damping: 28, mass: 0.8 }
              }
              inert={!agentsOpen}
              style={{ pointerEvents: agentsOpen ? "auto" : "none", willChange: "transform" }}
              className={
                "absolute inset-y-0 right-0 z-20 hidden min-h-0 w-[212px] overflow-hidden border-l border-border bg-surface-1/95 shadow-[-24px_0_60px_-40px_rgba(0,0,0,0.9)] backdrop-blur-sm lg:w-[264px] " +
                (agentsWide ? "lg:block" : "md:block")
              }
            >
              <div className="flex h-full min-h-0 w-full flex-col overflow-hidden p-3 pb-4 lg:p-3.5">
                {agents}

              </div>
            </motion.aside>
          )}

        </div>
      </div>
    </motion.div>
  );
}
