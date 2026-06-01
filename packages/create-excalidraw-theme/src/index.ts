#!/usr/bin/env node
import { Command } from "commander";
import { scaffoldTheme } from "./scaffold.js";

const program = new Command();

program
  .name("create-excalidraw-theme")
  .description("Scaffold a new excalidraw-skill-pack theme package")
  .argument("<slug>", "kebab-case theme name")
  .option("--from <parent>", "Parent theme name to extend", "default-sketchy")
  .option("--description <text>", "Theme description", "Custom theme")
  .option("--author <name>", "Author name", "Anonymous")
  .action(
    async (
      slug: string,
      opts: { from: string; description: string; author: string }
    ) => {
      const dir = await scaffoldTheme({
        slug,
        description: opts.description,
        author: opts.author,
        parent: opts.from,
        cwd: process.cwd()
      });
      console.log(`Theme scaffolded at: ${dir}`);
      console.log("Next steps:");
      console.log(`  cd ${dir}`);
      console.log(`  # edit palette.json + palette.md`);
      console.log(`  npm publish --access public`);
      console.log(`  cd src/... && uv build && uv publish`);
    }
  );

program.parseAsync(process.argv).catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
