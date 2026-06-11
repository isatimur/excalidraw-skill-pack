#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, basename, join } from "node:path";
import { Command } from "commander";
import { renderToPng, hydrateSkeleton } from "./render.js";

const program = new Command();

program
  .name("excalidraw-render")
  .description("Render an Excalidraw JSON file to PNG")
  .argument("<input>", "Path to .excalidraw file")
  .option("--theme <name>", "Theme name", "default-sketchy")
  .option("-o, --output <path>", "Output PNG path")
  .option("--scale <number>", "Device pixel ratio", "2")
  .option("--width <number>", "Max viewport width in px", "1200")
  .action(async (input: string, opts: { theme: string; output?: string; scale: string; width: string }) => {
    const inputPath = resolve(input);
    const outputPath = opts.output
      ? resolve(opts.output)
      : join(dirname(inputPath), basename(inputPath, ".excalidraw") + ".png");

    const json = await readFile(inputPath, "utf-8");
    const png = await renderToPng(json, {
      theme: opts.theme,
      scale: parseInt(opts.scale, 10),
      width: parseInt(opts.width, 10),
    });
    await writeFile(outputPath, png);
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
