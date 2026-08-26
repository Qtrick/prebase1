import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  COMMITS,
  EDGES,
  LAYOUT_POSITIONS,
  NEIGHBORS,
  NODES,
  NODE_BY_ID,
  STATUS_COLOR,
  VIEW,
  labelAt,
  radiusOf,
  statusAt,
  temporalDescription,
  type DemoNode,
  type LayoutMode,
} from "@/lib/demo-graph";

export type GraphMode = "network" | "temporal";

export type DemoGraphProps = {
  mode?: GraphMode;
  layout?: LayoutMode;
  /** index into COMMITS */
  commit?: number;
  /** temporal display mode */
  focusChanges?: boolean;
  selected?: string | null | undefined;
  hovered?: string | null | undefined;
  onSelect?: ((id: string | null) => void) | undefined;
  onHover?: ((id: string | null) => void) | undefined;
  /** ids receiving agent-context emphasis */
  agentContext?: string[] | null | undefined;
  /**
   * Capability level:
   *  - "none"   : purely decorative
   *  - "select" : hover / click nodes only (guided story) — never captures wheel or pans
   *  - "full"   : hover, click, wheel zoom, background pan, node drag (playground)
   */
  interactionMode?: "none" | "select" | "full";
  /** 0..1 continuous reveal used by the scroll story */
  reveal?: MotionValue<number> | undefined;
  /** external camera (scroll story owns it when provided) */
  cameraZoom?: MotionValue<number> | undefined;
  cameraX?: MotionValue<number> | undefined;
  cameraY?: MotionValue<number> | undefined;

  className?: string | undefined;
  /** expose zoom controls to a parent toolbar */
  controlsRef?: React.MutableRefObject<GraphControlsApi | null>;
  labelAll?: boolean;
};

