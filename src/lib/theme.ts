export const THEME_STORAGE_KEY = "prebase-theme";

export type SiteTheme = "dark" | "light";

export function isSiteTheme(value: string | null | undefined): value is SiteTheme {
  return value === "dark" || value === "light";
}

/** Dark is the site default when the document has not opted into light. */
export function readDocumentTheme(): SiteTheme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applySiteTheme(theme: SiteTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function subscribeDocumentTheme(onChange: (theme: SiteTheme) => void): () => void {
  if (typeof MutationObserver === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  const emit = () => onChange(readDocumentTheme());
  const observer = new MutationObserver(emit);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
