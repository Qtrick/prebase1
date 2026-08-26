/**
 * Deterministic demonstration data for the PreBase marketing graph.
 *
 * This is an illustrative product model — not a real repository scan. The
 * concepts (network layout modes, temporal commit states, agent context) mirror
 * the real PreBase product, the data does not.
 */

export type LayoutMode = "organic" | "sphere" | "constellation" | "clustered" | "radial";

export const LAYOUTS: LayoutMode[] = [
  "organic",
  "sphere",
  "constellation",
  "clustered",
  "radial",
];

export type Category = "app" | "auth" | "graph" | "api" | "runtime";

export const CATEGORY_LABEL: Record<Category, string> = {
  app: "App shell",
  auth: "Auth",
  graph: "Graph core",
  api: "API",
  runtime: "Runtime",
};

export type TemporalStatus = "added" | "removed" | "modified" | "renamed" | "unchanged";

export type DemoNode = {
  id: string;
  label: string;
  path: string;
  category: Category;
  /** 2 = always labelled, 1 = labelled when relevant, 0 = supporting node */
  weight: 0 | 1 | 2;
  base: { x: number; y: number };
  /** commit index the file appears at (default 0) */
  addedAt?: number;
  /** commit index the file disappears at */
  removedAt?: number;
  /** commit indexes where the file was modified */
  modifiedAt?: number[];
  /** commit index of a rename, with the previous label */
  renamedAt?: number;
  renamedFrom?: string;
};

export const VIEW = { w: 800, h: 460, cx: 400, cy: 226 };

export const NODES: DemoNode[] = [
  { id: "app", label: "app.tsx", path: "src/app.tsx", category: "app", weight: 2, base: { x: 400, y: 84 }, modifiedAt: [1, 3] },
  { id: "router", label: "router.ts", path: "src/router.ts", category: "app", weight: 0, base: { x: 312, y: 140 } },
  { id: "views", label: "views.ts", path: "src/views.ts", category: "app", weight: 0, base: { x: 490, y: 142 }, modifiedAt: [2] },

  { id: "auth", label: "auth.ts", path: "src/auth.ts", category: "auth", weight: 2, base: { x: 196, y: 208 } },
  { id: "session", label: "session.ts", path: "src/auth/session.ts", category: "auth", weight: 0, base: { x: 112, y: 158 } },
  { id: "tokens", label: "tokens.ts", path: "src/auth/tokens.ts", category: "auth", weight: 0, base: { x: 118, y: 262 }, removedAt: 2 },

  { id: "graph", label: "graphService.ts", path: "src/graph/graphService.ts", category: "graph", weight: 2, base: { x: 400, y: 240 }, modifiedAt: [1, 3] },
  { id: "parser", label: "parser.ts", path: "src/graph/parser.ts", category: "graph", weight: 1, base: { x: 326, y: 312 }, modifiedAt: [1] },
  { id: "indexer", label: "indexer.ts", path: "src/graph/indexer.ts", category: "graph", weight: 1, base: { x: 474, y: 312 }, modifiedAt: [3] },
  { id: "walker", label: "walker.ts", path: "src/graph/walker.ts", category: "graph", weight: 0, base: { x: 396, y: 366 } },
  { id: "layouts", label: "layouts.ts", path: "src/graph/layouts.ts", category: "graph", weight: 0, base: { x: 250, y: 356 } },
  { id: "cache", label: "cache.ts", path: "src/graph/cache.ts", category: "graph", weight: 0, base: { x: 258, y: 402 }, removedAt: 3 },
  {
    id: "depIndex",
    label: "dependencyIndex.ts",
    path: "src/graph/dependencyIndex.ts",
    category: "graph",
    weight: 1,
    base: { x: 470, y: 396 },
    renamedAt: 2,
    renamedFrom: "graphIndex.ts",
  },
  { id: "temporalStore", label: "temporalStore.ts", path: "src/graph/temporalStore.ts", category: "graph", weight: 1, base: { x: 320, y: 408 }, addedAt: 2 },
  { id: "diffIndex", label: "diffIndex.ts", path: "src/graph/diffIndex.ts", category: "graph", weight: 0, base: { x: 396, y: 434 }, addedAt: 3 },

  { id: "api", label: "api.ts", path: "src/api.ts", category: "api", weight: 2, base: { x: 606, y: 204 }, modifiedAt: [2] },
  { id: "client", label: "client.ts", path: "src/api/client.ts", category: "api", weight: 0, base: { x: 690, y: 152 } },
  { id: "schema", label: "schema.ts", path: "src/api/schema.ts", category: "api", weight: 0, base: { x: 674, y: 246 } },

  { id: "runtime", label: "runtime.ts", path: "src/runtime.ts", category: "runtime", weight: 1, base: { x: 618, y: 320 } },
  { id: "preview", label: "preview.ts", path: "src/runtime/preview.ts", category: "runtime", weight: 0, base: { x: 700, y: 300 } },
  { id: "server", label: "devServer.ts", path: "src/runtime/devServer.ts", category: "runtime", weight: 0, base: { x: 686, y: 380 }, addedAt: 3 },
];