export type GraphControlsApi = {
  zoomIn: () => void;
  zoomOut: () => void;
  fit: () => void;
  reset: () => void;
};

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.4;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function DemoGraph({
  mode = "network",
  layout = "organic",
  commit = COMMITS.length - 1,
  focusChanges = false,
  selected = null,
  hovered = null,
  onSelect,
  onHover,
  agentContext = null,
  interactionMode = "none",
  reveal,
  cameraZoom,
  cameraX,
  cameraY,
  className,
  controlsRef,
  labelAll = false,
}: DemoGraphProps) {
  const reduce = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const [offsets, setOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [tip, setTip] = useState<string | null>(null);

  /** hover + click */
  const interactive = interactionMode !== "none";
  /** wheel zoom, background pan, node drag */
  const full = interactionMode === "full";
  const draggable = full;


  const zoomMV = useMotionValue(1);
  const panX = useMotionValue(0);
  const panY = useMotionValue(0);
  const zoomSpring = useSpring(zoomMV, { stiffness: 210, damping: 30, mass: 0.6 });
  const panXSpring = useSpring(panX, { stiffness: 210, damping: 30, mass: 0.6 });
  const panYSpring = useSpring(panY, { stiffness: 210, damping: 30, mass: 0.6 });

  const setZoom = useCallback(
    (next: number) => zoomMV.set(clamp(next, MIN_ZOOM, MAX_ZOOM)),
    [zoomMV],
  );

  useEffect(() => {
    if (!controlsRef) return;
    controlsRef.current = {
      zoomIn: () => setZoom(zoomMV.get() * 1.25),
      zoomOut: () => setZoom(zoomMV.get() / 1.25),
      fit: () => {
        setZoom(1);
        panX.set(0);
        panY.set(0);
      },
      reset: () => {
        setZoom(1);
        panX.set(0);
        panY.set(0);
        setOffsets({});
        onSelect?.(null);
      },
    };
  }, [controlsRef, onSelect, panX, panY, setZoom, zoomMV]);

  // Wheel zoom / trackpad pinch — ONLY in "full" mode. In "select" mode the
  // document keeps ownership of the wheel so page scrolling is never stolen.
  const wheelRef = useRef<(e: WheelEvent) => void>(() => {});
  wheelRef.current = (e: WheelEvent) => {
    if (!full) return;
    e.preventDefault();
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
    setZoom(zoomMV.get() * Math.exp(-dy * 0.0015));
  };
  useEffect(() => {
    if (!full) return;
    const el = svgRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => wheelRef.current(e);
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [full]);


  // Background panning
  const panState = useRef<{ id: number; x: number; y: number; ox: number; oy: number } | null>(
    null,
  );
  const [panning, setPanning] = useState(false);

  const positions = LAYOUT_POSITIONS[layout];

  const posOf = useCallback(
    (id: string) => {
      const p = positions[id]!;
      const o = offsets[id];
      return { x: p.x + (o?.x ?? 0), y: p.y + (o?.y ?? 0), depth: p.depth };
    },
    [positions, offsets],
  );

  const present = useCallback(
    (n: DemoNode) => (mode === "temporal" ? statusAt(n, commit) !== "absent" : (n.addedAt ?? 0) === 0 || true),
    [mode, commit],
  );

  const contextSet = useMemo(() => new Set(agentContext ?? []), [agentContext]);
  const active = hovered ?? selected;
  // Hover should identify a node without re-animating the opacity of the
  // entire graph. Relationship dimming is reserved for the stable, clicked
  // selection so moving across nodes cannot flash every edge and node.
  const emphasisTarget = selected;
  const activeSet = useMemo(() => {
    if (!emphasisTarget) return null;
    return new Set([emphasisTarget, ...(NEIGHBORS[emphasisTarget] ?? [])]);
  }, [emphasisTarget]);

  const changedSet = useMemo(() => {
    if (mode !== "temporal") return null;
    const s = new Set<string>();
    for (const n of NODES) {
      const st = statusAt(n, commit);
      if (st !== "unchanged" && st !== "absent") s.add(n.id);
    }
    return s;
  }, [mode, commit]);

  function emphasis(id: string): number {
    if (contextSet.size) return contextSet.has(id) ? 1 : 0.18;
    if (activeSet) return id === emphasisTarget ? 1 : activeSet.has(id) ? 0.85 : 0.22;
    if (mode === "temporal" && focusChanges && changedSet) {
      return changedSet.has(id) ? 1 : 0.16;
    }
    return 1;
  }

  function fillOf(n: DemoNode) {
    if (mode === "temporal") {
      const st = statusAt(n, commit);
      return STATUS_COLOR[st === "absent" ? "unchanged" : st];
    }
    if (contextSet.size) return contextSet.has(n.id) ? "var(--teal)" : "oklch(0.45 0 0)";
    if (n.id === active) return "var(--teal)";
    return n.weight === 2 ? "oklch(0.9 0 0)" : n.weight === 1 ? "oklch(0.74 0 0)" : "oklch(0.56 0 0)";
  }

  function labelVisible(n: DemoNode) {
    if (labelAll) return true;
    if (n.id === active) return true;
    if (activeSet?.has(n.id)) return true;
    if (contextSet.has(n.id)) return true;
    if (mode === "temporal" && changedSet?.has(n.id)) return true;
    return n.weight === 2;
  }

  const dragRef = useRef<{
    id: string;
    pid: number;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
    el: SVGGElement;
  } | null>(null);

  function svgScale() {
    const el = svgRef.current;
    if (!el) return 1;
    const r = el.getBoundingClientRect();
    return VIEW.w / (r.width || VIEW.w);
  }

  function onNodePointerDown(e: React.PointerEvent<SVGGElement>, id: string) {
    if (!draggable || e.pointerType === "touch") return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const o = offsets[id] ?? { x: 0, y: 0 };
    dragRef.current = { id, pid: e.pointerId, sx: e.clientX, sy: e.clientY, ox: o.x, oy: o.y, el };
  }

  function onNodePointerMove(e: React.PointerEvent<SVGGElement>) {
    const d = dragRef.current;
    if (!d || d.pid !== e.pointerId) return;
    const s = svgScale() / zoomMV.get();
    const nx = d.ox + (e.clientX - d.sx) * s;
    const ny = d.oy + (e.clientY - d.sy) * s;
    const p = positions[d.id]!;
    d.el.style.transform = `translate(${p.x + nx}px, ${p.y + ny}px)`;
    d.el.dataset["dx"] = String(nx);
    d.el.dataset["dy"] = String(ny);
  }

  function onNodePointerUp(e: React.PointerEvent<SVGGElement>) {
    const d = dragRef.current;
    if (!d || d.pid !== e.pointerId) return;
    const nx = Number(d.el.dataset["dx"] ?? d.ox);
    const ny = Number(d.el.dataset["dy"] ?? d.oy);
    d.el.style.transform = "";
    dragRef.current = null;
    if (Math.abs(nx - d.ox) > 1 || Math.abs(ny - d.oy) > 1) {
      setOffsets((prev) => ({ ...prev, [d.id]: { x: nx, y: ny } }));
    }
  }

  function onBgPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (!full || dragRef.current) return;
    if ((e.target as Element).closest("[data-node]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    panState.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      ox: panX.get(),
      oy: panY.get(),
    };
    setPanning(true);
  }

  function onBgPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const p = panState.current;
    if (!p || p.id !== e.pointerId) return;
    const s = svgScale() / zoomMV.get();
    panX.jump?.(p.ox + (e.clientX - p.x) * s);
    panY.jump?.(p.oy + (e.clientY - p.y) * s);
    panX.set(p.ox + (e.clientX - p.x) * s);
    panY.set(p.oy + (e.clientY - p.y) * s);
  }

  function onBgPointerUp() {
    panState.current = null;
    setPanning(false);
  }

  const spring = reduce
    ? { duration: 0.001 }
    : ({ type: "spring", stiffness: 120, damping: 22, mass: 0.8 } as const);

  const edgeList = useMemo(
    () =>
      EDGES.map(([a, b], i) => ({
        a,
        b,
        i,
        key: `${a}-${b}`,
      })),
    [],
  );

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      onPointerDown={onBgPointerDown}
      onPointerMove={onBgPointerMove}
      onPointerUp={onBgPointerUp}
      onPointerCancel={onBgPointerUp}
      style={{
        cursor: full ? (panning ? "grabbing" : "grab") : undefined,
        touchAction: "pan-y",
      }}

    >
      <defs>
        <radialGradient id="pb-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.78 0.11 190)" stopOpacity="0.26" />
          <stop offset="100%" stopColor="oklch(0.78 0.11 190)" stopOpacity="0" />
        </radialGradient>
        <marker
          id="pb-arrow"
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L8 4 L0 8 z" fill="var(--teal)" />
        </marker>
      </defs>

      <motion.g
        style={{
          x: cameraX ?? panXSpring,
          y: cameraY ?? panYSpring,
          scale: cameraZoom ?? zoomSpring,
          originX: `${VIEW.cx}px`,
          originY: `${VIEW.cy}px`,
        }}
      >

        {/* edges */}
        <g>
          {edgeList.map((e) => (
            <Edge
              key={e.key}
              index={e.i}
              a={e.a}
              b={e.b}
              posOf={posOf}
              mode={mode}
              commit={commit}
              emphasis={Math.min(emphasis(e.a), emphasis(e.b))}
              directional={Boolean(active && (e.a === active || e.b === active))}
              reveal={reveal}
              spring={spring}
              visible={present(NODE_BY_ID[e.a]!) && present(NODE_BY_ID[e.b]!)}
            />
          ))}
        </g>

        {/* soft focus halo behind the active node */}
        {active && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, x: posOf(active).x, y: posOf(active).y }}
            transition={{ duration: reduce ? 0 : 0.4 }}
          >
            <circle cx={0} cy={0} r={78} fill="url(#pb-halo)" />
          </motion.g>
        )}


        {/* nodes */}
        <g>
          {NODES.map((n, i) => (
            <Node
              key={n.id}
              node={n}
              index={i}
              pos={posOf(n.id)}
              r={radiusOf(n)}
              fill={fillOf(n)}
              emphasis={emphasis(n.id)}
              visible={present(n)}
              label={mode === "temporal" ? labelAt(n, commit) : n.label}
              showLabel={labelVisible(n)}
              selected={selected === n.id}
              interactive={interactive}
              draggable={draggable}
              reveal={reveal}
              spring={spring}
              onHover={(id) => {
                onHover?.(id);
                setTip(id);
              }}
              onSelect={onSelect}
              onPointerDownNode={onNodePointerDown}
              onPointerMoveNode={onNodePointerMove}
              onPointerUpNode={onNodePointerUp}
            />
          ))}
        </g>

        {/* tooltip */}
        {interactive && tip && NODE_BY_ID[tip] && (
          <Tooltip
            node={NODE_BY_ID[tip]!}
            pos={posOf(tip)}
            mode={mode}
            commit={commit}
          />
        )}
      </motion.g>
    </svg>
  );
}

