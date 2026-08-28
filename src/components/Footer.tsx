import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/prebase-icon.png";
import { OutboundLink } from "./OutboundLink";
import { onSectionClick, sectionHref } from "@/lib/nav";
import { COPYRIGHT_YEAR, PREBASE_LINKEDIN } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border py-12 sm:mt-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-2 text-sm">
          <img
            src={logo}
            alt=""
            width={22}
            height={22}
            className="size-[22px] shrink-0 rounded border border-border"
          />
          <span className="shrink-0 font-medium">PreBase</span>
          <span className="text-muted-foreground">· The codebase mapping IDE.</span>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-3">
          <FooterCol title="Site">
            <PageLink to="/">Product</PageLink>
            <PageLink to="/why">Why PreBase</PageLink>
            <PageLink to="/team">Team</PageLink>
          </FooterCol>

          <FooterCol title="Product">
            <SectionLink id="why">Workbench</SectionLink>
            <SectionLink id="explore">Explore</SectionLink>
            <SectionLink id="waitlist">Waitlist</SectionLink>
          </FooterCol>

          <FooterCol title="More">
            <OutboundLink
              href={PREBASE_LINKEDIN}
              className="inline-flex min-h-11 items-center py-1 sm:min-h-0"
            >
              LinkedIn
            </OutboundLink>
            <PageLink to="/privacy">Privacy</PageLink>
          </FooterCol>
        </div>

        <p className="mt-10 text-sm text-muted-foreground/70">© {COPYRIGHT_YEAR} PreBase</p>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
        {title.toUpperCase()}
      </p>
      <div className="mt-3 flex flex-col items-start gap-1">{children}</div>
    </div>
  );
}

function PageLink({
  to,
  children,
}: {
  to: "/why" | "/team" | "/privacy" | "/";
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground sm:min-h-0"
    >
      {children}
    </Link>
  );
}

function SectionLink({ id, children }: { id: string; children: ReactNode }) {
  return (
    <a
      href={sectionHref(id)}
      onClick={(event) => onSectionClick(event, id)}
      className="inline-flex min-h-11 items-center py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground sm:min-h-0"
    >
      {children}
    </a>
  );
}