export const EDGES: Array<[string, string]> = [
  ["app", "router"],
  ["app", "views"],
  ["router", "auth"],
  ["auth", "session"],
  ["auth", "tokens"],
  ["app", "graph"],
  ["views", "graph"],
  ["auth", "graph"],
  ["graph", "parser"],
  ["graph", "indexer"],
  ["graph", "api"],
  ["parser", "walker"],
  ["indexer", "walker"],
  ["parser", "cache"],
  ["parser", "layouts"],
  ["indexer", "depIndex"],
  ["graph", "temporalStore"],
  ["depIndex", "diffIndex"],
  ["api", "client"],
  ["api", "schema"],
  ["api", "runtime"],
  ["runtime", "preview"],
  ["runtime", "server"],
];

export const NODE_BY_ID: Record<string, DemoNode> = Object.fromEntries(
  NODES.map((n) => [n.id, n]),
);

export const NEIGHBORS: Record<string, string[]> = (() => {
  const m: Record<string, string[]> = {};
  for (const n of NODES) m[n.id] = [];
  for (const [a, b] of EDGES) {
    m[a]?.push(b);
    m[b]?.push(a);
  }
  return m;
})();

export function radiusOf(n: DemoNode) {
  return n.weight === 2 ? 10 : n.weight === 1 ? 7 : 5;
}

/* ------------------------------------------------------------------ */
/* Layout positions — deterministic, illustrative of each real mode.   */
/* ------------------------------------------------------------------ */

export type Pos = { x: number; y: number; depth: number };

function organic(): Record<string, Pos> {
  const out: Record<string, Pos> = {};
  for (const n of NODES) out[n.id] = { x: n.base.x, y: n.base.y, depth: 1 };
  return out;
}

/** Even shell distribution projected into a 2D ellipse with depth scaling. */
function sphere(): Record<string, Pos> {
  const out: Record<string, Pos> = {};
  const n = NODES.length;
  NODES.forEach((node, i) => {
    // Fibonacci sphere, then orthographic projection.
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * 2.399963229728653;
    const px = Math.cos(theta) * r;
    const pz = Math.sin(theta) * r;
    out[node.id] = {
      x: VIEW.cx + px * 250,
      y: VIEW.cy + y * 160,
      depth: 0.62 + ((pz + 1) / 2) * 0.5,
    };
  });
  return out;
}

/** Connected nodes pulled toward each other — tight constellations. */
function constellation(): Record<string, Pos> {
  const pos: Record<string, Pos> = organic();
  for (let iter = 0; iter < 3; iter++) {
    const next: Record<string, Pos> = {};
    for (const n of NODES) {
      const nb = NEIGHBORS[n.id] ?? [];
      const p = pos[n.id]!;
      if (!nb.length) {
        next[n.id] = p;
        continue;
      }
      let sx = 0;
      let sy = 0;
      for (const id of nb) {
        sx += pos[id]!.x;
        sy += pos[id]!.y;
      }
      const cxN = sx / nb.length;
      const cyN = sy / nb.length;
      const k = n.weight === 2 ? 0.16 : 0.34;
      next[n.id] = {
        x: p.x + (cxN - p.x) * k,
        y: p.y + (cyN - p.y) * k,
        depth: 1,
      };
    }
    Object.assign(pos, next);
  }
  // expand slightly around the center so it doesn't collapse
  for (const n of NODES) {
    const p = pos[n.id]!;
    pos[n.id] = {
      x: VIEW.cx + (p.x - VIEW.cx) * 1.22,
      y: VIEW.cy + (p.y - VIEW.cy) * 1.18,
      depth: 1,
    };
  }
  return pos;
}

/** Distinct architecture groupings. */
function clustered(): Record<string, Pos> {
  const centers: Record<Category, { x: number; y: number }> = {
    app: { x: 400, y: 92 },
    auth: { x: 158, y: 190 },
    graph: { x: 372, y: 300 },
    api: { x: 646, y: 168 },
    runtime: { x: 654, y: 356 },
  };
  const out: Record<string, Pos> = {};
  const groups: Record<string, DemoNode[]> = {};
  for (const n of NODES) (groups[n.category] ??= []).push(n);
  for (const [cat, list] of Object.entries(groups)) {
    const c = centers[cat as Category];
    list.forEach((n, i) => {
      if (i === 0) {
        out[n.id] = { x: c.x, y: c.y, depth: 1 };
        return;
      }
      const ring = list.length > 6 && i > 5 ? 2 : 1;
      const count = ring === 1 ? Math.min(list.length - 1, 5) : list.length - 6;
      const idx = ring === 1 ? i - 1 : i - 6;
      const a = (idx / Math.max(1, count)) * Math.PI * 2 - Math.PI / 2;
      const rad = ring === 1 ? 56 : 96;
      out[n.id] = { x: c.x + Math.cos(a) * rad, y: c.y + Math.sin(a) * rad * 0.82, depth: 1 };
    });
  }
  return out;
}

