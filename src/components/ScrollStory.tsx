import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DemoGraph, type GraphMode } from "@/components/graph/DemoGraph";
import { IdeFrame } from "@/components/ide/IdeFrame";
import { AgentsPanel } from "@/components/ide/AgentsPanel";
import { TemporalTimeline, TemporalToolbar } from "@/components/ide/TemporalControls";
import { COMMITS, VIEW, contextFor, diffCounts, type LayoutMode } from "@/lib/demo-graph";

const CHAPTERS = [
  {
    n: "01",
    nav: "Map",
    title: "Files are only the surface.",
    body: "Repositories are connected systems. PreBase turns the tree into a map.",
  },
  {
    n: "02",
    nav: "Relationships",
    title: "Follow the relationships.",
    body: "Dependencies, clusters, and the paths between them — walked, not guessed.",
  },
  {
    n: "03",
    nav: "Time",
    title: "See change over time.",
    body: "Move through Git history and watch the structure itself change.",
  },
  {
    n: "04",
    nav: "Context",
    title: "Work with context.",
    body: "Give Agents the same relationships you can see, then ask them anything.",
  },
];

const BOUNDS = [0, 0.24, 0.5, 0.76, 1];

/* ------------------------------------------------------------------ */
/* Camera keyframes — deliberate, restrained framing of the graph.     */
/* ------------------------------------------------------------------ */

const KEY_P = [0, 0.16, 0.3, 0.4, 0.48, 0.56, 0.68, 0.8, 0.9, 1];
const KEY_ZOOM = [0.95, 0.98, 1.22, 1.2, 1.18, 1.02, 1.12, 1.2, 1.2, 1.0];
const KEY_FX = [400, 400, 400, 326, 470, 400, 380, 400, 400, 400];
const KEY_FY = [226, 226, 240, 312, 396, 260, 380, 250, 250, 226];
/** extra left bias so the Agents panel has breathing room in the last chapter */
const KEY_BIAS = [0, 0, 0, 0, 0, 0, 0, -46, -46, 0];

const KEY_X = KEY_FX.map((fx, i) => (VIEW.cx - fx) * KEY_ZOOM[i]! + KEY_BIAS[i]!);
const KEY_Y = KEY_FY.map((fy, i) => (VIEW.cy - fy) * KEY_ZOOM[i]!);

