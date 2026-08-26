import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

/** Shared reveal: fade + small rise + slight blur, consistent everywhere. */
export function Reveal({
  delay = 0,
  as = "div",
  children,
  ...rest
}: { delay?: number; as?: "div" | "p" | "h2" | "h3" | "span" | "li" } & HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20, filter: "blur(8px)" }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: reduce ? 0.2 : 0.6, delay: reduce ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </Comp>
  );
}
