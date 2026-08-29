import { motion, useReducedMotion } from "motion/react";
import { HeroDemo } from "@/components/hero/HeroDemo";
import { onSectionClick, sectionHref } from "@/lib/nav";

export function Hero() {
  const reduce = useReducedMotion();

  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 18, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: {
      duration: reduce ? 0.2 : 0.7,
      delay: reduce ? 0 : delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  });

  return (
    <section id="top" className="relative flex min-h-[100svh] items-center pb-16 pt-24 sm:pb-20 sm:pt-28">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(18.5rem,36%)_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[minmax(19.5rem,34%)_minmax(0,1fr)] xl:gap-14">
          <div className="text-left lg:pt-2">
            <motion.p
              {...rise(0)}
              className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground"
            >
              PREBASE · EARLY ACCESS
            </motion.p>
            <motion.h1
              {...rise(0.09)}
              className="mt-5 max-w-[16ch] text-[clamp(2.15rem,4.8vw,3.55rem)] font-medium leading-[1.06] tracking-tight"
            >
              The codebase mapping IDE.
            </motion.h1>
            <motion.p
              {...rise(0.18)}
              className="mt-5 max-w-[36ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base"
            >
              See how the system fits together, follow how it changed, and give agents the context
              to work across it.
            </motion.p>
            <motion.div
              {...rise(0.27)}
              className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
            >
              <a
                href={sectionHref("waitlist")}
                onClick={(event) => onSectionClick(event, "waitlist")}
                className="pb-shine group inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform duration-200 hover:-translate-y-px"
              >
                Join the waitlist
                <span className="transition-transform duration-200 group-hover:translate-x-[3px]">
                  →
                </span>
              </a>
              <a
                href={sectionHref("explore")}
                onClick={(event) => onSectionClick(event, "explore")}
                className="inline-flex items-center justify-center rounded-md border border-border-strong bg-surface-1 px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-2"
              >
                Explore PreBase
              </a>
            </motion.div>
          </div>

          <motion.div {...rise(0.16)} className="min-w-0">
            <HeroDemo />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
