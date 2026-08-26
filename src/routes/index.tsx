import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ProductStory } from "@/components/ProductStory";
import { IdeStrip } from "@/components/IdeStrip";
import { Waitlist } from "@/components/Waitlist";
import { Footer } from "@/components/Footer";

const title = "PreBase — The Codebase Mapping IDE";
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
        className="pb-grid pb-mask-fade pointer-events-none fixed inset-0 -z-10 opacity-70"
      />
      <Navbar />
      <main>
        
        <Hero />
        <ProductStory />
        <IdeStrip />
        <Waitlist />
      </main>
      <Footer />
    </div>
  );
}
