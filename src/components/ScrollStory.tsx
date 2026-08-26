import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";
import { DemoGraph, type GraphMode } from "@/components/graph/DemoGraph";
import { IdeFrame } from "@/components/ide/IdeFrame";
import { AgentsPanel } from "@/components/ide/AgentsPanel";
import { TemporalTimeline, TemporalToolbar } from "@/components/ide/TemporalControls";
import { COMMITS, contextFor, diffCounts, type LayoutMode } from "@/lib/demo-graph";

const CHAPTERS = [
  {
    n: "01",
    nav: "Map",
    title: "Files are only the surface.",
    body: "Repositories are connected systems. PreBase turns the tree into a map.",
  },
  {
    n: "02",
    nav: "Explore",
    title: "See the relationships.",
    body: "Files, dependencies, clusters, and the paths between them.",
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
    body: "Give Agents the same relationships you can see.",
  },
];

const BOUNDS = [0, 0.2, 0.43, 0.72, 1];

export function ScrollStory() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const p = useSpring(scrollYProgress, reduce ? { duration: 0.001 } : { stiffness: 220, damping: 40, mass: 0.4 });

  // Continuous drivers
  const reveal = useTransform(p, [0.01, 0.19], [0, 1]);
  const explorerDim = useTransform(p, [0.05, 0.28], [0, 1]);
  const zoomRaw = useTransform(p, [0.2, 0.45, 0.75, 1], [1, 1.1, 1.04, 1.16]);
  const cameraZoom = useSpring(zoomRaw, reduce ? { duration: 0.001 } : { stiffness: 90, damping: 24 });

  // Quantised chapter state
  const [chapter, setChapter] = useState(0);
  const [mode, setMode] = useState<GraphMode>("network");
  const [layout, setLayout] = useState<LayoutMode>("organic");
  const [commit, setCommit] = useState(0);
  const [focusChanges, setFocusChanges] = useState(false);
  const [agentOn, setAgentOn] = useState(false);

  useMotionValueEvent(p, "change", (v) => {
    const ch = v < BOUNDS[1]! ? 0 : v < BOUNDS[2]! ? 1 : v < BOUNDS[3]! ? 2 : 3;
    setChapter((c) => (c === ch ? c : ch));
    setLayout((l) => {
      const next: LayoutMode = v < 0.31 ? "organic" : "constellation";
      return l === next ? l : next;
    });
    setMode((m) => {
      const next: GraphMode = v >= 0.46 ? "temporal" : "network";
      return m === next ? m : next;
    });
    const c = Math.max(
      0,
      Math.min(COMMITS.length - 1, Math.floor(((v - 0.47) / 0.22) * COMMITS.length)),
    );
    setCommit((prev) => (prev === c ? prev : c));
    setFocusChanges((f) => {
      const next = v > 0.6 && v < 0.72;
      return f === next ? f : next;
    });
    setAgentOn((a) => {
      const next = v >= 0.76;
      return a === next ? a : next;
    });
  });

  const temporal = mode === "temporal";
  const context = agentOn ? contextFor("graph") : null;
  const counts = diffCounts(commit);

  return (
    <section id="product" ref={ref} className="relative mt-24 h-[340vh] sm:mt-32 lg:h-[420vh]">
      <div className="sticky top-16 flex h-[calc(100svh-5rem)] flex-col justify-center lg:top-20 lg:h-[calc(100vh-6rem)]">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center lg:gap-10">
          {/* product canvas */}
          <div className="order-2 min-h-0 lg:order-1 lg:h-[min(64vh,560px)]">
            <IdeFrame
              className="h-full"
              mode={mode}
              explorerDim={explorerDimValue(chapter)}
              selected={agentOn ? "graph" : null}
              agents={
                chapter >= 3 ? (
                  <AgentsPanel contextIds={context} selected={agentOn ? "graph" : null} active={agentOn} compact />
                ) : undefined
              }
              toolbar={<TemporalToolbar commit={commit} focusChanges={focusChanges} visible={temporal} />}
              timeline={<TemporalTimeline commit={commit} visible={temporal} />}
              statusLeft={`22 nodes · 23 edges`}
              statusRight={
                temporal
                  ? `${COMMITS[commit]?.label} · +${counts.added} -${counts.removed} ~${counts.modified}`
                  : agentOn
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
                selected={agentOn ? "graph" : null}
                agentContext={context}
                reveal={chapter === 0 ? reveal : undefined}
                cameraZoom={cameraZoom}
                labelAll={false}
              />
            </IdeFrame>
          </div>

          {/* chapter copy */}
          <div className="relative order-1 lg:order-2 lg:h-[300px]">
            {CHAPTERS.map((c, i) => (
              <ChapterCopy key={c.n} chapter={c} index={i} progress={p} />
            ))}
          </div>
        </div>

        {/* chapter indicator, desktop only */}
        <nav
          aria-label="Story progress"
          className="pointer-events-none absolute left-4 top-1/2 hidden -translate-y-1/2 flex-col gap-3 xl:flex"
        >
          {CHAPTERS.map((c, i) => (
            <span
              key={c.n}
              className={
                "font-mono text-[10px] tracking-[0.16em] transition-colors duration-300 " +
                (chapter === i ? "text-teal" : "text-muted-foreground/40")
              }
            >
              {c.n} {c.nav.toUpperCase()}
            </span>
          ))}
        </nav>
      </div>
    </section>
  );
}

function explorerDimValue(chapter: number) {
  return chapter === 0 ? 0 : 1;
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
      className="lg:absolute lg:inset-x-0 lg:top-1/2 lg:-translate-y-1/2"
      aria-hidden={false}
    >
      <span className="font-mono text-[11px] tracking-[0.18em] text-teal">{chapter.n}</span>
      <h2 className="mt-2 text-xl font-medium sm:text-2xl">{chapter.title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{chapter.body}</p>
    </motion.div>
  );
}
