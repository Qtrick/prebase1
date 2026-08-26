import { motion, useReducedMotion } from "motion/react";

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
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center pb-24 pt-28 sm:pt-32"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            {...rise(0)}
            className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground"
          >
            PREBASE · EARLY ACCESS
          </motion.p>
          <motion.h1
            {...rise(0.09)}
            className="mt-5 text-[clamp(2.5rem,7.2vw,4.75rem)] font-medium leading-[1.03]"
          >
            The codebase mapping IDE.
          </motion.h1>
          <motion.p
            {...rise(0.18)}
            className="mx-auto mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-muted-foreground sm:text-base"
          >
            See how your codebase fits together, how it changes over time, and give agents the
            context to work across it.
          </motion.p>
          <motion.div
            {...rise(0.27)}
            className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
          >
            <a
              href="#waitlist"
              className="pb-shine group inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform duration-200 hover:-translate-y-px"
            >
              Join the Waitlist
              <span className="transition-transform duration-200 group-hover:translate-x-[3px]">
                →
              </span>
            </a>
            <a
              href="#product"
              className="inline-flex items-center justify-center rounded-md border border-border-strong bg-surface-1 px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-2"
            >
              Explore PreBase
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
