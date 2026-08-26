import logo from "@/assets/prebase-icon.png";
import { jumpToSection } from "@/lib/journey";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border py-10 sm:mt-32">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 sm:px-8 md:grid-cols-[1fr_auto] md:items-center md:gap-8">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-2 text-sm">
          <img
            src={logo}
            alt="PreBase"
            width={22}
            height={22}
            className="size-[22px] shrink-0 rounded border border-border"
          />
          <span className="shrink-0">PreBase</span>
          <span className="text-muted-foreground">
            · Built for developers and the agents that work with them.
          </span>
        </div>
        <div className="flex items-center gap-5 text-sm text-muted-foreground md:justify-end">
          <a
            href="#product"
            onClick={(event) => {
              event.preventDefault();
              jumpToSection("product");
            }}
            className="transition-colors hover:text-foreground"
          >
            Product
          </a>
          <a
            href="#waitlist"
            onClick={(event) => {
              event.preventDefault();
              jumpToSection("waitlist");
            }}
            className="transition-colors hover:text-foreground"
          >
            Waitlist
          </a>
          <span className="text-muted-foreground/60">© PreBase</span>
        </div>
      </div>
    </footer>
  );
}
