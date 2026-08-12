#!/usr/bin/env node
/**
 * Guard: free-floating labels must clear filled shapes, bound labels must leave
 * breathing room inside containers, and connector arrows must stay orthogonal.
 * Catches the class of collisions/routing that made taste-vs-stream look like trash.
 */
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const TYPES = join(ROOT, "packages", "shared", "fixtures", "types");

const dirs = (await readdir(TYPES, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const issues = [];

for (const type of dirs) {
  const doc = JSON.parse(await readFile(join(TYPES, type, "example.excalidraw"), "utf8"));
  const byId = Object.fromEntries(doc.elements.map((e) => [e.id, e]));
  const shapes = doc.elements.filter(
    (e) =>
      ["rectangle", "ellipse", "diamond"].includes(e.type) &&
      e.strokeStyle !== "dashed" &&
      e.backgroundColor !== "transparent"
  );

  for (const t of doc.elements.filter((e) => e.type === "text" && !e.containerId)) {
    const text = t.originalText || t.text;
    // Titles, long captions, and set labels that intentionally sit inside lobes.
    if (text.includes("—") || text.length > 36) continue;
    if (type === "venn" && (text === "Speed" || text === "Quality")) continue;

    for (const s of shapes) {
      const ox = Math.max(0, Math.min(t.x + t.width, s.x + s.width) - Math.max(t.x, s.x));
      const oy = Math.max(0, Math.min(t.y + t.height, s.y + s.height) - Math.max(t.y, s.y));
      if (ox * oy > 80) {
        issues.push(`${type}: free ${JSON.stringify(text)} overlaps ${s.id} (${Math.round(ox * oy)}px)`);
      }
    }
  }

  for (const t of doc.elements.filter((e) => e.type === "text" && e.containerId)) {
    const c = byId[t.containerId];
    if (!c || c.type === "arrow") continue;
    const ratio = t.width / c.width;
    if (ratio > 0.9) {
      issues.push(
        `${type}: bound ${JSON.stringify(t.originalText || t.text)} fills ${(ratio * 100).toFixed(0)}% of ${c.id}`
      );
    }
  }

  // Chart series and crow's-foot ornaments are `line`s — only arrows are routing.
  for (const a of doc.elements.filter((e) => e.type === "arrow" && !e.isDeleted)) {
    const pts = a.points;
    if (!Array.isArray(pts) || pts.length < 2) continue;
    for (let i = 1; i < pts.length; i += 1) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      if (dx > 2 && dy > 2) {
        issues.push(
          `${type}: arrow ${a.id} has diagonal segment (${Math.round(dx)}×${Math.round(dy)})`
        );
        break;
      }
    }
  }
}

if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}
console.log(`ok — ${dirs.length} type fixtures, labels clear, arrows orthogonal`);
