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

const PAD = 4;
const VIEW_PAD = 10;

/** Includes stroke halo so measured boxes match what the SVG actually paints. */
export function textWidth(text: string, fontSize: number) {
  return text.length * fontSize * 0.72 + 6;
}

type Candidate = { ax: number; ay: number; anchor: LabelAnchor; cost: number };

/** Ordered by preference — earlier candidates carry a lower base cost. */
const CANDIDATES: Candidate[] = [
  { ax: 1, ay: 0.15, anchor: "start", cost: 0 },
  { ax: 1, ay: -1.05, anchor: "start", cost: 1.2 },
  { ax: 1, ay: 1.35, anchor: "start", cost: 1.6 },
  { ax: -1, ay: 0.15, anchor: "end", cost: 1.8 },
  { ax: -1, ay: -1.05, anchor: "end", cost: 2.2 },
  { ax: -1, ay: 1.35, anchor: "end", cost: 2.6 },
  { ax: 0, ay: -1.85, anchor: "middle", cost: 3.2 },
  { ax: 0, ay: 2.15, anchor: "middle", cost: 3.6 },
];

function overlap(a: Box, b: Box) {
  return !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2);
}

export function boxFor(n: LabelInput, c: Candidate, gap: number, w: number): Box {
  const h = n.fontSize * 1.35;
  const ox = c.ax * (n.r + gap);
  const oy = c.ay * (n.r + gap * 0.7);
  const cx = n.x + ox;
  const cy = n.y + oy;
  const x1 = c.anchor === "start" ? cx : c.anchor === "end" ? cx - w : cx - w / 2;
  return { x1: x1 - PAD, y1: cy - h * 0.78, x2: x1 + w + PAD, y2: cy + h * 0.32 };
}

export function labelInView(box: Box, view: { w: number; h: number }, pad = VIEW_PAD) {
  return box.x1 >= pad && box.y1 >= pad && box.x2 <= view.w - pad && box.y2 <= view.h - pad;
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
    x1: o.x - o.r - 3,
    y1: o.y - o.r - 3,
    x2: o.x + o.r + 3,
    y2: o.y + o.r + 3,
  }));

  let count = 0;
  for (const n of ordered) {
    if (count >= max) break;
    const w = textWidth(n.text, n.fontSize);

    let best: { cand: Candidate; gap: number; box: Box; score: number } | null = null;

    for (const gap of [10, 16, 24, 34]) {
      for (const c of CANDIDATES) {
        const box = boxFor(n, c, gap, w);
        if (!labelInView(box, view)) continue;

        let score = c.cost + (gap - 10) * 0.18;
        const inward =
          (c.ax > 0 && n.x < view.w * 0.55) ||
          (c.ax < 0 && n.x > view.w * 0.45) ||
          (c.ax === 0 && ((c.ay < 0 && n.y > view.h * 0.4) || (c.ay > 0 && n.y < view.h * 0.6)));
        if (!inward) score += 1.5;
        for (const p of placed) if (overlap(box, p)) score += 50;
        for (const nb of nodeBoxes) if (overlap(box, nb)) score += 16;

        if (!best || score < best.score) best = { cand: c, gap, box, score };
        if (score === 0) break;
      }
      if (best && best.score < 1.5) break;
    }

    if (!best) continue;
    if (best.score >= 50) continue;

    placed.push(best.box);
    count += 1;
    out[n.id] = {
      dx: best.cand.ax * (n.r + best.gap),
      dy: best.cand.ay * (n.r + best.gap * 0.7),
      anchor: best.cand.anchor,
      leader: best.gap >= 34,
    };
  }

  return out;
}
