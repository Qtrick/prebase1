import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ScrollStory } from "@/components/ScrollStory";
import { Playground } from "@/components/Playground";
import { ScrollProgress } from "@/components/ScrollProgress";
import { ProductJourneyRail } from "@/components/ProductJourneyRail";
import { IdeStory } from "@/components/IdeStory";
import { Waitlist } from "@/components/Waitlist";
import { Footer } from "@/components/Footer";

const title = "PreBase | The Codebase Mapping IDE";
const description =
  "PreBase is a codebase mapping IDE that helps developers visualize repository structure, explore changes through Git history, and give AI agents deeper codebase context.";

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
  return (
    <div className="relative min-h-screen [overflow-x:clip]">
      <div
        aria-hidden="true"
        className="pb-grid pb-mask-fade pointer-events-none fixed inset-0 -z-10 opacity-50"
      />
      <ScrollProgress />
      <Navbar />
      <ProductJourneyRail />
      <main>
        <Hero />
        <ScrollStory />
        <IdeStory />
        <Playground />
        <Waitlist />
      </main>
      <Footer />
    </div>
  );
}
