#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, basename, join } from "node:path";
import { Command } from "commander";
import { Renderer, hydrateSkeleton } from "./render.js";

const program = new Command();

function pngPathFor(inputPath: string, outDir?: string): string {
  const name = basename(inputPath, ".excalidraw") + ".png";
  return join(outDir ? resolve(outDir) : dirname(inputPath), name);
}

program
  .name("excalidraw-render")
  .description("Render one or more Excalidraw JSON files to PNG")
  .argument("<inputs...>", "Path(s) to .excalidraw file(s)")
  .option("--theme <name>", "Theme name", "default-sketchy")
  .option("-o, --output <path>", "Output PNG path (single input) or output directory (multiple inputs)")
  .option("--scale <number>", "Device pixel ratio", "2")
  .option("--width <number>", "Max viewport width in px", "1200")
  .action(async (inputs: string[], opts: { theme: string; output?: string; scale: string; width: string }) => {
    const scale = parseInt(opts.scale, 10);
    const width = parseInt(opts.width, 10);
    const single = inputs.length === 1;

    const renderer = new Renderer();
    try {
      for (const input of inputs) {
        const inputPath = resolve(input);
        const outputPath =
          single && opts.output ? resolve(opts.output) : pngPathFor(inputPath, opts.output);

        const json = await readFile(inputPath, "utf-8");
        const png = await renderer.render(json, { theme: opts.theme, scale, width });
        await writeFile(outputPath, png);
      }
    } finally {
      await renderer.close();
    }
  });

program
  .command("hydrate")
  .description("Convert an excalidraw-skeleton document into a full, Excalidraw-openable .excalidraw file")
  .argument("<input>", "Path to skeleton .excalidraw file")
  .option("-o, --output <path>", "Output .excalidraw path (defaults to <input>.full.excalidraw)")
  .action(async (input: string, opts: { output?: string }) => {
    const inputPath = resolve(input);
    const outputPath = opts.output
      ? resolve(opts.output)
      : join(dirname(inputPath), basename(inputPath, ".excalidraw") + ".full.excalidraw");

    const json = await readFile(inputPath, "utf-8");
    const full = await hydrateSkeleton(json);
    await writeFile(outputPath, full);
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  process.stderr.write(String(err) + "\n");
  process.exit(1);
});
