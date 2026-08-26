import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Reveal } from "./Reveal";

type Cap = "Editor" | "Terminal" | "Source Control" | "Runtime Preview" | "Extensions";
const CAPABILITIES: Cap[] = ["Editor", "Terminal", "Source Control", "Runtime Preview", "Extensions"];

export function IdeStrip() {
  const [active, setActive] = useState<Cap>("Editor");

  return (
    <section
      id="why"
      className="relative mt-24 border-y border-border bg-surface-1/40 py-16 sm:mt-32 sm:py-20"
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-center lg:gap-14">
        <div>
          <Reveal>
            <h2 className="text-[clamp(1.6rem,3vw,2.15rem)] font-medium">Still an IDE.</h2>
            <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">
              Edit, run commands, use source control, and preview local applications in the same
              Code-OSS-based workspace.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="mt-5 flex flex-wrap gap-2">
            {CAPABILITIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={active === c}
                onPointerEnter={() => setActive(c)}
                onFocus={() => setActive(c)}
                onClick={() => setActive(c)}
                className={
                  "min-h-11 cursor-pointer rounded-md border px-3.5 py-2 font-mono text-[12px] transition-colors duration-200 " +
                  (active === c
                    ? "border-teal/40 bg-teal/10 text-teal"
                    : "border-border bg-surface-2/60 text-muted-foreground hover:border-border-strong hover:text-foreground")
                }
              >
                {c}
              </button>
            ))}
          </Reveal>
        </div>

        <Reveal delay={0.12}>
          <div className="overflow-hidden rounded-xl border border-border bg-surface-1 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-2 border-b border-border bg-surface-2/60 px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
              <span className="size-2 rounded-full bg-surface-3" />
              <span className="size-2 rounded-full bg-surface-3" />
              <span>{active.toLowerCase()}</span>
            </div>
            <div className="relative h-[220px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="absolute inset-0"
                >
                  <Panel cap={active} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Panel({ cap }: { cap: Cap }) {
  if (cap === "Terminal") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 p-3 font-mono text-[11px] text-muted-foreground/70">
          <div>export function graphService() {"{"}</div>
          <div className="pl-4 text-foreground/70">return index.build();</div>
          <div>{"}"}</div>
        </div>
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="h-[104px] border-t border-border bg-background/70 p-3 font-mono text-[11px]"
        >
          <p className="text-muted-foreground">$ prebase index .</p>
          <p className="text-teal">indexed 1,284 files · 3,902 edges</p>
          <p className="text-muted-foreground">$ ▊</p>
        </motion.div>
      </div>
    );
  }
  if (cap === "Runtime Preview") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
          <span className="rounded border border-border bg-background/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            localhost:3000
          </span>
          <span className="font-mono text-[10px] text-teal">live</span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="h-3 w-1/3 rounded bg-surface-3" />
          <div className="h-2 w-2/3 rounded bg-surface-2" />
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="h-14 rounded border border-border bg-surface-2/70" />
            <div className="h-14 rounded border border-border bg-surface-2/70" />
            <div className="h-14 rounded border border-border bg-surface-2/70" />
          </div>
        </div>
      </div>
    );
  }
  if (cap === "Source Control") {
    return (
      <div className="grid h-full grid-cols-[150px_minmax(0,1fr)]">
        <div className="border-r border-border p-3 font-mono text-[11px]">
          <p className="pb-2 text-[10px] tracking-[0.14em] text-muted-foreground">CHANGES</p>
          <p className="text-success">+ temporalStore.ts</p>
          <p className="text-warning">~ graphService.ts</p>
          <p className="text-danger">- cache.ts</p>
        </div>
        <div className="p-3 font-mono text-[11px] text-muted-foreground">
          <p className="text-foreground/80">diff --git a/graphService.ts</p>
          <p className="text-success">+ const store = createTemporalStore()</p>
          <p className="text-danger">- const cache = createCache()</p>
        </div>
      </div>
    );
  }
  if (cap === "Extensions") {
    return (
      <div className="grid h-full grid-cols-2 gap-2 p-3 font-mono text-[11px]">
        {["eslint", "prettier", "gitlens", "vitest"].map((e) => (
          <div key={e} className="rounded border border-border bg-surface-2/60 p-2">
            <p className="text-foreground/85">{e}</p>
            <p className="text-[10px] text-muted-foreground">installed</p>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid h-full grid-cols-[36px_minmax(0,1fr)] font-mono text-[11px]">
      <div className="border-r border-border py-3 text-right text-[10px] text-muted-foreground/50">
        {[1, 2, 3, 4, 5, 6].map((l) => (
          <div key={l} className="pr-2 leading-5">
            {l}
          </div>
        ))}
      </div>
      <div className="py-3 pl-3 leading-5 text-muted-foreground/80">
        <div>
          <span className="text-info">import</span> {"{ parse }"} from{" "}
          <span className="text-teal">&apos;./parser&apos;</span>
        </div>
        <div className="mt-2">
          <span className="text-info">export function</span>{" "}
          <span className="text-foreground">buildGraph</span>(files) {"{"}
        </div>
        <div className="pl-4">const nodes = files.map(parse)</div>
        <div className="pl-4">return link(nodes)</div>
        <div>{"}"}</div>
      </div>
    </div>
  );
}
