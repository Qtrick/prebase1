import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { PRODUCT_JOURNEY, WORKBENCH_BOUNDS, scrollToStep } from "@/lib/journey";

/**
 * "Still an IDE." — the workbench story.
 *
 * One sticky workbench shell. Scroll owns the active capability; the tab strip
 * navigates by scrolling to a chapter's real story position, so the tab state
 * is always derived from scroll rather than set independently.
 */

type Cap = "Editor" | "Terminal" | "Source Control" | "Runtime Preview" | "Extensions";

const CAPS: Array<{ n: string; cap: Cap; title: string; body: string; meta: string }> = [
  {
    n: "07",
    cap: "Editor",
    title: "Move from the map into the code.",
    body: "Open a node from the Code Graph and work in the corresponding file without leaving the workspace. The structural context that helped you find the code stays part of the same PreBase session.",
    meta: "Code-OSS editor · graph-to-file navigation",
  },
  {
    n: "08",
    cap: "Terminal",
    title: "Run what you're building.",
    body: "Use the integrated terminal for development servers, tests, build commands, and project tasks while the rest of the workspace stays in context.",
    meta: "Integrated shell · project tasks · test output",
  },
  {
    n: "09",
    cap: "Source Control",
    title: "Review the change in context.",
    body: "Inspect modified files and diffs without leaving the environment where PreBase already understands the surrounding system.",
    meta: "Git state · file diffs · repository context",
  },
  {
    n: "10",
    cap: "Runtime Preview",
    title: "Test what actually runs.",
    body: "Preview supported local web applications directly in the workspace and inspect responsive states without switching to another tool.",
    meta: "Web runtime · Electron runtime · Agent evidence",
  },
  {
    n: "11",
    cap: "Extensions",
    title: "Keep the tools around the workflow.",
    body: "PreBase is built on the Code-OSS workbench, so familiar development extensions remain part of the environment instead of forcing a separate toolchain.",
    meta: "Code-OSS extension model",
  },
];

const CAP_LIST: Cap[] = CAPS.map((c) => c.cap);
const BOUNDS = WORKBENCH_BOUNDS;
const WORKBENCH_STEPS = PRODUCT_JOURNEY.filter((s) => s.section === "why");
/** inside the Runtime chapter, where the web preview hands over to desktop */
const DESKTOP_START = 0.62;

