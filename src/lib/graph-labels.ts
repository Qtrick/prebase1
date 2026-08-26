/**
 * Deterministic, collision-aware label placement for the demo graph.
 *
 * There are only ~22 nodes, so a small candidate-position search is cheap and
 * produces far better results than the naive "always to the right" placement.
 * Given the same inputs the output is always identical, so labels never jitter.
 */

export type LabelAnchor = "start" | "end" | "middle";

export type LabelInput = {
  id: string;
  x: number;
  y: number;
  /** node radius */
  r: number;
  text: string;
  fontSize: number;
};

export type LabelPlacement = {
  dx: number;
  dy: number;
  anchor: LabelAnchor;
  /** true when the label sits far enough away to warrant a leader line */
  leader: boolean;
};

type Box = { x1: number; y1: number; x2: number; y2: number };

const PAD = 3;

/** Monospace advance width is ~0.6em; good enough without DOM measurement. */
export function textWidth(text: string, fontSize: number) {
  return text.length * fontSize * 0.6;
}

type Candidate = { ax: number; ay: number; anchor: LabelAnchor; cost: number };

/** Ordered by preference — earlier candidates carry a lower base cost. */
const CANDIDATES: Candidate[] = [
  { ax: 1, ay: 0.28, anchor: "start", cost: 0 },
  { ax: -1, ay: 0.28, anchor: "end", cost: 1 },
  { ax: 1, ay: -0.9, anchor: "start", cost: 2 },
  { ax: -1, ay: -0.9, anchor: "end", cost: 2.4 },
  { ax: 1, ay: 1.5, anchor: "start", cost: 2.8 },
  { ax: -1, ay: 1.5, anchor: "end", cost: 3.2 },
  { ax: 0, ay: -1.3, anchor: "middle", cost: 3.6 },
  { ax: 0, ay: 1.9, anchor: "middle", cost: 4 },
];

function overlap(a: Box, b: Box) {
  return !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2);
}

function boxFor(
  n: LabelInput,
  c: Candidate,
  gap: number,
  w: number,
): Box {
  const h = n.fontSize * 1.15;
  const ox = c.ax * (n.r + gap);
  const oy = c.ay * (n.r + gap * 0.6);
  const cx = n.x + ox;
  const cy = n.y + oy;
  const x1 = c.anchor === "start" ? cx : c.anchor === "end" ? cx - w : cx - w / 2;
  return { x1: x1 - PAD, y1: cy - h + PAD, x2: x1 + w + PAD, y2: cy + PAD };
}

/**
 * Resolve label positions in the given order. Callers pass nodes already
 * sorted by priority (most important first) so high-priority labels always
 * win their preferred slot and can never be hidden by a lesser one.
 */
export function resolveLabelPlacements(
  ordered: LabelInput[],
  obstacles: Array<{ x: number; y: number; r: number }>,
  view: { w: number; h: number },
  options: { maxLabels?: number } = {},
): Record<string, LabelPlacement> {
  const out: Record<string, LabelPlacement> = {};
  const placed: Box[] = [];
  const max = options.maxLabels ?? ordered.length;

  const nodeBoxes: Box[] = obstacles.map((o) => ({
    x1: o.x - o.r - 2,
    y1: o.y - o.r - 2,
    x2: o.x + o.r + 2,
    y2: o.y + o.r + 2,
  }));

  let count = 0;
  for (const n of ordered) {
    if (count >= max) break;
    const w = textWidth(n.text, n.fontSize);

    let best: { cand: Candidate; gap: number; box: Box; score: number } | null = null;

    for (const gap of [8, 14, 22]) {
      for (const c of CANDIDATES) {
        const box = boxFor(n, c, gap, w);
        let score = c.cost + (gap - 8) * 0.22;

        // viewport containment
        if (box.x1 < 4) score += (4 - box.x1) * 0.6;
        if (box.x2 > view.w - 4) score += (box.x2 - (view.w - 4)) * 0.6;
        if (box.y1 < 4) score += (4 - box.y1) * 0.6;
        if (box.y2 > view.h - 4) score += (box.y2 - (view.h - 4)) * 0.6;

        for (const p of placed) if (overlap(box, p)) score += 40;
        for (const nb of nodeBoxes) if (overlap(box, nb)) score += 14;

        if (!best || score < best.score) best = { cand: c, gap, box, score };
        if (score === 0) break;
      }
      if (best && best.score < 1.5) break;
    }

    if (!best) continue;

    // Every slot is badly taken — drop this (lowest priority) label instead of
    // stacking text on top of an already placed one.
    if (best.score >= 40 && count > 3) continue;

    placed.push(best.box);
    count += 1;
    out[n.id] = {
      dx: best.cand.ax * (n.r + best.gap),
      dy: best.cand.ay * (n.r + best.gap * 0.6),
      anchor: best.cand.anchor,
      leader: best.gap >= 22,
    };
  }

  return out;
}