function Edge({
  a,
  b,
  index,
  posOf,
  mode,
  commit,
  emphasis,
  directional,
  reveal,
  spring,
  visible,
}: {
  a: string;
  b: string;
  index: number;
  posOf: (id: string) => { x: number; y: number };
  mode: GraphMode;
  commit: number;
  emphasis: number;
  directional: boolean;
  reveal?: MotionValue<number> | undefined;
  spring: object;
  visible: boolean;
}) {
  const pa = posOf(a);
  const pb = posOf(b);
  const na = NODE_BY_ID[a]!;
  const nb = NODE_BY_ID[b]!;
  const threshold = 0.04 + (index / EDGES.length) * 0.5;
  const fallback = useMotionValue(1);
  const revealOpacity = useTransform(
    reveal ?? fallback,
    [threshold, threshold + 0.08],
    [0, 1],
  );

  let stroke = "oklch(1 0 0 / 16%)";
  if (mode === "temporal") {
    const sa = statusAt(na, commit);
    const sb = statusAt(nb, commit);
    if (sa === "removed" || sb === "removed") stroke = "var(--danger)";
    else if (sa === "added" || sb === "added") stroke = "var(--success)";
  } else if (emphasis === 1 && directional) {
    stroke = "var(--teal)";
  }

  return (
    <motion.g style={{ opacity: revealOpacity }}>
      <motion.line
        animate={{
          x1: pa.x,
          y1: pa.y,
          x2: pb.x,
          y2: pb.y,
          opacity: visible ? emphasis * (mode === "temporal" ? 0.75 : 0.9) : 0,
          stroke,
        }}
        transition={spring}
        initial={false}
        x1={pa.x}
        y1={pa.y}
        x2={pb.x}
        y2={pb.y}
        strokeWidth={directional ? 1.5 : 1}
        markerEnd={directional && emphasis === 1 ? "url(#pb-arrow)" : ""}
      />
    </motion.g>
  );

}

