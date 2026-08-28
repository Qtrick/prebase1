import { useEffect, useState } from "react";
import logo from "@/assets/prebase-icon.png";
import { NavDrawer } from "@/components/NavDrawer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isHomePath, onSectionClick } from "@/lib/nav";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "pb-site-header fixed inset-x-0 top-0 z-50 transition-all duration-300 " +
        (scrolled
          ? "border-b border-border bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent")
      }
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-5 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-1 sm:gap-2">
          <NavDrawer open={open} onOpenChange={setOpen} />
          <a
            href="/"
            onClick={(event) => {
              if (typeof window !== "undefined" && isHomePath(window.location.pathname)) {
                onSectionClick(event, "top");
              }
            }}
            className="flex items-center gap-2.5 rounded-md px-1.5 py-1"
          >
            <img
              src={logo}
              alt=""
              width={26}
              height={26}
              className="size-[26px] rounded-md border border-border"
            />
            <span className="text-[15px] font-medium tracking-tight">PreBase</span>
          </a>
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
