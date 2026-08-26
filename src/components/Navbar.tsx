import { useEffect, useState } from "react";
import logo from "@/assets/prebase-icon.png.asset.json";
import { jumpToSection } from "@/lib/journey";

const LINKS = [
  { href: "#product", label: "Product" },
  { href: "#explore", label: "Explore" },
  { href: "#why", label: "Why PreBase" },
];

export function Navbar() {
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
        "fixed inset-x-0 top-0 z-50 transition-all duration-300 " +
        (scrolled
          ? "border-b border-border bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent")
      }
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8"
      >
        <a
          href="#top"
          onClick={(event) => {
            event.preventDefault();
            jumpToSection("top");
          }}
          className="flex items-center gap-2.5"
        >
          <img
            src={logo.url}
            alt=""
            width={26}
            height={26}
            className="size-[26px] rounded-md border border-border"
          />
          <span className="text-[15px] font-medium tracking-tight">PreBase</span>
        </a>

        <div className="flex items-center gap-1 sm:gap-5">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative hidden px-1 py-1 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground sm:block"
            >
              {l.label}
              <span className="absolute inset-x-1 -bottom-0.5 h-px origin-left scale-x-0 bg-foreground/40 transition-transform duration-200 group-hover:scale-x-100" />
            </a>
          ))}
          <a
            href="#waitlist"
            onClick={(event) => {
              event.preventDefault();
              jumpToSection("waitlist");
            }}
            className="pb-shine inline-flex items-center rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-transform duration-200 hover:-translate-y-px"
          >
            Join Waitlist
          </a>
        </div>
      </nav>
    </header>
  );
}
