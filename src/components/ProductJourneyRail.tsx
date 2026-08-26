import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  JOURNEY_GROUPS,
  PRODUCT_JOURNEY,
  scrollToStep,
  useJourneyPosition,
} from "@/lib/journey";

/**
 * One page-level rail for the whole product journey. It is visible only
 * between the start of the product story and the waitlist, lists every step at
 * once, and navigates by scrolling — scroll remains the authoritative state.
 */
export function ProductJourneyRail() {
  const reduce = useReducedMotion();
  const { index, visible } = useJourneyPosition();
  const active = PRODUCT_JOURNEY[index];

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* desktop rail */}
          <motion.nav
            key="rail"
            aria-label="Product journey"
            initial={{ opacity: 0, x: reduce ? 0 : -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduce ? 0 : -6 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-4 xl:flex"
          >
            {JOURNEY_GROUPS.map((g) => {
              const steps = PRODUCT_JOURNEY.filter((s) => s.group === g);
              const inGroup = active?.group === g;
              return (
                <div key={g} className="flex flex-col gap-1">
                  <span
                    className={
                      "pl-[26px] font-mono text-[9px] tracking-[0.24em] transition-colors duration-300 " +
                      (inGroup ? "text-foreground/65" : "text-muted-foreground/45")
                    }
                  >
                    {g}
                  </span>
                  {steps.map((s) => {
                    const on = s.id === active?.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => scrollToStep(s, Boolean(reduce))}
                        aria-current={on ? "step" : undefined}
                        aria-label={`Go to ${s.n} ${s.label}`}
                        className={
                          "group flex cursor-pointer items-center gap-2 rounded-sm py-[3px] pr-1 text-left font-mono text-[10px] tracking-[0.14em] transition-colors duration-200 hover:text-teal focus-visible:text-teal motion-reduce:transition-none " +
                          (on ? "text-teal" : "text-muted-foreground/70")
                        }
                      >
                        <span
                          aria-hidden="true"
                          className={
                            "inline-block h-px shrink-0 transition-all duration-300 group-hover:bg-teal motion-reduce:transition-none " +
                            (on ? "w-[18px] bg-teal" : "w-[10px] bg-muted-foreground/40 group-hover:w-[18px]")
                          }
                        />
                        <span className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none">
                          {s.n} {s.label.toUpperCase()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </motion.nav>

          {/* compact progress marker for narrower screens */}
          <motion.div
            key="rail-compact"
            initial={{ opacity: 0, y: reduce ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : 6 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed bottom-4 left-1/2 z-40 -translate-x-1/2 xl:hidden"
          >
            <span
              role="status"
              aria-live="polite"
              className="rounded-full border border-border bg-background/80 px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-muted-foreground backdrop-blur"
            >
              {active ? `${active.n} / 11 · ${active.label.toUpperCase()}` : ""}
            </span>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