export function ScrollStory() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const p = useSpring(
    scrollYProgress,
    reduce ? { duration: 0.001 } : { stiffness: 220, damping: 40, mass: 0.4 },
  );

  // Continuous drivers
  const reveal = useTransform(p, [0.01, 0.15], [0, 1]);
  const cueOpacity = useTransform(p, [0, 0.02, 0.055], [1, 1, 0]);

  const camSpring = reduce ? { duration: 0.001 } : { stiffness: 80, damping: 22, mass: 0.5 };
  const cameraZoom = useSpring(useTransform(p, KEY_P, KEY_ZOOM), camSpring);
  const cameraX = useSpring(useTransform(p, KEY_P, KEY_X), camSpring);
  const cameraY = useSpring(useTransform(p, KEY_P, KEY_Y), camSpring);

  // Quantised chapter state
  const [chapter, setChapter] = useState(0);
  const [storyMode, setStoryMode] = useState<GraphMode>("network");
  const [layout, setLayout] = useState<LayoutMode>("organic");
  const [commit, setCommit] = useState(0);
  const [focusChanges, setFocusChanges] = useState(false);
  const [agentOn, setAgentOn] = useState(false);

  // Manual overrides: respected while the visitor stays in the same chapter.
  const [override, setOverride] = useState<{ chapter: number; mode: GraphMode } | null>(null);
  const [userSelected, setUserSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useMotionValueEvent(p, "change", (v) => {
    const ch = v < BOUNDS[1]! ? 0 : v < BOUNDS[2]! ? 1 : v < BOUNDS[3]! ? 2 : 3;
    setChapter((c) => (c === ch ? c : ch));
    setLayout((l) => {
      const next: LayoutMode = v < 0.34 ? "organic" : "constellation";
      return l === next ? l : next;
    });
    setStoryMode((m) => {
      const next: GraphMode = v >= 0.56 && v < 0.78 ? "temporal" : "network";
      return m === next ? m : next;
    });
    const c = Math.max(
      0,
      Math.min(COMMITS.length - 1, Math.floor(((v - 0.57) / 0.2) * COMMITS.length)),
    );
    setCommit((prev) => (prev === c ? prev : c));
    setFocusChanges((f) => {
      const next = v > 0.66 && v < 0.75;
      return f === next ? f : next;
    });
    setAgentOn((a) => {
      const next = v >= 0.78;
      return a === next ? a : next;
    });
  });

  // Crossing into a genuinely new chapter reconciles the manual mode override.
  useEffect(() => {
    setOverride((o) => (o && o.chapter !== chapter ? null : o));
  }, [chapter]);

  const mode = override && override.chapter === chapter ? override.mode : storyMode;
  const temporal = mode === "temporal";

  // Manual selection wins; otherwise the Context chapter picks a sensible default.
  const selected = userSelected ?? (agentOn ? "graph" : null);
  const context = selected ? contextFor(selected) : null;
  const counts = diffCounts(commit);

  const agentPanel = (
    <AgentsPanel
      contextIds={agentOn || userSelected ? context : null}
      selected={selected}
      active={Boolean(selected)}
      compact
      chat
    />
  );

  return (
    <section id="product" ref={ref} className="relative mt-16 h-[420vh] sm:mt-20 lg:h-[520vh]">
      <div className="sticky top-16 flex h-[calc(100svh-5rem)] flex-col justify-center lg:top-20 lg:h-[calc(100vh-6rem)]">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_270px] lg:items-center lg:gap-8">
          {/* product canvas */}
          <div className="order-2 h-[44svh] min-h-[280px] sm:h-[52svh] lg:order-1 lg:h-[min(64vh,560px)]">
            <IdeFrame
              className="h-full"
              mode={mode}
              onModeChange={(m) => setOverride({ chapter, mode: m })}
              explorerDim={chapter === 0 ? 0 : 1}
              selected={selected}
              hovered={hovered}
              onHoverFile={setHovered}
              onSelectFile={(id) => setUserSelected(id)}
              agents={chapter >= 3 ? agentPanel : undefined}
              toolbar={<TemporalToolbar commit={commit} focusChanges={focusChanges} visible={temporal} />}
              timeline={<TemporalTimeline commit={commit} visible={temporal} />}
              statusLeft={`22 nodes · 23 edges`}
              statusRight={
                temporal
                  ? `${COMMITS[commit]?.label} · +${counts.added} -${counts.removed} ~${counts.modified}`
                  : selected
                    ? "context ready"
                    : "indexed"
              }
            >
              <DemoGraph
                className="absolute inset-0 size-full"
                mode={mode}
                layout={layout}
                commit={commit}
                focusChanges={focusChanges}
                selected={selected}
                hovered={hovered}
                onHover={setHovered}
                onSelect={setUserSelected}
                agentContext={chapter >= 3 && context ? context : null}
                interactionMode="select"
                reveal={reveal}
                cameraZoom={cameraZoom}
                cameraX={cameraX}
                cameraY={cameraY}
                labelAll={false}
              />
            </IdeFrame>
          </div>

          {/* chapter copy */}
          <div className="relative order-1 h-[132px] sm:h-[150px] lg:order-2 lg:h-[300px]">
            {CHAPTERS.map((c, i) => (
              <ChapterCopy key={c.n} chapter={c} index={i} progress={p} />
            ))}
          </div>

          {/* mobile / narrow agents panel — appears at the Context chapter */}
          {chapter >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="order-3 max-h-[38svh] overflow-hidden rounded-xl border border-border bg-surface-1 p-3 lg:hidden"
            >
              {agentPanel}
            </motion.div>
          )}
        </div>

        {/* scroll affordance */}
        <motion.div
          style={{ opacity: cueOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-3 flex flex-col items-center gap-1 text-muted-foreground"
          aria-hidden="true"
        >
          <span className="font-mono text-[10px] tracking-[0.18em]">SCROLL TO EXPLORE</span>
          <motion.span
            animate={reduce ? {} : { y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="text-teal"
          >
            ⌄
          </motion.span>
        </motion.div>

        {/* chapter rail, desktop only */}
        <nav
          aria-label="Story progress"
          className="pointer-events-none absolute left-4 top-1/2 hidden -translate-y-1/2 flex-col gap-3 xl:flex"
        >
          {CHAPTERS.map((c, i) => (
            <span
              key={c.n}
              className={
                "flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] transition-colors duration-300 " +
                (chapter === i ? "text-teal" : "text-muted-foreground/40")
              }
            >
              <span
                className={
                  "inline-block h-px transition-all duration-300 " +
                  (chapter === i ? "w-4 bg-teal" : "w-2 bg-muted-foreground/30")
                }
              />
              {c.n} {c.nav.toUpperCase()}
            </span>
          ))}
        </nav>
      </div>
    </section>
  );
}

function ChapterCopy({
  chapter,
  index,
  progress,
}: {
  chapter: (typeof CHAPTERS)[number];
  index: number;
  progress: import("motion/react").MotionValue<number>;
}) {
  const start = BOUNDS[index]!;
  const end = BOUNDS[index + 1]!;
  const pad = 0.045;
  const opacity = useTransform(
    progress,
    [start - pad, start + pad * 0.4, end - pad, end - pad * 0.4],
    [0, 1, 1, 0],
  );
  const y = useTransform(progress, [start - pad, end], [16, -16]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 flex flex-col justify-center"
    >
      <span className="font-mono text-[11px] tracking-[0.18em] text-teal">{chapter.n}</span>
      <h2 className="mt-2 text-xl font-medium sm:text-2xl">{chapter.title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{chapter.body}</p>
    </motion.div>
  );
}
