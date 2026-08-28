import { createFileRoute } from "@tanstack/react-router";
import { WhyPage } from "@/components/WhyPage";

const title = "Why PreBase | PreBase";
const description =
  "Why PreBase exists: the gap between file trees and the systems they create, and why codebase context belongs in the development environment.";

export const Route = createFileRoute("/why")({
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
  component: WhyRoute,
});

function WhyRoute() {
  return (
    <main id="main">
      <WhyPage />
    </main>
  );
}
