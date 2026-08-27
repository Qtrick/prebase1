import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export const THEME_STORAGE_KEY = "prebase-theme";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const initial: Theme =
      stored === "light" || stored === "dark"
        ? stored
        : document.documentElement.classList.contains("dark")
          ? "dark"
          : "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className="relative inline-flex h-7 w-[52px] shrink-0 items-center rounded-full border border-border bg-surface-2 px-1 transition-colors duration-200 hover:border-border-strong"
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 size-5 rounded-full bg-primary transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: isDark ? "translateX(24px)" : "translateX(0px)" }}
      />
      <span className="relative z-10 flex w-full items-center justify-between px-[3px]">
        <Sun
          className={
            "size-3.5 transition-colors duration-200 " +
            (isDark ? "text-muted-foreground" : "text-primary-foreground")
          }
        />
        <Moon
          className={
            "size-3.5 transition-colors duration-200 " +
            (isDark ? "text-primary-foreground" : "text-muted-foreground")
          }
        />
      </span>
    </button>
  );
}
