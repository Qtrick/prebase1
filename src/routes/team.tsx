import { createFileRoute } from "@tanstack/react-router";
import { TeamPage } from "@/components/TeamPage";

const title = "Team | PreBase";
const description = "PreBase is built by co-founders David Fan and Vybhav Parthan.";

export const Route = createFileRoute("/team")({
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
  component: TeamRoute,
});

function TeamRoute() {
  return (
    <main id="main">
      <TeamPage />
    </main>
  );
}
