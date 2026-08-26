import { motion, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { GraphCanvas, type GraphState } from "./GraphCanvas";

const FILES = [
  { name: "src", depth: 0, dir: true },
  { name: "app.tsx", depth: 1 },
  { name: "auth.ts", depth: 1 },
  { name: "graph", depth: 1, dir: true },
  { name: "graphService.ts", depth: 2, active: true },
  { name: "parser.ts", depth: 2 },
  { name: "indexer.ts", depth: 2 },
  { name: "api.ts", depth: 1 },
  { name: "runtime.ts", depth: 1 },
];

function Segmented({ state }: { state: GraphState }) {
  const active = state === "temporal" ? "Temporal" : "Network";
  return (
    <div
      className="inline-flex rounded-md border border-border bg-surface-2 p-0.5 text-[11px]"
      aria-hidden="true"
    >
      {["Network", "Temporal"].map((label) => (
        <span
          key={label}
          className={
            "relative rounded-[5px] px-2.5 py-1 transition-colors duration-200 " +
            (label === active ? "text-teal" : "text-muted-foreground")
          }
        >
          {label === active && (
            <motion.span
              layoutId="pb-seg"
              className="absolute inset-0 rounded-[5px] border border-teal/30 bg-teal/10"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
          <span className="relative">{label}</span>
        </span>
      ))}
    </div>
  );
}

export function IdeFrame({
  state,
  animateIn = false,
  dense = false,
  className = "",
  children,
}: {
  state: GraphState;
  animateIn?: boolean;
  dense?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // Pointer spotlight + micro-parallax, written straight to CSS variables so
  // pointer movement never triggers a React re-render. Desktop pointers only.
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    ref.current.style.setProperty("--mx", `${px * 100}%`);
    ref.current.style.setProperty("--my", `${py * 100}%`);
    ref.current.style.setProperty("--rx", `${(0.5 - py) * 2.2}deg`);
    ref.current.style.setProperty("--ry", `${(px - 0.5) * 2.6}deg`);
  }

  function onPointerLeave() {
    if (!ref.current) return;
    ref.current.style.setProperty("--rx", "0deg");
    ref.current.style.setProperty("--ry", "0deg");
  }

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
        className="group relative overflow-hidden rounded-xl border border-border bg-surface-1 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]"
      >
        {/* pointer spotlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(420px circle at var(--mx) var(--my), oklch(1 0 0 / 5%), transparent 65%)",
          }}
        />

        {/* title bar */}
        <div className="flex items-center gap-3 border-b border-border bg-surface-2/70 px-3 py-2">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-surface-3" />
            <span className="size-2.5 rounded-full bg-surface-3" />
            <span className="size-2.5 rounded-full bg-surface-3" />
          </div>
          <div className="mx-auto hidden max-w-[220px] flex-1 rounded-md border border-border bg-background/60 px-3 py-1 text-center font-mono text-[11px] text-muted-foreground sm:block">
            prebase — code graph
          </div>
          <Segmented state={state} />
        </div>

        <div className="flex min-h-[300px] sm:min-h-[380px] lg:min-h-[440px]">
          {/* explorer */}
          <aside className={"hidden w-44 shrink-0 border-r border-border bg-surface-1/80 py-3 lg:w-52 " + (dense ? "" : "md:block")}>
            <p className="px-3 pb-2 text-[10px] tracking-[0.14em] text-muted-foreground">
              PREBASE MAPS
            </p>
            <ul className="space-y-[3px] font-mono text-[11px]">
              {FILES.map((f) => (
                <li
                  key={f.name + f.depth}
                  style={{ paddingLeft: 12 + f.depth * 12 }}
                  className={
                    "py-[3px] pr-2 " +
                    (f.active
                      ? "bg-teal/10 text-teal"
                      : f.dir
                        ? "text-foreground/70"
                        : "text-muted-foreground")
                  }
                >
                  {f.dir ? "▸ " : ""}
                  {f.name}
                </li>
              ))}
            </ul>
          </aside>

          {/* graph workspace */}
          <div className="relative min-w-0 flex-1">
            <div className="flex items-center gap-1 border-b border-border bg-surface-2/40 px-2 py-1.5 text-[11px]">
              <span className="rounded-t-sm px-2 py-1 text-muted-foreground">Welcome</span>
              <span className="rounded-sm border border-border bg-surface-1 px-2 py-1 text-foreground">
                Code Graph
              </span>
            </div>
            <GraphCanvas
              state={state}
              animateIn={animateIn}
              className={"w-full " + (dense ? "h-[300px] lg:h-[400px]" : "h-[240px] sm:h-[320px] lg:h-[380px]")}
            />
            <div className="flex items-center justify-between border-t border-border px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
              <span>18 nodes · 20 edges</span>
              <span className="text-teal">
                {state === "temporal" ? "HEAD · 3 changes" : "indexed"}
              </span>
            </div>
          </div>

          {/* agents panel */}
          <aside className={"hidden w-52 shrink-0 border-l border-border bg-surface-1/80 p-3 " + (dense ? "2xl:block" : "lg:block")}>
            <p className="pb-3 text-[10px] tracking-[0.14em] text-muted-foreground">AGENTS</p>
            <div className="space-y-2 text-[11px]">
              <div className="flex gap-1 text-[10px]">
                {["Ask", "Edit", "Agent"].map((m, i) => (
                  <span
                    key={m}
                    className={
                      "rounded border px-1.5 py-0.5 " +
                      (i === 2
                        ? "border-teal/30 bg-teal/10 text-teal"
                        : "border-border text-muted-foreground")
                    }
                  >
                    {m}
                  </span>
                ))}
              </div>
              <motion.div
                animate={{ opacity: state === "agent" ? 1 : 0.25 }}
                transition={{ duration: 0.5 }}
                className="space-y-2"
              >
                <div className="rounded-md border border-border bg-surface-2 px-2 py-1.5 text-foreground/85">
                  What depends on this service?
                </div>
                <div className="rounded-md border border-teal/25 bg-teal/[0.07] px-2 py-1.5 font-mono text-teal">
                  4 connected modules
                </div>
                <ul className="space-y-1 pl-1 font-mono text-[10px] text-muted-foreground">
                  <li>auth.ts</li>
                  <li>parser.ts</li>
                  <li>indexer.ts</li>
                  <li>api.ts</li>
                </ul>
              </motion.div>
            </div>
          </aside>
        </div>
        {children}
      </div>
    </motion.div>
  );
}