export function IdeStory() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const [chapter, setChapter] = useState(0);
  /** 0 = web runtime, 1..4 = desktop evidence steps */
  const [desktopStep, setDesktopStep] = useState(-1);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    let ch = 0;
    for (let i = 1; i < BOUNDS.length; i++) if (v >= BOUNDS[i]!) ch = i;
    ch = Math.min(ch, CAPS.length - 1);
    setChapter((c) => (c === ch ? c : ch));

    // desktop sub-stage only exists inside the Runtime chapter
    let step = -1;
    if (ch === 3 && v >= DESKTOP_START) {
      step = Math.min(4, Math.floor(((v - DESKTOP_START) / (BOUNDS[4]! - DESKTOP_START)) * 5));
    }
    setDesktopStep((s) => (s === step ? s : step));
  });

  const active = CAPS[chapter]!;
  const desktop = chapter === 3 && desktopStep >= 0;
  const fade = { duration: reduce ? 0.15 : 0.35, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <section
      id="why"
      ref={ref}
      className="relative mt-28 h-[300vh] sm:mt-36 lg:h-[360vh]"
    >
      <div className="sticky top-16 flex h-[calc(100svh-5rem)] flex-col justify-center lg:top-20 lg:h-[calc(100vh-6rem)]">
        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 xl:pl-[176px]">
          <header className="flex flex-col gap-4 pb-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <div className="min-w-0">
              <span className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground">
                THE WORKBENCH
              </span>
              <h2 className="mt-2 text-[clamp(1.6rem,3vw,2.25rem)] font-medium">Still an IDE.</h2>
              <p className="mt-3 max-w-xl text-[15px] leading-[1.6] text-muted-foreground">
                PreBase is built on the Code-OSS workbench. The map isn&apos;t a companion window or
                a separate analysis tool — it lives inside the environment where you edit code, run
                the project, review changes, test applications, and work with agents.
              </p>
            </div>
            <CapabilityStrip active={active.cap} />
          </header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:gap-10">
            {/* sticky IDE surface */}
            <div className="order-2 h-[42svh] min-h-[260px] overflow-hidden rounded-xl border border-border bg-surface-1 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] sm:h-[48svh] lg:order-1 lg:h-[min(56vh,470px)]">
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface-2/70 px-3 py-2 font-mono text-[10px] text-muted-foreground">
                  <span className="size-2.5 rounded-full bg-surface-3" />
                  <span className="size-2.5 rounded-full bg-surface-3" />
                  <span className="size-2.5 rounded-full bg-surface-3" />
                  <span className="ml-1 truncate">
                    prebase — {desktop ? "desktop runtime" : active.cap.toLowerCase()}
                  </span>
                </div>
                <div className="relative min-h-0 flex-1">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={desktop ? "desktop" : active.cap}
                      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: reduce ? 0 : -8 }}
                      transition={fade}
                      className="absolute inset-0"
                    >
                      {chapter === 0 && <EditorPane />}
                      {chapter === 1 && <TerminalPane reduce={Boolean(reduce)} />}
                      {chapter === 2 && <SourceControlPane />}
                      {chapter === 3 &&
                        (desktop ? <DesktopRuntime step={desktopStep} /> : <WebRuntime />)}
                      {chapter === 4 && <ExtensionsPane />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* chapter copy */}
            <div className="order-1 lg:order-2">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.n + String(desktop)}
                  initial={{ opacity: 0, y: reduce ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduce ? 0 : -10 }}
                  transition={fade}
                >
                  <span className="font-mono text-[11px] tracking-[0.2em] text-teal">
                    {active.n} · {active.cap.toUpperCase()}
                    {chapter === 3 && (desktop ? " · DESKTOP" : " · WEB")}
                  </span>
                  <h3 className="mt-3 text-[clamp(1.35rem,2.1vw,1.85rem)] font-medium leading-[1.15]">
                    {chapter === 3
                      ? desktop
                        ? "Verify the desktop application itself."
                        : "Test what actually runs."
                      : active.title}
                  </h3>
                  <p className="mt-3 max-w-[420px] text-[15px] leading-[1.6] text-muted-foreground">
                    {chapter === 3
                      ? desktop
                        ? "For supported Electron projects, PreBase can also launch a managed desktop runtime so Agents can inspect the renderer, capture screenshots, read process output, and verify the running application itself."
                        : active.body
                      : active.body}
                  </p>
                  <p className="mt-4 font-mono text-[11px] leading-[1.5] text-muted-foreground/60">
                    {active.meta}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Navigation, not state: a click scrolls to the chapter's real story position
 * and the active tab is then derived from scroll like everything else.
 */
function CapabilityStrip({ active }: { active: Cap }) {
  const reduce = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = activeRef.current;
    const box = wrap.current;
    if (!el || !box || box.scrollWidth <= box.clientWidth) return;
    box.scrollTo({
      left: el.offsetLeft - box.clientWidth / 2 + el.offsetWidth / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [active, reduce]);

  return (
    <nav
      ref={wrap}
      aria-label="Workbench capabilities"
      className="-mx-5 flex shrink-0 gap-1.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
    >
      {CAP_LIST.map((c, i) => {
        const on = c === active;
        const step = WORKBENCH_STEPS[i]!;
        return (
          <button
            key={c}
            ref={on ? activeRef : undefined}
            type="button"
            aria-current={on ? "step" : undefined}
            onClick={() => scrollToStep(step, Boolean(reduce))}
            className={
              "relative min-h-11 shrink-0 cursor-pointer rounded-md border px-3 py-2 font-mono text-[11px] transition-colors duration-200 " +
              (on
                ? "border-teal/40 bg-teal/10 text-teal"
                : "border-border bg-surface-2/40 text-muted-foreground hover:border-border-strong hover:text-foreground")
            }
          >
            {c}
          </button>
        );
      })}
    </nav>
  );
}


/* ------------------------------------------------------------------ */
/* Panes                                                               */
/* ------------------------------------------------------------------ */

function Tabs({ file }: { file: string }) {
  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-border bg-surface-2/40 px-2 py-1.5 text-[11px]">
      <span className="rounded-sm px-2 py-1 text-muted-foreground">Welcome</span>
      <span className="rounded-sm border border-border bg-surface-1 px-2 py-1 font-mono text-foreground">
        {file}
      </span>
    </div>
  );
}