/** Graph-distance rings expanding from graphService.ts. */
function radial(): Record<string, Pos> {
  const root = "graph";
  const depth: Record<string, number> = { [root]: 0 };
  const queue = [root];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const nb of NEIGHBORS[cur] ?? []) {
      if (depth[nb] === undefined) {
        depth[nb] = depth[cur]! + 1;
        queue.push(nb);
      }
    }
  }
  const rings: Record<number, string[]> = {};
  for (const n of NODES) {
    const d = depth[n.id] ?? 4;
    (rings[d] ??= []).push(n.id);
  }
  const out: Record<string, Pos> = {};
  for (const [dStr, ids] of Object.entries(rings)) {
    const d = Number(dStr);
    if (d === 0) {
      out[ids[0]!] = { x: VIEW.cx, y: VIEW.cy, depth: 1 };
      continue;
    }
    ids.forEach((id, i) => {
      const a = (i / ids.length) * Math.PI * 2 - Math.PI / 2 + d * 0.35;
      const rad = d * 78;
      out[id] = {
        x: VIEW.cx + Math.cos(a) * rad,
        y: VIEW.cy + Math.sin(a) * rad * 0.62,
        depth: 1,
      };
    });
  }
  return out;
}

export const LAYOUT_POSITIONS: Record<LayoutMode, Record<string, Pos>> = {
  organic: organic(),
  sphere: sphere(),
  constellation: constellation(),
  clustered: clustered(),
  radial: radial(),
};

/* ------------------------------------------------------------------ */
/* Temporal model                                                      */
/* ------------------------------------------------------------------ */

export type Commit = {
  id: string;
  label: string;
  message: string;
  when: string;
};

export const COMMITS: Commit[] = [
  { id: "a83fc2", label: "a83fc2", message: "Extract graph service", when: "4 weeks ago" },
  { id: "c192af", label: "c192af", message: "Parser rewrite", when: "12 days ago" },
  { id: "7fd410", label: "7fd410", message: "Temporal store + rename index", when: "5 days ago" },
  { id: "HEAD", label: "HEAD", message: "Diff index & dev server", when: "today" },
];

export function statusAt(node: DemoNode, commit: number): TemporalStatus | "absent" {
  const added = node.addedAt ?? 0;
  if (commit < added) return "absent";
  if (node.removedAt !== undefined) {
    if (commit === node.removedAt) return "removed";
    if (commit > node.removedAt) return "absent";
  }
  if (commit === added && added > 0) return "added";
  if (node.renamedAt === commit) return "renamed";
  if (node.modifiedAt?.includes(commit)) return "modified";
  return "unchanged";
}

export function labelAt(node: DemoNode, commit: number) {
  if (node.renamedAt !== undefined && commit < node.renamedAt && node.renamedFrom) {
    return node.renamedFrom;
  }
  return node.label;
}

export function diffCounts(commit: number) {
  let added = 0;
  let removed = 0;
  let modified = 0;
  let renamed = 0;
  for (const n of NODES) {
    const s = statusAt(n, commit);
    if (s === "added") added++;
    else if (s === "removed") removed++;
    else if (s === "modified") modified++;
    else if (s === "renamed") renamed++;
  }
  return { added, removed, modified, renamed };
}

export function temporalDescription(node: DemoNode, commit: number) {
  const s = statusAt(node, commit);
  const c = COMMITS[commit]?.label ?? "HEAD";
  switch (s) {
    case "added":
      return `Added in ${c}`;
    case "removed":
      return `Removed in ${c}`;
    case "modified":
      return `Modified in ${c}`;
    case "renamed":
      return `${node.renamedFrom} → ${node.label}`;
    case "absent":
      return "Not present at this commit";
    default:
      return "Unchanged";
  }
}

export const STATUS_COLOR: Record<TemporalStatus, string> = {
  added: "var(--success)",
  removed: "var(--danger)",
  modified: "var(--warning)",
  renamed: "var(--info)",
  unchanged: "oklch(0.58 0 0)",
};

/** Agent context: the selected node plus its direct relationships. */
export function contextFor(id: string) {
  return [id, ...(NEIGHBORS[id] ?? [])];
}
