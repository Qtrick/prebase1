import {
  AnimatePresence,
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
import {
  TemporalLegend,
  TemporalTimeline,
  TemporalToolbar,
} from "@/components/ide/TemporalControls";
import { COMMITS, VIEW, contextFor, diffCounts, type LayoutMode } from "@/lib/demo-graph";
import { STORY_BOUNDS, useJourneyJump } from "@/lib/journey";

/**
 * The guided story is a single state machine driven exclusively by scroll.
 * `chapter` is the one authoritative value: graph mode, toolbar, timeline and
 * the mode indicator are all derived from it, so they can never disagree.
 */
type Group = "network" | "temporal";

const CHAPTERS: Array<{
  n: string;
  nav: string;
  group: Group;
  title: string;
  body: string;
}> = [
  {
    n: "01",
    nav: "Map",
    group: "network",
    title: "See the system behind the files.",
    body: "PreBase maps how files and modules connect, so you can understand the repository as a system instead of reconstructing it one file at a time.",
  },
  {
    n: "02",
    nav: "Relationships",
    group: "network",
    title: "Trace what connects.",
    body: "Select a node to see the files around it and trace the paths that connect them.",
  },
  {
    n: "03",
    nav: "Context",
    group: "network",
    title: "Give agents the same context.",
    body: "Select a file and PreBase can include its connected modules as context for questions, edits, and larger tasks.",
  },
  {
    n: "04",
    nav: "History",
    group: "temporal",
    title: "See how the codebase changes over time.",
    body: "Move through Git history as structural snapshots. See files and relationships added, removed, modified, or renamed without losing the surrounding codebase.",
  },
  {
    n: "05",
    nav: "Change",
    group: "temporal",
    title: "See where a change landed.",
    body: "Watch the codebase structure evolve from commit to commit instead of reconstructing the impact from a Git log.",
  },
];

const BOUNDS = STORY_BOUNDS;
/** The single Network → Temporal boundary. */
const TEMPORAL_START = BOUNDS[3]!;

/* ------------------------------------------------------------------ */
/* Camera keyframes — deliberate, restrained framing of the graph.     */
/* ------------------------------------------------------------------ */

const KEY_P = [0, 0.1, 0.28, 0.38, 0.47, 0.57, 0.68, 0.9, 1];
/** Zoom out through the Context chapter so the Agents panel never covers nodes. */
const KEY_ZOOM = [1, 1, 1, 0.78, 0.78, 0.85, 1.16, 1.18, 1.18];
const KEY_FX = [400, 400, 400, 400, 400, 400, 400, 400, 400];
const KEY_FY = [226, 226, 226, 226, 226, 235, 252, 256, 256];
/** extra left bias so the Agents panel has breathing room in the Context chapter */
const KEY_BIAS = [0, 0, 0, -150, -155, -150, 0, 0, 0];

/** Hard camera bounds — nodes can never drift toward or past the canvas edge. */
const MAX_PAN_X = 170;
const MAX_PAN_Y = 70;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const KEY_X = KEY_FX.map((fx, i) =>
  clamp((VIEW.cx - fx) * KEY_ZOOM[i]! + KEY_BIAS[i]!, -MAX_PAN_X, MAX_PAN_X),
);
const KEY_Y = KEY_FY.map((fy, i) =>
  clamp((VIEW.cy - fy) * KEY_ZOOM[i]!, -MAX_PAN_Y, MAX_PAN_Y),
);


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

  const reveal = useTransform(p, [0.01, 0.15], [0, 1]);
  const cueOpacity = useTransform(p, [0, 0.02, 0.055], [1, 1, 0]);

  // Scroll-linked product entrance: the frame resolves as the section enters
  // the viewport and recedes again on the way back up. Reversible by design.
  const { scrollYProgress: entry } = useScroll({
    target: ref,
    offset: ["start end", "start 15%"],
  });
  const entryOpacity = useTransform(entry, [0.25, 0.85], [0, 1]);
  const entryY = useTransform(entry, [0.25, 0.9], [reduce ? 0 : 24, 0]);
  const entryScale = useTransform(entry, [0.25, 0.9], [reduce ? 1 : 0.985, 1]);

  const camSpring = reduce ? { duration: 0.001 } : { stiffness: 80, damping: 22, mass: 0.5 };
  const zoomTarget = useTransform(p, KEY_P, KEY_ZOOM);
  const xTarget = useTransform(p, KEY_P, KEY_X);
  const yTarget = useTransform(p, KEY_P, KEY_Y);
  const cameraZoom = useSpring(zoomTarget, camSpring);
  const cameraX = useSpring(xTarget, camSpring);
  const cameraY = useSpring(yTarget, camSpring);

  // A rail jump lands the page directly on the target chapter; snap the springs
  // so the camera and story progress arrive with it instead of easing through
  // every chapter in between.
  useJourneyJump(() => {
    p.jump(scrollYProgress.get());
    cameraZoom.jump(zoomTarget.get());
    cameraX.jump(xTarget.get());
    cameraY.jump(yTarget.get());
  });

  // Quantised story state — everything else is derived from these.
  const [chapter, setChapter] = useState(0);
  const [commit, setCommit] = useState(0);
  const [focusChanges, setFocusChanges] = useState(false);
  const [userSelected, setUserSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useMotionValueEvent(p, "change", (v) => {
    let ch = 0;
    for (let i = 1; i < BOUNDS.length; i++) if (v >= BOUNDS[i]!) ch = i;
    ch = Math.min(ch, CHAPTERS.length - 1);
    setChapter((c) => (c === ch ? c : ch));

    const t = (v - (TEMPORAL_START + 0.03)) / 0.34;
    const c = clamp(Math.floor(t * COMMITS.length), 0, COMMITS.length - 1);
    setCommit((prev) => (prev === c ? prev : c));

    setFocusChanges((f) => {
      const next = v > 0.87;
      return f === next ? f : next;
    });
  });


  /* ---- single source of truth ------------------------------------- */

  const group: Group = CHAPTERS[chapter]!.group;
  const mode: GraphMode = group === "temporal" ? "temporal" : "network";
  const temporal = mode === "temporal";
  // Spatial continuity: one settled layout for the whole guided story, so nodes
  // never re-flow mid-scroll and stay exactly where the visitor last saw them.
  const layout: LayoutMode = "constellation";
  const agentOn = chapter === 2;


  const selected = userSelected ?? (agentOn ? "graph" : null);
  const context = agentOn && selected ? contextFor(selected) : null;
  const counts = diffCounts(commit);

  const agentPanel = (
    <AgentsPanel
      contextIds={context}
      selected={selected}
      active={Boolean(selected)}
      compact
      chat
    />
  );

  return (
    <section id="product" ref={ref} className="relative mt-16 h-[520vh] sm:mt-20 lg:h-[620vh]">
      <div className="sticky top-16 flex h-[calc(100svh-5rem)] flex-col justify-center lg:top-20 lg:h-[calc(100vh-6rem)]">
        <div className="mx-auto grid w-full max-w-[1240px] gap-4 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center lg:gap-10 lg:pr-10 xl:pl-[176px]">
          {/* product canvas */}
          <motion.div
            style={{ opacity: entryOpacity, y: entryY, scale: entryScale }}
            className="order-2 h-[58svh] min-h-[360px] sm:h-[56svh] lg:order-1 lg:h-[min(64vh,560px)]"
          >
            <IdeFrame
              className="h-full"
              mode={mode}
              explorerDim={chapter === 0 ? 0 : 1}
              selected={selected}
              hovered={hovered}
              onHoverFile={setHovered}
              onSelectFile={(id) => setUserSelected(id)}
              agents={agentPanel}
              agentsOpen={agentOn}
              toolbar={<TemporalToolbar commit={commit} focusChanges={focusChanges} visible={temporal} />}
              timeline={
                <>
                  <TemporalLegend visible={temporal} />
                  <TemporalTimeline commit={commit} visible={temporal} />
                </>
              }
              statusLeft={`22 nodes · 23 edges`}
              statusRight={
                temporal
                  ? `${COMMITS[commit]?.label} · +${counts.added} -${counts.removed} ~${counts.modified} ⇄${counts.renamed}`
                  : selected
                    ? "context ready"
                    : "indexed"
              }
              parallax={false}
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
                agentContext={context}
                interactionMode="select"
                reveal={reveal}
                cameraZoom={cameraZoom}
                cameraX={cameraX}
                cameraY={cameraY}
                labelAll={false}
              />
            </IdeFrame>
          </motion.div>

          {/* chapter copy */}
          <div className="relative order-1 h-[150px] sm:h-[164px] lg:order-2 lg:h-[320px]">
            {CHAPTERS.map((c, i) => (
              <ChapterCopy key={c.n} chapter={c} index={i} progress={p} />
            ))}
          </div>

          {/* mobile / narrow agents panel — appears at the Context chapter */}
          {agentOn && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="order-3 max-h-[38svh] overflow-hidden rounded-xl border border-border bg-surface-1 p-3.5 sm:hidden"
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
  const pad = 0.035;
  const opacity = useTransform(
    progress,
    [start - pad, start + pad * 0.4, end - pad, end - pad * 0.4],
    [0, 1, 1, 0],
  );
  const y = useTransform(progress, [start - pad, end], [16, -16]);

  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex flex-col justify-center">
      <span className="font-mono text-[11px] tracking-[0.18em] text-teal">
        {chapter.n} · {chapter.group === "temporal" ? "TEMPORAL GRAPH" : "NETWORK GRAPH"}
      </span>
      <h2 className="mt-2 text-xl font-medium sm:text-2xl">{chapter.title}</h2>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
        {chapter.body}
      </p>
    </motion.div>
  );
}
