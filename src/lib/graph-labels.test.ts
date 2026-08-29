import { describe, expect, it } from "vitest";
import { labelInView, resolveLabelPlacements, textWidth, type LabelInput } from "./graph-labels";

function node(partial: Partial<LabelInput> & Pick<LabelInput, "id" | "x" | "y" | "text">): LabelInput {
  return { r: 6, fontSize: 13, ...partial };
}

describe("graph label placement", () => {
  it("keeps every placed label fully inside the view", () => {
    const view = { w: 312, h: 388 };
    const nodes = [
      node({ id: "parser", x: 70, y: 260, text: "parser.ts" }),
      node({ id: "layouts", x: 48, y: 240, text: "layouts.ts" }),
      node({ id: "cache", x: 56, y: 300, text: "cache.ts" }),
      node({ id: "graph", x: 160, y: 180, text: "graphService.ts" }),
    ];
    const obstacles = nodes.map((n) => ({ x: n.x, y: n.y, r: n.r }));
    const placed = resolveLabelPlacements(nodes, obstacles, view);
    expect(Object.keys(placed).length).toBeGreaterThan(0);
    for (const id of Object.keys(placed)) {
      const n = nodes.find((item) => item.id === id)!;
      const p = placed[id]!;
      const w = textWidth(n.text, n.fontSize);
      const ax = p.anchor === "start" ? 1 : p.anchor === "end" ? -1 : 0;
      const box = {
        x1: p.anchor === "start" ? n.x + p.dx : p.anchor === "end" ? n.x + p.dx - w : n.x + p.dx - w / 2,
        y1: n.y + p.dy - n.fontSize,
        x2: 0,
        y2: n.y + p.dy + 6,
      };
      box.x2 = box.x1 + w;
      expect(labelInView({ x1: box.x1 - 2, y1: box.y1, x2: box.x2 + 2, y2: box.y2 }, view, 2)).toBe(true);
      expect(ax === 0 || p.dx !== 0).toBe(true);
    }
  });

  it("places a left-edge label fully on-canvas instead of clipping", () => {
    const view = { w: 312, h: 388 };
    const n = node({ id: "parser", x: 72, y: 240, text: "parser.ts", r: 5 });
    const placed = resolveLabelPlacements([n], [{ x: n.x, y: n.y, r: n.r }], view);
    expect(placed.parser).toBeDefined();
    const p = placed.parser!;
    const w = textWidth(n.text, n.fontSize);
    const x1 = p.anchor === "start" ? n.x + p.dx : p.anchor === "end" ? n.x + p.dx - w : n.x + p.dx - w / 2;
    const box = { x1, y1: n.y + p.dy - n.fontSize, x2: x1 + w, y2: n.y + p.dy + 6 };
    expect(labelInView(box, view, 2)).toBe(true);
    expect(p.anchor).toBe("start");
  });

  it("drops a label rather than overlapping an already placed one", () => {
    const view = { w: 200, h: 120 };
    const nodes = [
      node({ id: "a", x: 100, y: 60, text: "graphService.ts", r: 8 }),
      node({ id: "b", x: 108, y: 64, text: "parser.ts", r: 5 }),
      node({ id: "c", x: 104, y: 70, text: "layouts.ts", r: 4 }),
    ];
    const obstacles = nodes.map((n) => ({ x: n.x, y: n.y, r: n.r + 8 }));
    const placed = resolveLabelPlacements(nodes, obstacles, view);
    expect(placed.a).toBeDefined();
    const boxes = Object.entries(placed).map(([id, p]) => {
      const n = nodes.find((item) => item.id === id)!;
      const w = textWidth(n.text, n.fontSize);
      const x1 = p.anchor === "start" ? n.x + p.dx : p.anchor === "end" ? n.x + p.dx - w : n.x + p.dx - w / 2;
      return { x1, y1: n.y + p.dy - 10, x2: (p.anchor === "start" ? n.x + p.dx : p.anchor === "end" ? n.x + p.dx : n.x + p.dx - w / 2) + (p.anchor === "end" ? 0 : w), y2: n.y + p.dy + 8 };
    });
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!;
        const b = boxes[j]!;
        const hit = !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2);
        expect(hit).toBe(false);
      }
    }
  });
});
