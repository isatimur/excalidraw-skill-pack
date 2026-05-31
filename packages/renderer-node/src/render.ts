import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";

export interface RenderOptions {
  theme?: string;
  scale?: number;
  width?: number;
}

function computeBoundingBox(elements: Array<Record<string, unknown>>): [number, number, number, number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    if (el["isDeleted"]) continue;
    const x = (el["x"] as number) ?? 0;
    const y = (el["y"] as number) ?? 0;
    const w = (el["width"] as number) ?? 0;
    const h = (el["height"] as number) ?? 0;

    if ((el["type"] === "arrow" || el["type"] === "line") && Array.isArray(el["points"])) {
      for (const [px, py] of el["points"] as Array<[number, number]>) {
        minX = Math.min(minX, x + px);
        minY = Math.min(minY, y + py);
        maxX = Math.max(maxX, x + px);
        maxY = Math.max(maxY, y + py);
      }
    } else {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + Math.abs(w));
      maxY = Math.max(maxY, y + Math.abs(h));
    }
  }

  if (minX === Infinity) return [0, 0, 800, 600];
  return [minX, minY, maxX, maxY];
}

export async function renderToPng(json: string, opts: RenderOptions = {}): Promise<Buffer> {
  const { scale = 2, width = 1200 } = opts;

  const data = JSON.parse(json) as { elements?: Array<Record<string, unknown>> };
  const elements = (data.elements ?? []).filter((e) => !e["isDeleted"]);
  const [minX, minY, maxX, maxY] = computeBoundingBox(elements);
  const padding = 80;
  const vpW = Math.min(Math.round(maxX - minX + padding * 2), width);
  const vpH = Math.max(Math.round(maxY - minY + padding * 2), 600);

  const templatePath = join(dirname(fileURLToPath(import.meta.url)), "render_template.html");
  const templateUrl = `file://${templatePath}`;

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: vpW, height: vpH },
      deviceScaleFactor: scale,
    });
    const page = await context.newPage();
    await page.goto(templateUrl);
    await page.waitForFunction("window.__moduleReady === true", { timeout: 30000 });

    const result = await page.evaluate(
      (jsonStr) => (window as unknown as { renderDiagram: (s: string) => Promise<{ success: boolean; error?: string }> }).renderDiagram(jsonStr),
      json
    );

    if (!result || !result.success) {
      throw new Error(`Render failed: ${result?.error ?? "renderDiagram returned null"}`);
    }

    await page.waitForFunction("window.__renderComplete === true", { timeout: 15000 });

    const svgEl = await page.$("#root svg");
    if (!svgEl) {
      throw new Error("No SVG element found after render");
    }

    const png = await svgEl.screenshot({ type: "png" });
    await context.close();
    return Buffer.from(png);
  } finally {
    await browser.close();
  }
}
