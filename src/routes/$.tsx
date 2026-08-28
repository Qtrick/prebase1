import { createFileRoute, notFound } from "@tanstack/react-router";

const title = "Page not found | PreBase";

export const Route = createFileRoute("/$")({
  loader: () => {
    throw notFound();
  },
  head: () => ({
    meta: [
      { title },
      { name: "robots", content: "noindex" },
      { name: "description", content: "This page does not exist." },
    ],
  }),
});
