declare const __VERSION__: string | undefined;

import { createRequire } from "node:module";

// Inlined by scripts/bundle.mjs; falls back to package.json under tsc/vitest.
export const VERSION: string =
  typeof __VERSION__ === "string"
    ? __VERSION__
    : (createRequire(import.meta.url)("../package.json") as { version: string }).version;
