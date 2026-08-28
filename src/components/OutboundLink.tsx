import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function OutboundLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground",
        className,
      )}
    >
      {children}
      <span aria-hidden="true"> ↗</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