function Node({
  node,
  index,
  pos,
  r,
  fill,
  emphasis,
  visible,
  label,
  showLabel,
  selected,
  interactive,
  draggable,
  reveal,
  spring,
  onHover,
  onSelect,
  onPointerDownNode,
  onPointerMoveNode,
  onPointerUpNode,
}: {
  node: DemoNode;
  index: number;
  pos: { x: number; y: number; depth: number };
  r: number;
  fill: string;
  emphasis: number;
  visible: boolean;
  label: string;
  showLabel: boolean;
  selected: boolean;
  interactive: boolean;
  draggable: boolean;
  reveal?: MotionValue<number> | undefined;
  spring: object;
  onHover?: ((id: string | null) => void) | undefined;
  onSelect?: ((id: string | null) => void) | undefined;
  onPointerDownNode: (e: React.PointerEvent<SVGGElement>, id: string) => void;
  onPointerMoveNode: (e: React.PointerEvent<SVGGElement>) => void;
  onPointerUpNode: (e: React.PointerEvent<SVGGElement>) => void;
}) {
  const [hover, setHover] = useState(false);
  const threshold = (index / NODES.length) * 0.45;
  const fallback = useMotionValue(1);
  const revealOpacity = useTransform(
    reveal ?? fallback,
    [threshold, threshold + 0.06],
    [0, 1],
  );
  const scale = (hover && interactive ? 1.18 : 1) * (0.9 + pos.depth * 0.12);

  return (
    <motion.g style={{ opacity: revealOpacity }}>
      <motion.g
        data-node={node.id}
        initial={false}
        animate={{ x: pos.x, y: pos.y, opacity: visible ? emphasis : 0 }}
        transition={spring}
        onPointerEnter={interactive ? () => { setHover(true); onHover?.(node.id); } : undefined}
        onPointerLeave={interactive ? () => { setHover(false); onHover?.(null); } : undefined}
        onPointerDown={(e) => onPointerDownNode(e, node.id)}
        onPointerMove={onPointerMoveNode}
        onPointerUp={onPointerUpNode}
        onClick={interactive ? () => onSelect?.(selected ? null : node.id) : undefined}
        cursor={interactive ? (draggable ? "grab" : "pointer") : undefined}
        pointerEvents={visible && interactive ? "auto" : "none"}
      >
        <circle r={r + 12} fill="transparent" />
        <motion.circle
          initial={false}
          animate={{ r: r * scale, fill }}
          transition={spring}
          r={r}
          fill={fill}
        />
        <motion.circle
          initial={false}
          animate={{ opacity: selected ? 1 : 0, r: r + 7 }}
          transition={{ duration: 0.25 }}
          r={r + 7}
          fill="none"
          stroke="var(--teal)"
          strokeWidth={1.4}
          opacity={0}
        />
        <motion.text
          initial={false}
          animate={{ opacity: showLabel ? 0.95 : 0 }}
          transition={{ duration: 0.2 }}
          x={r + 8}
          y={4}
          fontSize={11.5}
          fontFamily="var(--font-mono-stack)"
          fill={selected || hover ? "var(--teal)" : "oklch(0.84 0 0)"}
        >
          {label}
        </motion.text>
      </motion.g>
    </motion.g>
  );

}

