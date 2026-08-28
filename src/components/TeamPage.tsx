import { OutboundLink } from "@/components/OutboundLink";
import { Reveal } from "@/components/Reveal";
import { FOUNDERS, PREBASE_LINKEDIN, type Founder } from "@/lib/site";

export function TeamPage() {
  return (
    <article className="mx-auto max-w-5xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <Reveal className="max-w-2xl">
        <p className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground">TEAM</p>
        <h1 className="mt-3 text-[clamp(1.9rem,4.4vw,2.85rem)] font-medium leading-[1.12] tracking-tight">
          The people building PreBase.
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-[1.7] text-muted-foreground">
          PreBase is a two-person founding team. Names, roles, and profiles are here so the company
          is not a logo with a waitlist.
        </p>
      </Reveal>

      <ul className="mt-14 grid gap-12 sm:mt-16 md:grid-cols-2 md:gap-16">
        {FOUNDERS.map((founder, i) => (
          <Reveal as="li" key={founder.linkedin} delay={0.05 * i} className="list-none">
            <FounderBlock founder={founder} />
          </Reveal>
        ))}
      </ul>

      <Reveal delay={0.08} className="mt-16 border-t border-border pt-10 sm:mt-20">
        <OutboundLink href={PREBASE_LINKEDIN} className="inline-flex min-h-11 items-center">
          PreBase on LinkedIn
        </OutboundLink>
      </Reveal>
    </article>
  );
}

function FounderBlock({ founder }: { founder: Founder }) {
  return (
    <figure className="flex flex-col">
      {founder.photoSrc ? (
        <img
          src={founder.photoSrc}
          alt={founder.photoAlt ?? founder.name}
          width={800}
          height={800}
          decoding="async"
          className="aspect-square w-full max-w-[20rem] rounded-md border border-border object-cover"
        />
      ) : null}
      <figcaption className={founder.photoSrc ? "mt-5" : "border-t border-border pt-6"}>
        <p className="text-[1.35rem] font-medium tracking-tight sm:text-[1.5rem]">{founder.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{founder.role}</p>
        <OutboundLink
          href={founder.linkedin}
          className="mt-3 inline-flex min-h-11 items-center sm:min-h-0"
        >
          LinkedIn
        </OutboundLink>
      </figcaption>
    </figure>
  );
}
