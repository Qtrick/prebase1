import { Reveal } from "./Reveal";

const CAPABILITIES = ["Editor", "Terminal", "Source Control", "Runtime Preview", "Extensions"];

export function IdeStrip() {
  return (
    <section id="why" className="relative mt-28 border-y border-border bg-surface-1/40 py-16 sm:mt-40 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-center lg:gap-16">
        <Reveal>
          <h2 className="text-[clamp(1.6rem,3vw,2.15rem)] font-medium">Still an IDE.</h2>
          <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">
            Edit code, use source control, run commands, work with extensions, and preview local
            applications without leaving the same Code-OSS-based workspace.
          </p>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-wrap gap-2">
          {CAPABILITIES.map((c) => (
            <span
              key={c}
              className="rounded-md border border-border bg-surface-2/60 px-3.5 py-2 font-mono text-[12px] text-muted-foreground transition-colors duration-200 hover:border-border-strong hover:text-foreground"
            >
              {c}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
