import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DemoGraph, type GraphControlsApi, type GraphMode } from "@/components/graph/DemoGraph";
import { IdeFrame } from "@/components/ide/IdeFrame";
import { AgentsPanel } from "@/components/ide/AgentsPanel";
import {
  TemporalTimeline,
  TemporalToolbar,
  useCommitPlayer,
} from "@/components/ide/TemporalControls";
import { Reveal } from "@/components/Reveal";
import {
  COMMITS,
  LAYOUTS,
  NEIGHBORS,
  NODE_BY_ID,
  contextFor,
  diffCounts,
  temporalDescription,
  type LayoutMode,
} from "@/lib/demo-graph";

export function Playground() {
  const [mode, setMode] = useState<GraphMode>("network");
  const [layout, setLayout] = useState<LayoutMode>("organic");
  const [selected, setSelected] = useState<string | null>("graph");
  const [hovered, setHovered] = useState<string | null>(null);
  const [commit, setCommit] = useState(COMMITS.length - 1);
  const [focusChanges, setFocusChanges] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [contextIds, setContextIds] = useState<string[] | null>(null);
  const controls = useRef<GraphControlsApi | null>(null);

  const stop = useCallback(() => setPlaying(false), []);
  const pickCommit = useCallback((i: number) => {
    setPlaying(false);
    setCommit(i);
  }, []);
  useCommitPlayer(playing, commit, setCommit, stop);

  const node = selected ? NODE_BY_ID[selected] : undefined;
  const related = selected ? (NEIGHBORS[selected] ?? []) : [];
  const counts = diffCounts(commit);

  return (
    <section id="explore" className="relative mt-20 scroll-mt-24 sm:mt-24">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 xl:pl-[176px]">
        <Reveal>
          <span className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground">
            EXPLORE
          </span>
          <h2 className="mt-2 text-[clamp(1.6rem,3vw,2.25rem)] font-medium">Explore the map.</h2>
          <p className="mt-3 max-w-xl text-[15px] leading-[1.6] text-muted-foreground">
            Now take control. Change the layout, inspect relationships, move through history, and
            send graph context to an Agent.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-stretch">
          <IdeFrame
            agentsWide
            mode={mode}
            onModeChange={(m) => {
              setMode(m);
              setPlaying(false);
            }}
            selected={selected}
            hovered={hovered}
            onHoverFile={setHovered}
            onSelectFile={(id) => {
              setSelected(id);
              setContextIds(null);
            }}
            agents={
              <AgentsPanel
                contextIds={contextIds ?? (selected ? contextFor(selected) : null)}
                selected={selected}
                active={Boolean(contextIds)}
                chat
                variant="explore"
              />
            }
            toolbar={
              <TemporalToolbar
                commit={commit}
                focusChanges={focusChanges}
                onFocusChanges={setFocusChanges}
                visible={mode === "temporal"}
              />
            }
            timeline={
              <TemporalTimeline
                commit={commit}
                onCommit={pickCommit}
                playing={playing}
                onTogglePlay={() => setPlaying((v) => !v)}
                visible={mode === "temporal"}
              />
            }
            statusLeft="Interactive PreBase model"
            statusRight={
              mode === "temporal"
                ? `${COMMITS[commit]?.label} · +${counts.added} -${counts.removed} ~${counts.modified} ⇄${counts.renamed}`
                : layout
            }
            parallax={false}
            className="min-h-[520px] lg:min-h-[560px]"
            graphClassName="min-h-[300px]"
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
              onSelect={(id) => {
                setSelected(id);
                setContextIds(null);
              }}
              agentContext={contextIds}
              interactionMode="full"

              controlsRef={controls}
            />
            <div className="pointer-events-auto absolute bottom-2 right-2 flex gap-1">
              {[
                { label: "+", title: "Zoom in", fn: () => controls.current?.zoomIn() },
                { label: "−", title: "Zoom out", fn: () => controls.current?.zoomOut() },
                { label: "⤢", title: "Fit graph", fn: () => controls.current?.fit() },
                { label: "⟲", title: "Reset graph", fn: () => controls.current?.reset() },
              ].map((b) => (
                <button
                  key={b.title}
                  type="button"
                  aria-label={b.title}
                  title={b.title}
                  onClick={b.fn}
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded border border-border bg-surface-2/90 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground active:translate-y-px"
                >
                  {b.label}
                </button>
              ))}
            </div>
          </IdeFrame>

          {/* controls + details */}
          <div className="grid gap-3 sm:grid-cols-2 sm:items-start lg:grid-cols-1">
            <div className="rounded-xl border border-border bg-surface-1 p-3">

              <p className="text-[10px] tracking-[0.14em] text-muted-foreground">LAYOUT</p>
              <div
                role="group"
                aria-label="Network layout"
                className="mt-2 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible"
              >
                {LAYOUTS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={layout === l}
                    onClick={() => setLayout(l)}
                    className={
                      "min-h-11 shrink-0 cursor-pointer rounded-md border px-3 py-2 font-mono text-[11px] capitalize transition-colors duration-150 " +
                      (layout === l
                        ? "border-teal/40 bg-teal/10 text-teal"
                        : "border-border bg-surface-2/60 text-muted-foreground hover:border-border-strong hover:text-foreground")
                    }
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-[190px] rounded-xl border border-border bg-surface-1 p-3">
              <p className="text-[10px] tracking-[0.14em] text-muted-foreground">DETAILS</p>
              <AnimatePresence mode="wait">
                {node ? (
                  <motion.div
                    key={node.id + mode + commit}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2"
                  >
                    <p className="font-mono text-sm text-foreground">{node.label}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{node.path}</p>
                    <p className="mt-2 font-mono text-[11px] text-teal">
                      {mode === "temporal"
                        ? temporalDescription(node, commit)
                        : `${related.length} relationships`}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {related.slice(0, 5).map((id) => (
                        <li key={id}>
                          <button
                            type="button"
                            onClick={() => setSelected(id)}
                            onPointerEnter={() => setHovered(id)}
                            onPointerLeave={() => setHovered(null)}
                            className="w-full cursor-pointer rounded px-1.5 py-1 text-left font-mono text-[11px] text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                          >
                            {NODE_BY_ID[id]?.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => setContextIds(contextIds ? null : contextFor(node.id))}
                      className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-md border border-teal/35 bg-teal/10 px-3 text-[12px] text-teal transition-colors hover:bg-teal/15"
                    >
                      {contextIds ? "Context added ✓" : "Use as Agent context"}
                    </button>
                  </motion.div>
                ) : (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 text-[13px] text-muted-foreground"
                  >
                    Select a node in the graph or the explorer to inspect its relationships.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <p className="font-mono text-[10px] text-muted-foreground/70 sm:col-span-2 lg:col-span-1">
              Interactive PreBase model · illustrative data
            </p>

          </div>
        </div>
      </div>
    </section>
  );
}
