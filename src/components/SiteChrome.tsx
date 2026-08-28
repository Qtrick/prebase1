import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ProductJourneyRail } from "@/components/ProductJourneyRail";
import { ScrollProgress } from "@/components/ScrollProgress";
import { isHomePath } from "@/lib/nav";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showProductChrome = isHomePath(pathname);

  return (
    <div className="relative min-h-screen [overflow-x:clip]">
      <div
        aria-hidden="true"
        className="pb-grid pb-mask-fade pointer-events-none fixed inset-0 -z-10 opacity-50"
      />
      {showProductChrome ? <ScrollProgress /> : null}
      <Navbar />
      {showProductChrome ? <ProductJourneyRail /> : null}
      {children}
      <Footer />
    </div>
  );
}
