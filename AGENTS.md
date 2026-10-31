# AGENTS.md

MCP server (stdio) for the Octopus Energy REST API. TypeScript, Node 24+, bundled with esbuild into one file with no runtime dependencies.

## Commands

`npm run lint`, `npm run type-check`, `npm test`, `npm run build`, `npm run smoke`, `npm run attack`.

## Rules

- All tools are read-only GETs. Keep `annotations: READ_ONLY_ANNOTATIONS`.
- Anything interpolated into a request path uses `idSchema` (`src/schemas.ts`). Treat every tool argument as attacker-controlled.
- Requests go through `OctopusEnergyClient` only; do not call `fetch` elsewhere or loosen `resolveApiUrl`.
- Never log or echo the API key.
- SDK, zod and esbuild are devDependencies (bundled). Do not add runtime `dependencies`.
- Conventional commits; `main` is squash-merged via PR. Stage files by name.
- Docs: keep tool counts in `README.md`, `docs/tools.md`, `scripts/smoke.mjs` and tests in sync.
