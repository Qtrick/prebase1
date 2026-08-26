import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";

export type GraphState = "network" | "temporal" | "agent";

type Status = "stable" | "added" | "removed" | "modified";

type Node = {
  id: string;
  label?: string;
  x: number;
  y: number;
  r: number;
  /** position at the newer commit */
  tx?: number;
  ty?: number;
  status?: Status;
  /** part of the agent's answer set */
  ctx?: boolean;
  focus?: boolean;
};

const NODES: Node[] = [
  { id: "app", label: "app.tsx", x: 400, y: 96, r: 9, tx: 408, ty: 88, status: "modified" },
  { id: "router", x: 316, y: 150, r: 5.5, tx: 308, ty: 146 },
  { id: "views", x: 486, y: 152, r: 5.5, tx: 498, ty: 148, status: "modified" },

  { id: "auth", label: "auth.ts", x: 196, y: 214, r: 7.5, tx: 190, ty: 220, ctx: true },
  { id: "session", x: 116, y: 168, r: 4.5, tx: 112, ty: 176 },
  { id: "tokens", x: 122, y: 268, r: 4.5, status: "removed" },

  {
    id: "graph",
    label: "graphService.ts",
    x: 400, y: 250, r: 11,
    tx: 400, ty: 246,
    status: "modified",
    focus: true,
  },
  { id: "parser", x: 330, y: 322, r: 6, tx: 322, ty: 330, ctx: true },
  { id: "index", x: 470, y: 320, r: 6, tx: 484, ty: 326, ctx: true },
  { id: "walker", x: 396, y: 372, r: 4.5, tx: 392, ty: 384 },
  { id: "cache", x: 262, y: 388, r: 4.5, status: "removed" },
  { id: "temporalStore", x: 300, y: 402, r: 5.5, tx: 300, ty: 402, status: "added" },
  { id: "diffIndex", x: 468, y: 404, r: 5, tx: 468, ty: 404, status: "added" },

  { id: "api", label: "api.ts", x: 606, y: 212, r: 7.5, tx: 616, ty: 206, ctx: true },
  { id: "client", x: 686, y: 164, r: 4.5, tx: 698, ty: 160 },
  { id: "runtime", label: "runtime.ts", x: 640, y: 306, r: 7, tx: 650, ty: 312 },
  { id: "preview", x: 704, y: 258, r: 4.5, tx: 716, ty: 254 },
  { id: "server", x: 700, y: 366, r: 4.5, tx: 712, ty: 372, status: "added" },
];

const EDGES: Array<[string, string]> = [
  ["app", "router"],
  ["app", "views"],
  ["router", "auth"],
  ["auth", "session"],
  ["auth", "tokens"],
  ["app", "graph"],
  ["views", "graph"],
  ["graph", "parser"],
  ["graph", "index"],
  ["parser", "walker"],
  ["index", "walker"],
  ["parser", "cache"],
  ["parser", "temporalStore"],
  ["index", "diffIndex"],
  ["graph", "api"],
  ["api", "client"],
  ["api", "runtime"],
  ["runtime", "preview"],
  ["runtime", "server"],
  ["auth", "graph"],
];

const byId = (id: string) => NODES.find((n) => n.id === id)!;

const COMMITS = ["a83fc2", "c192af", "7fd410", "HEAD"];

function colorFor(node: Node, state: GraphState) {
  if (state === "temporal") {
    if (node.status === "removed") return "var(--danger)";
    if (node.status === "added") return "var(--teal)";
    if (node.status === "modified") return "var(--teal-dim)";
    return "oklch(0.62 0 0)";
  }
  if (state === "agent") {
    if (node.focus) return "var(--teal)";
    if (node.ctx) return "var(--teal-dim)";
    return "oklch(0.42 0 0)";
  }
  return node.label ? "oklch(0.92 0 0)" : "oklch(0.62 0 0)";
}

function nodeOpacity(node: Node, state: GraphState) {
  if (state === "temporal") return node.status === "removed" ? 0.45 : 1;
  if (state === "agent") return node.focus || node.ctx ? 1 : 0.35;
  return 1;
}

