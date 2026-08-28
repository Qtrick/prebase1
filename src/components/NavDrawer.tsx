import { useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { OutboundLink } from "@/components/OutboundLink";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { jumpToSection } from "@/lib/journey";
import {
  isHomePath,
  isPrimaryPath,
  onSectionClick,
  PRIMARY_PAGES,
  PRODUCT_ANCHORS,
  sectionHref,
} from "@/lib/nav";
import { PREBASE_LINKEDIN } from "@/lib/site";
import { cn } from "@/lib/utils";

const DRAWER_ID = "site-nav-drawer";

export function NavDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={DRAWER_ID}
          aria-label="Menu"
          className="inline-flex h-11 min-w-11 touch-manipulation items-center gap-2 rounded-md px-2.5 text-sm text-foreground transition-colors hover:bg-surface-2 focus-visible:bg-surface-2"
        >
          <MenuGlyph />
          <span className="hidden font-medium tracking-tight md:inline">Menu</span>
        </button>
      </SheetTrigger>
      <SheetContent
        id={DRAWER_ID}
        side="left"
        hideCloseButton
        overlayClassName="z-[70] bg-foreground/25 backdrop-blur-[2px] data-[state=open]:duration-[220ms] data-[state=closed]:duration-[180ms]"
        className="z-[70] flex h-dvh w-[min(20.5rem,calc(100vw-1.5rem))] flex-col gap-0 border-r border-border bg-background p-0 shadow-none data-[state=open]:duration-[280ms] data-[state=closed]:duration-[220ms] sm:max-w-[20.5rem]"
      >
        <SheetTitle className="sr-only">Site navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Product, Why PreBase, Team, and product sections.
        </SheetDescription>

        <div className="flex items-center justify-end px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <SheetClose asChild>
            <button
              type="button"
              className="inline-flex h-11 items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              Close
            </button>
          </SheetClose>
        </div>

        <nav
          aria-label="Site"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2"
        >
          <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">PREBASE</p>
          <ul className="mt-3 flex flex-col">
            {PRIMARY_PAGES.map((page) => {
              const current = isPrimaryPath(pathname, page.to);
              return (
                <li key={page.to}>
                  <Link
                    to={page.to}
                    aria-current={current ? "page" : undefined}
                    onClick={(event) => {
                      onOpenChange(false);
                      if (page.to === "/" && isHomePath(pathname)) {
                        event.preventDefault();
                        jumpToSection("top");
                      }
                    }}
                    className={cn(
                      "flex min-h-11 items-center border-l-2 py-1 pl-3 text-[15px] transition-colors",
                      current
                        ? "border-teal font-medium text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {page.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="mt-10 font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
            PRODUCT
          </p>
          <ul className="mt-3 flex flex-col">
            {PRODUCT_ANCHORS.map((item) => (
              <li key={item.id}>
                <a
                  href={sectionHref(item.id)}
                  onClick={(event) => {
                    onOpenChange(false);
                    onSectionClick(event, item.id);
                  }}
                  className="flex min-h-11 items-center py-1 pl-[14px] text-[15px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-10">
            <OutboundLink href={PREBASE_LINKEDIN} className="inline-flex min-h-11 items-center">
              PreBase on LinkedIn
            </OutboundLink>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function MenuGlyph() {
  return (
    <span className="relative block size-[18px] shrink-0" aria-hidden="true">
      <span className="absolute left-0 top-[4px] block h-px w-[18px] bg-current" />
      <span className="absolute left-0 top-[8.5px] block h-px w-[18px] bg-current" />
      <span className="absolute left-0 top-[13px] block h-px w-[18px] bg-current" />
    </span>
  );
}
