import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium, type Browser } from "playwright";

export interface RenderOptions {
  theme?: string;
  scale?: number;
  width?: number;
}

export interface BatchItem {
  json: string;
  opts?: RenderOptions;
}

const TEMPLATE_URL = `file://${join(dirname(fileURLToPath(import.meta.url)), "render_template.html")}`;

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

function viewportFor(json: string, width: number): { width: number; height: number } {
  const data = JSON.parse(json) as { type?: string; elements?: Array<Record<string, unknown>> };

  if (data.type === "excalidraw-skeleton" || data.type === "mermaid") {
    // Skeleton/Mermaid documents have no final geometry until they're resolved
    // in the browser, so the bounding box can't be computed node-side. Use a
    // generous viewport — the SVG-element screenshot captures the true size.
    return { width, height: 2400 };
  }

  const elements = (data.elements ?? []).filter((e) => !e["isDeleted"]);
  const [minX, minY, maxX, maxY] = computeBoundingBox(elements);
  const padding = 80;
  return {
    width: Math.min(Math.round(maxX - minX + padding * 2), width),
    height: Math.max(Math.round(maxY - minY + padding * 2), 600),
  };
}

/**
 * Owns a single headless Chromium instance and reuses it across renders.
 * Browser launch dominates render cost; each diagram still gets its own
 * context sized to its bounding box, so output is identical to a one-shot
 * render. Call `close()` when done, or use `renderToPng`/`renderMany` which
 * manage the lifecycle for you.
 */
export class Renderer {
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
    return this.browser;
  }

  async render(json: string, opts: RenderOptions = {}): Promise<Buffer> {
    const { scale = 2, width = 1200 } = opts;
    const { width: vpW, height: vpH } = viewportFor(json, width);

    const browser = await this.getBrowser();
    const context = await browser.newContext({
      viewport: { width: vpW, height: vpH },
      deviceScaleFactor: scale,
    });
    try {
      const page = await context.newPage();
      await page.goto(TEMPLATE_URL);
      await page.waitForFunction("window.__moduleReady === true", { timeout: 30000 });

      const result = await page.evaluate(
        (jsonStr) =>
          (
            globalThis as unknown as {
              renderDiagram: (s: string) => Promise<{ success: boolean; error?: string }>;
            }
          ).renderDiagram(jsonStr),
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
      return Buffer.from(png);
    } finally {
      await context.close();
    }
  }

  async hydrate(json: string): Promise<string> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.goto(TEMPLATE_URL);
      await page.waitForFunction("window.__moduleReady === true", { timeout: 30000 });
      return await page.evaluate(
        (jsonStr) =>
          (globalThis as unknown as { hydrateSkeleton: (s: string) => string }).hydrateSkeleton(jsonStr),
        json
      );
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export async function renderToPng(json: string, opts: RenderOptions = {}): Promise<Buffer> {
  const renderer = new Renderer();
  try {
    return await renderer.render(json, opts);
  } finally {
    await renderer.close();
  }
}

export async function hydrateSkeleton(json: string): Promise<string> {
  const renderer = new Renderer();
  try {
    return await renderer.hydrate(json);
  } finally {
    await renderer.close();
  }
}

/**
 * Render many diagrams reusing one browser. The expensive Chromium launch
 * happens once instead of once per diagram. Results are returned in input
 * order.
 */
export async function renderMany(items: BatchItem[]): Promise<Buffer[]> {
  const renderer = new Renderer();
  try {
    const out: Buffer[] = [];
    for (const item of items) {
      out.push(await renderer.render(item.json, item.opts));
    }
    return out;
  } finally {
    await renderer.close();
  }
}
