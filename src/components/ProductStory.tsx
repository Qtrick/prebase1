import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { IdeFrame } from "./IdeFrame";
import { GraphCanvas, type GraphState } from "./GraphCanvas";
import { Reveal } from "./Reveal";

const STEPS: Array<{
  id: GraphState;
  title: string;
  body: string;
  note: string;
}> = [
  {
    id: "network",
    title: "Map the system.",
    body: "Turn a repository into an interactive map of files, dependencies, and the relationships that hold the codebase together.",
    note: "Network graph · files, dependencies, clusters",
  },
  {
    id: "temporal",
    title: "See change over time.",
    body: "Move through Git history and see the structure itself change. Compare commits, follow renames, and understand what was added, removed, or modified.",
    note: "Temporal graph · added, removed, modified across commits",
  },
  {
    id: "agent",
    title: "Work with context.",
    body: "PreBase Agents can query codebase structure so Ask, Edit, and Agent modes can reason beyond the file currently open.",
    note: "Agent context · selected node and its connected dependencies",
  },
];

export function ProductStory() {
  const [active, setActive] = useState<GraphState>("network");
  const refs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-step") as GraphState | null;
            if (id) setActive(id);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="product" className="relative mt-28 sm:mt-40">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal as="h2" className="max-w-2xl text-[clamp(1.75rem,3.4vw,2.5rem)] font-medium leading-tight">
          One graph, three ways of reading a codebase.
        </Reveal>

        {/* Desktop: sticky visual + scrolling copy */}
        <div className="mt-12 hidden gap-12 lg:grid lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="relative">
            <div className="sticky top-24">
              <IdeFrame state={active} dense />
            </div>
          </div>
          <div>
            {STEPS.map((step, i) => (
              <div
                key={step.id}
                data-step={step.id}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                className="flex min-h-[78vh] flex-col justify-center"
              >
                <span
                  className={
                    "font-mono text-[11px] tracking-[0.18em] transition-colors duration-300 " +
                    (active === step.id ? "text-teal" : "text-muted-foreground/60")
                  }
                >
                  0{i + 1}
                </span>
                <motion.h3
                  animate={{ opacity: active === step.id ? 1 : 0.4 }}
                  transition={{ duration: 0.4 }}
                  className="mt-4 text-2xl font-medium sm:text-[28px]"
                >
                  {step.title}
                </motion.h3>
                <motion.p
                  animate={{ opacity: active === step.id ? 1 : 0.35 }}
                  transition={{ duration: 0.4 }}
                  className="mt-3 max-w-md leading-relaxed text-muted-foreground"
                >
                  {step.body}
                </motion.p>
                <p className="mt-5 border-l border-border pl-3 font-mono text-[11px] text-muted-foreground/80">
                  {step.note}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile / tablet: copy then a simplified graph per step */}
        <div className="mt-10 space-y-16 lg:hidden">
          {STEPS.map((step, i) => (
            <MobileStep key={step.id} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MobileStep({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && setVisible(true),
      { rootMargin: "-15% 0px -15% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <Reveal>
        <span className="font-mono text-[11px] tracking-[0.18em] text-teal">0{index + 1}</span>
        <h3 className="mt-3 text-2xl font-medium">{step.title}</h3>
        <p className="mt-3 leading-relaxed text-muted-foreground">{step.body}</p>
      </Reveal>
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface-1">
        <div className="flex items-center justify-between border-b border-border px-3 py-2 font-mono text-[10px] text-muted-foreground">
          <span>{step.id === "temporal" ? "temporal graph" : "code graph"}</span>
          <span className="text-teal">{step.id === "temporal" ? "HEAD" : "indexed"}</span>
        </div>
        <GraphCanvas state={visible ? step.id : "network"} className="h-[260px] w-full" />
      </div>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">{step.note}</p>
    </div>
  );
}