const CODE: Array<{ t: React.ReactNode; changed?: boolean }> = [
  {
    t: (
      <>
        <span className="text-info">import</span> {"{ parse }"} from{" "}
        <span className="text-teal">&apos;./parser&apos;</span>
      </>
    ),
  },
  {
    t: (
      <>
        <span className="text-info">import</span> {"{ link }"} from{" "}
        <span className="text-teal">&apos;./indexer&apos;</span>
      </>
    ),
  },
  { t: <span /> },
  {
    t: (
      <>
        <span className="text-info">export function</span>{" "}
        <span className="text-foreground">buildGraph</span>(files) {"{"}
      </>
    ),
  },
  { t: <span className="pl-4">const nodes = files.map(parse)</span>, changed: true },
  { t: <span className="pl-4">return link(nodes)</span> },
  { t: <>{"}"}</> },
];

function EditorPane() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Tabs file="graphService.ts" />
      <div className="grid min-h-0 flex-1 grid-cols-[40px_minmax(0,1fr)] overflow-hidden font-mono text-[11px]">
        <div className="border-r border-border py-3 text-right text-[10px] text-muted-foreground/50">
          {CODE.map((_, i) => (
            <div key={i} className="pr-2 leading-5">
              {i + 1}
            </div>
          ))}
        </div>
        <div className="py-3 pl-3 leading-5 text-muted-foreground/85">
          {CODE.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.04 * i }}
              className="relative"
            >
              {l.changed && (
                <span className="absolute -left-3 top-1 inline-block h-3 w-[2px] rounded bg-teal/70" />
              )}
              {l.t}
              {i === 4 && (
                <span className="pb-caret ml-px inline-block h-[1em] w-[2px] translate-y-[2px] bg-foreground/80" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TerminalPane({ reduce }: { reduce: boolean }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Tabs file="graphService.ts" />
      <div className="min-h-0 flex-1 overflow-hidden p-3 font-mono text-[11px] text-muted-foreground/60">
        <div>
          <span className="text-info">export function</span> buildGraph(files) {"{"}
        </div>
        <div className="pl-4">return link(files.map(parse))</div>
        <div>{"}"}</div>
      </div>
      <motion.div
        initial={reduce ? { opacity: 0 } : { y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: reduce ? 0.15 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="shrink-0 border-t border-border bg-background/70 p-3 font-mono text-[11px]"
      >
        <p className="pb-1 text-[10px] tracking-[0.14em] text-muted-foreground/70">TERMINAL</p>
        <p className="text-muted-foreground">$ npm run dev</p>
        <p className="text-teal">Local: http://localhost:3000</p>
        <p className="text-muted-foreground">$ npm test</p>
        <p className="text-success">42 tests passed</p>
      </motion.div>
    </div>
  );
}

function SourceControlPane() {
  return (
    <div className="grid h-full min-h-0 grid-cols-[130px_minmax(0,1fr)] sm:grid-cols-[168px_minmax(0,1fr)]">
      <div className="min-h-0 overflow-hidden border-r border-border p-3 font-mono text-[11px]">
        <p className="pb-2 text-[10px] tracking-[0.14em] text-muted-foreground">CHANGES · 3</p>
        <p className="truncate text-success">+ temporalStore.ts</p>
        <p className="truncate text-warning">~ graphService.ts</p>
        <p className="truncate text-danger">- cache.ts</p>
      </div>
      <div className="min-h-0 overflow-hidden p-3 font-mono text-[11px] text-muted-foreground">
        <p className="truncate text-foreground/80">diff --git a/src/graph/graphService.ts</p>
        <p className="mt-1 text-muted-foreground/60">@@ -14,7 +14,7 @@</p>
        <p className="truncate text-danger">- const cache = createCache()</p>
        <p className="truncate text-success">+ const store = createTemporalStore()</p>
        <p className="truncate">&nbsp;&nbsp;return buildGraph(files)</p>
      </div>
    </div>
  );
}

/* ---------------- Runtime: web ---------------- */

const DEVICES = [
  { id: "desktop", label: "Desktop", w: "100%" },
  { id: "tablet", label: "Tablet", w: "64%" },
  { id: "mobile", label: "Mobile", w: "40%" },
] as const;

function WebRuntime() {
  const [device, setDevice] = useState<(typeof DEVICES)[number]["id"]>("desktop");
  const [loading, setLoading] = useState(false);
  const width = DEVICES.find((d) => d.id === device)!.w;

  function reload() {
    setLoading(true);
    setTimeout(() => setLoading(false), 420);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1.5 border-b border-border bg-surface-2/50 px-2 py-1.5">
        <span className="rounded border border-teal/30 bg-teal/10 px-1.5 py-0.5 font-mono text-[9px] text-teal">
          WEB
        </span>
        <div className="flex gap-0.5">
          {[
            { k: "back", label: "Back", glyph: "‹" },
            { k: "forward", label: "Forward", glyph: "›" },
            { k: "reload", label: "Reload", glyph: "⟳" },
          ].map((b) => (
            <button
              key={b.k}
              type="button"
              aria-label={b.label}
              title={b.label}
              onClick={b.k === "reload" ? reload : undefined}
              className="inline-flex size-6 cursor-pointer items-center justify-center rounded border border-transparent text-[12px] text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              {b.glyph}
            </button>
          ))}
        </div>
        <span className="min-w-0 flex-1 truncate rounded border border-border bg-background/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          http://localhost:3000
        </span>
        <span className="hidden items-center gap-1 font-mono text-[10px] text-teal sm:flex">
          <span className="size-1.5 rounded-full bg-success" />
          Running
        </span>
        <div className="hidden gap-0.5 sm:flex" role="group" aria-label="Preview viewport">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={device === d.id}
              onClick={() => setDevice(d.id)}
              className={
                "cursor-pointer rounded border px-1.5 py-0.5 font-mono text-[9px] transition-colors " +
                (device === d.id
                  ? "border-teal/40 bg-teal/10 text-teal"
                  : "border-border text-muted-foreground hover:text-foreground")
              }
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 justify-center bg-background/40 p-2">
        <motion.div
          animate={{ width }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative min-h-0 overflow-hidden rounded-md border border-border bg-surface-2/90"
        >
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex items-center justify-center bg-surface-1/70 font-mono text-[10px] text-muted-foreground"
              >
                loading…
              </motion.div>
            )}
          </AnimatePresence>
          <MiniApp />
        </motion.div>
      </div>
    </div>
  );
}

function MiniApp() {
  return (
    <div className="flex h-full flex-col overflow-hidden p-2.5 text-foreground">
      <div className="flex items-center justify-between border-b border-border/70 pb-1.5">
        <span className="text-[11px] font-medium">demo-app</span>
        <nav className="flex gap-2 text-[9px] text-muted-foreground">
          <span className="text-teal">Overview</span>
          <span>Activity</span>
          <span className="hidden sm:inline">Settings</span>
        </nav>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {[
          { k: "Builds", v: "128" },
          { k: "Modules", v: "1,284" },
          { k: "Errors", v: "0" },
        ].map((s) => (
          <div key={s.k} className="rounded border border-border bg-surface-1/70 p-1.5">
            <p className="text-[8px] uppercase tracking-wide text-muted-foreground">{s.k}</p>
            <p className="text-[12px] font-medium">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex max-h-[46%] min-h-0 flex-1 items-end gap-1">
        {[40, 62, 34, 78, 55, 88, 47].map((h, i) => (
          <span key={i} style={{ height: `${h}%` }} className="w-full rounded-sm bg-teal/45" />
        ))}
      </div>
    </div>
  );
}

/* ---------------- Runtime: desktop ---------------- */

const TEST_STEPS = [
  "Launching Electron session…",
  "Inspecting renderer…",
  "Checking visible controls…",
  "Capturing screenshot…",
  "Reading process output…",
];

const TEST_RESULTS = [
  "Renderer loaded",
  "Save control found",
  "Screenshot captured",
  "No process errors",
];

function DesktopRuntime({ step }: { step: number }) {
  const highlightSave = step >= 2;
  const shot = step >= 3;
  const results = TEST_RESULTS.slice(0, Math.max(0, step - 1));

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* managed-session strip */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border bg-surface-2/60 px-2 py-1.5 font-mono text-[10px]">
        <span className="rounded border border-teal/30 bg-teal/10 px-1.5 py-0.5 text-teal">
          DESKTOP
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success" />
          Electron · Managed session
        </span>
        <span className="rounded border border-warning/30 px-1.5 py-0.5 text-warning">
          EXPERIMENTAL
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-[minmax(0,1fr)_150px]">
        {/* the Electron application window */}
        <div className="flex min-h-0 items-center justify-center bg-background/50 p-2.5">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full max-h-[300px] w-full min-w-0 max-w-[580px] flex-col overflow-hidden rounded-md border border-border-strong bg-surface-2 shadow-[0_20px_50px_-30px_rgba(0,0,0,1)]"
          >
            {/* native-like title bar */}
            <div className="flex shrink-0 items-center gap-1.5 border-b border-border bg-surface-3/70 px-2 py-1.5">
              <span className="size-2 rounded-full bg-danger/70" />
              <span className="size-2 rounded-full bg-warning/70" />
              <span className="size-2 rounded-full bg-success/70" />
              <span className="mx-auto truncate text-[10px] text-foreground/80">demo-app · desktop</span>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-[64px_minmax(0,1fr)]">
              <nav className="min-h-0 space-y-1 border-r border-border p-1.5 text-[9px] text-muted-foreground">
                <p className="rounded bg-teal/10 px-1.5 py-1 text-teal">Projects</p>
                <p className="px-1.5 py-1">Builds</p>
                <p className="px-1.5 py-1">Activity</p>
              </nav>
              <div className="flex min-h-0 flex-col p-2">
                <p className="text-[10px] font-medium text-foreground">Release 1.4</p>
                <p className="mt-0.5 text-[9px] text-muted-foreground">Local desktop build</p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {[
                    { k: "Sessions", v: "1" },
                    { k: "Warnings", v: "0" },
                  ].map((s) => (
                    <div key={s.k} className="rounded border border-border bg-surface-1/70 p-1.5">
                      <p className="text-[8px] uppercase tracking-wide text-muted-foreground">
                        {s.k}
                      </p>
                      <p className="text-[11px] font-medium">{s.v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <span className="truncate text-[9px] text-muted-foreground">
                    {shot ? "window.app.ready === true" : "Ready"}
                  </span>
                  <motion.span
                    animate={
                      highlightSave
                        ? { boxShadow: "0 0 0 2px oklch(0.78 0.11 190 / 55%)" }
                        : { boxShadow: "0 0 0 0px oklch(0.78 0.11 190 / 0%)" }
                    }
                    transition={{ duration: 0.3 }}
                    className="shrink-0 rounded bg-primary px-2 py-1 text-[9px] font-medium text-primary-foreground"
                  >
                    Save
                  </motion.span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* agent runtime-evidence panel */}
        <aside className="hidden min-h-0 flex-col overflow-hidden border-l border-border bg-surface-1/80 p-2.5 sm:flex">
          <p className="shrink-0 pb-2 text-[10px] tracking-[0.16em] text-muted-foreground">TEST</p>
          <div className="min-h-0 flex-1 space-y-1.5 overflow-hidden font-mono text-[10px]">
            <AnimatePresence initial={false}>
              {step >= 0 && (
                <motion.p
                  key={TEST_STEPS[Math.min(step, TEST_STEPS.length - 1)]}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-muted-foreground"
                >
                  {TEST_STEPS[Math.min(step, TEST_STEPS.length - 1)]}
                </motion.p>
              )}
            </AnimatePresence>
            {results.map((r) => (
              <motion.p
                key={r}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="text-teal"
              >
                ✓ {r}
              </motion.p>
            ))}
            {shot && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-1 rounded border border-border bg-surface-2 p-1"
              >
                <div className="h-8 rounded-sm bg-gradient-to-br from-surface-3 to-surface-1" />
                <p className="pt-1 text-[9px] text-muted-foreground">screenshot.png</p>
              </motion.div>
            )}
          </div>
          <p className="shrink-0 pt-2 text-[9px] leading-[1.4] text-muted-foreground/70">
            Renderer-scoped. Native OS dialogs and menus are not automated.
          </p>
        </aside>
      </div>
    </div>
  );
}

/* ---------------- Extensions ---------------- */

const EXTENSIONS = [
  { name: "ESLint", desc: "Linting" },
  { name: "Prettier", desc: "Formatting" },
  { name: "GitLens", desc: "Git insight" },
  { name: "Vitest", desc: "Test runner" },
];

function ExtensionsPane() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-3 py-2 text-[10px] tracking-[0.14em] text-muted-foreground">
        EXTENSIONS
      </div>
      <div className="min-h-0 flex-1 space-y-1.5 overflow-hidden p-3">
        {EXTENSIONS.map((e, i) => (
          <motion.div
            key={e.name}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.05 * i }}
            className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2/60 px-2.5 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-[12px] text-foreground/90">{e.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{e.desc}</p>
            </div>
            <span className="shrink-0 rounded border border-teal/25 bg-teal/10 px-1.5 py-0.5 font-mono text-[9px] text-teal">
              Installed
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