function Tooltip({
  node,
  pos,
  mode,
  commit,
}: {
  node: DemoNode;
  pos: { x: number; y: number };
  mode: GraphMode;
  commit: number;
}) {
  const rel = NEIGHBORS[node.id]?.length ?? 0;
  const line2 =
    mode === "temporal" ? temporalDescription(node, commit) : `${rel} direct relationships`;
  const w = Math.max(node.label.length, line2.length) * 6.4 + 20;
  const flip = pos.x + w + 26 > VIEW.w;
  const x = flip ? pos.x - w - 18 : pos.x + 18;
  const y = pos.y - 40;
  return (
    <motion.g
      initial={{ opacity: 0, y: y + 4 }}
      animate={{ opacity: 1, y }}
      transition={{ duration: 0.14 }}
      style={{ pointerEvents: "none" }}
      x={x}
    >
      <rect
        x={x}
        width={w}
        height={38}
        rx={5}
        fill="oklch(0.18 0 0 / 96%)"
        stroke="oklch(1 0 0 / 16%)"
      />
      <text x={x + 10} y={16} fontSize={11} fontFamily="var(--font-mono-stack)" fill="oklch(0.95 0 0)">
        {node.label}
      </text>
      <text x={x + 10} y={30} fontSize={10} fontFamily="var(--font-mono-stack)" fill="oklch(0.7 0 0)">
        {line2}
      </text>
    </motion.g>
  );
}

export { COMMITS };
