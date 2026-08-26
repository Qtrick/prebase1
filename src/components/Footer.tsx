import logo from "@/assets/prebase-icon.png.asset.json";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border py-10 sm:mt-32">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2.5">
          <img
            src={logo.url}
            alt="PreBase"
            width={22}
            height={22}
            className="size-[22px] rounded border border-border"
          />
          <span className="text-sm">PreBase</span>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            · Built for developers and the agents that work with them.
          </span>
        </div>
        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          <a href="#product" className="transition-colors hover:text-foreground">
            Product
          </a>
          <a href="#waitlist" className="transition-colors hover:text-foreground">
            Waitlist
          </a>
          <span className="text-muted-foreground/60">© PreBase</span>
        </div>
      </div>
      <p className="mt-6 px-5 text-sm text-muted-foreground sm:hidden">
        Built for developers and the agents that work with them.
      </p>
    </footer>
  );
}