export function GraphCanvas({
  state = "network",
  className,
  animateIn = false,
}: {
  state?: GraphState;
  className?: string;
  animateIn?: boolean;
}) {
  const reduce = useReducedMotion();
  const temporal = state === "temporal";

  const edges = useMemo(
    () =>
      EDGES.map(([a, b]) => {
        const na = byId(a);
        const nb = byId(b);
        const dead = na.status === "removed" || nb.status === "removed";
        const fresh = na.status === "added" || nb.status === "added";
        const contextual = (na.focus && nb.ctx) || (nb.focus && na.ctx);
        return { a: na, b: nb, dead, fresh, contextual, key: `${a}-${b}` };
      }),
    [],
  );

  const dur = reduce ? 0 : 0.75;

  return (
    <svg
      viewBox="0 0 800 460"
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="pb-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.78 0.11 190)" stopOpacity="0.30" />
          <stop offset="100%" stopColor="oklch(0.78 0.11 190)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* edges */}
      <g>
        {edges.map((e, i) => {
          const x1 = temporal ? (e.a.tx ?? e.a.x) : e.a.x;
          const y1 = temporal ? (e.a.ty ?? e.a.y) : e.a.y;
          const x2 = temporal ? (e.b.tx ?? e.b.x) : e.b.x;
          const y2 = temporal ? (e.b.ty ?? e.b.y) : e.b.y;
          let stroke = "oklch(1 0 0 / 14%)";
          let opacity = 1;
          if (state === "temporal") {
            if (e.dead) {
              stroke = "var(--danger)";
              opacity = 0.35;
            } else if (e.fresh) {
              stroke = "var(--teal)";
              opacity = 0.55;
            }
          } else if (state === "agent") {
            if (e.contextual) {
              stroke = "var(--teal)";
              opacity = 0.7;
            } else {
              opacity = 0.35;
            }
          }
          const hidden = state === "temporal" && e.a.status === "added" ? false : false;
          return (
            <motion.line
              key={e.key}
              initial={animateIn ? { pathLength: 0, opacity: 0 } : false}
              animate={{
                x1, y1, x2, y2,
                opacity: hidden ? 0 : opacity,
                stroke,
                pathLength: 1,
              }}
              transition={{
                default: { duration: dur, ease: [0.22, 1, 0.36, 1] },
                pathLength: { duration: reduce ? 0 : 0.9, delay: reduce ? 0 : 0.25 + i * 0.02 },
                opacity: { duration: reduce ? 0 : 0.5, delay: animateIn ? 0.25 + i * 0.02 : 0 },
              }}
              strokeWidth={e.contextual && state === "agent" ? 1.4 : 1}
              x1={x1} y1={y1} x2={x2} y2={y2}
            />
          );
        })}
      </g>

      {/* focus halo */}
      <motion.circle
        cx={byId("graph").x}
        cy={byId("graph").y}
        r={70}
        fill="url(#pb-halo)"
        animate={{ opacity: state === "agent" ? 1 : state === "network" ? 0.35 : 0 }}
        transition={{ duration: dur }}
      />

      {/* nodes */}
      <g>
        {NODES.map((n, i) => {
          const x = temporal ? (n.tx ?? n.x) : n.x;
          const y = temporal ? (n.ty ?? n.y) : n.y;
          const isNew = n.status === "added";
          const fill = colorFor(n, state);
          const opacity = nodeOpacity(n, state);
          const scale =
            state === "temporal" && isNew ? 1 : state === "agent" && n.focus ? 1.15 : 1;
          return (
            <motion.g
              key={n.id}
              initial={animateIn ? { opacity: 0, scale: 0.6 } : false}
              animate={{
                opacity: state !== "temporal" && isNew ? 0 : opacity,
                scale,
              }}
              transition={{
                duration: reduce ? 0 : 0.6,
                delay: animateIn && !reduce ? 0.1 + i * 0.045 : 0,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ originX: `${x}px`, originY: `${y}px` }}
            >
              <motion.circle
                animate={{ cx: x, cy: y, fill }}
                transition={{ duration: dur, ease: [0.22, 1, 0.36, 1] }}
                cx={x}
                cy={y}
                r={n.r}
              />
              <motion.circle
                animate={{ cx: x, cy: y, r: n.r + 6, opacity: n.focus && state === "agent" ? 1 : 0 }}
                transition={{ duration: dur }}
                cx={x}
                cy={y}
                r={n.r + 6}
                fill="none"
                stroke="var(--teal)"
                strokeWidth={1}
                opacity={0}
              />
              {n.label ? (
                <motion.text
                  animate={{ x: x + n.r + 8, y: y + 4, opacity: opacity * 0.95 }}
                  transition={{ duration: dur }}
                  x={x + n.r + 8}
                  y={y + 4}
                  fontSize="12"
                  fontFamily="var(--font-mono-stack)"
                  fill={
                    state === "agent" && !(n.focus || n.ctx)
                      ? "oklch(0.5 0 0)"
                      : "oklch(0.82 0 0)"
                  }
                >
                  {n.label}
                </motion.text>
              ) : null}
            </motion.g>
          );
        })}
      </g>

      {/* temporal timeline */}
      <motion.g
        animate={{ opacity: temporal ? 1 : 0 }}
        transition={{ duration: reduce ? 0 : 0.5 }}
        aria-hidden="true"
      >
        <line x1="120" y1="440" x2="680" y2="440" stroke="oklch(1 0 0 / 14%)" strokeWidth="1" />
        <motion.line
          x1="120"
          y1="440"
          x2={temporal ? 680 : 120}
          y2="440"
          stroke="var(--teal)"
          strokeWidth="1.5"
          animate={{ x2: temporal ? 680 : 120 }}
          transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        {COMMITS.map((c, i) => {
          const x = 120 + (560 / (COMMITS.length - 1)) * i;
          const head = i === COMMITS.length - 1;
          return (
            <g key={c}>
              <circle
                cx={x}
                cy={440}
                r={head ? 5 : 3.5}
                fill={head ? "var(--teal)" : "oklch(0.35 0 0)"}
                stroke={head ? "var(--teal)" : "oklch(0.5 0 0)"}
              />
              <text
                x={x}
                y={426}
                textAnchor="middle"
                fontSize="11"
                fontFamily="var(--font-mono-stack)"
                fill={head ? "var(--teal)" : "oklch(0.6 0 0)"}
              >
                {c}
              </text>
            </g>
          );
        })}
      </motion.g>
    </svg>
  );
}

export const graphLegend: Record<GraphState, { label: string; items: string[] }> = {
  network: {
    label: "Network graph",
    items: ["Files and modules", "Dependency edges", "Repository clusters"],
  },
  temporal: {
    label: "Temporal graph",
    items: ["Added nodes", "Removed nodes", "Modified nodes", "Commit timeline"],
  },
  agent: {
    label: "Agent context",
    items: ["Selected node", "Connected dependencies", "Context passed to the agent"],
  },
};
