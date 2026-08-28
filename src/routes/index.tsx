import { createFileRoute, Link } from "@tanstack/react-router";
import { Hero } from "@/components/Hero";
import { ScrollStory } from "@/components/ScrollStory";
import { Playground } from "@/components/Playground";
import { IdeStory } from "@/components/IdeStory";
import { Waitlist } from "@/components/Waitlist";
import { useHashLanding } from "@/lib/nav";

const title = "PreBase | The Codebase Mapping IDE";
const description =
  "PreBase is a codebase mapping IDE. See repository structure, follow Git history, and give agents deeper codebase context.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  useHashLanding();

  return (
    <main id="main">
      <Hero />
      <ScrollStory />
      <IdeStory />
      <Playground />
      <section className="mx-auto mt-16 max-w-6xl px-5 sm:mt-20 sm:px-8 xl:pl-[176px]">
        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:gap-8">
          <Link
            to="/why"
            className="text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground"
          >
            Why we&apos;re building PreBase →
          </Link>
          <Link
            to="/team"
            className="text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground"
          >
            The people building PreBase →
          </Link>
        </div>
      </section>
      <Waitlist />
    </main>
  );
}
