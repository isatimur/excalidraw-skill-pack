import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const schema = JSON.parse(
  readFileSync(join(__dirname, "..", "theme.schema.json"), "utf-8")
);

const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true });
addFormats(ajv);
const validator = ajv.compile(schema);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateThemeJson(data: unknown): ValidationResult {
  const valid = validator(data) as boolean;
  const errors = valid
    ? []
    : (validator.errors ?? []).map(
        (e) => `${e.instancePath || "/"} ${e.message ?? "invalid"}`
      );
  return { valid, errors };
}

// CLI entry: `validate-theme <path>`
if (import.meta.url === `file://${process.argv[1]}`) {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: validate-theme <path-to-theme.json-or-dir>");
    process.exit(2);
  }
  const file = target.endsWith(".json") ? target : join(target, "theme.json");
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(file, "utf-8"));
  } catch (e) {
    console.error(`Cannot read ${file}: ${(e as Error).message}`);
    process.exit(2);
  }
  const result = validateThemeJson(data);
  if (result.valid) {
    console.log(`OK: ${file}`);
    process.exit(0);
  } else {
    console.error(`INVALID: ${file}`);
    for (const err of result.errors) console.error(`  ${err}`);
    process.exit(1);
  }
}
