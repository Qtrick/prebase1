import { Link } from "@tanstack/react-router";
import { Reveal } from "./Reveal";

const SECTIONS = [
  {
    n: "01",
    title: "The file is not the system.",
    body: "File trees are good at showing where code lives. They are much less useful at showing the structure those files create: the calls, types, ownership, and history that make a codebase a system rather than a directory.",
  },
  {
    n: "02",
    title: "Understanding should not be reconstruction.",
    body: "As repositories grow, more of the work becomes recovering relationships that already exist in the code. That reconstruction happens in every new clone, every new teammate, and every return to an unfamiliar area. The cost is paid again and again because the environment never kept the structure in view.",
  },
  {
    n: "03",
    title: "Software now has two audiences.",
    body: "People still have to find their way through the system. Agents now have to as well, at a different scale and with less intuition. An agent that sees files and snippets still has to guess how the whole fits together. Missing context is no longer only a navigation problem. It is a reliability problem.",
  },
  {
    n: "04",
    title: "Context belongs in the development environment.",
    body: "Maps, history, and the work itself should not live in separate tools the developer has to assemble. The structure of a codebase should be something you can see and move through, in the same place you write and run the code.",
  },
  {
    n: "05",
    title: "That is what we are building.",
    body: "PreBase exists to make that structure ordinary: present in the environment, available to the person at the keyboard, and usable by the tools working alongside them.",
  },
] as const;

export function WhyPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <Reveal>
        <p className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground">WHY PREBASE</p>
        <h1 className="mt-3 text-[clamp(1.9rem,4.4vw,2.85rem)] font-medium leading-[1.12] tracking-tight">
          The system is already in the code. Most environments never show it.
        </h1>
        <p className="mt-6 text-[15px] leading-[1.75] text-muted-foreground">
          A large codebase is not a pile of files. It is a set of relationships that already exist,
          whether or not the editor surfaces them. PreBase started from that gap: between where code
          lives, and how the system actually works.
        </p>
      </Reveal>

      <ol className="mt-16 space-y-14 sm:mt-20 sm:space-y-16">
        {SECTIONS.map((section, i) => (
          <Reveal as="li" key={section.n} delay={0.04 * i} className="list-none">
            <p className="font-mono text-[11px] tracking-[0.18em] text-teal">{section.n}</p>
            <h2 className="mt-2 text-[1.35rem] font-medium leading-snug sm:text-[1.5rem]">
              {section.title}
            </h2>
            <p className="mt-3 text-[15px] leading-[1.75] text-muted-foreground">{section.body}</p>
          </Reveal>
        ))}
      </ol>

      <Reveal delay={0.08} className="mt-16 border-t border-border pt-10 sm:mt-20">
        <p className="text-[15px] leading-[1.75] text-muted-foreground">
          The product page is the work itself. This page is why that work needs to exist.
        </p>
        <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:gap-8">
          <Link
            to="/"
            className="text-foreground transition-colors hover:text-teal focus-visible:text-teal"
          >
            See the product →
          </Link>
          <Link
            to="/team"
            className="text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground"
          >
            The people building PreBase →
          </Link>
        </div>
      </Reveal>
    </article>
  );
}
