# Development

Node.js 24+.

```bash
npm ci
npm run lint
npm run type-check
npm test
npm run build      # bundles src/ into build/index.js with esbuild
npm run smoke      # starts build/index.js over MCP and checks version, tools, annotations
npm run attack     # hostile-input test against a fake API (needs a build)
```

`@modelcontextprotocol/sdk`, `zod` and `esbuild` are devDependencies and are bundled; the published package has no runtime dependencies. `scripts/bundle.mjs` inlines the version and writes `build/THIRD_PARTY_LICENSES.txt`, failing if a bundled package has no licence file.

## Adding a tool

1. Add it under `src/tools/` with `annotations: READ_ONLY_ANNOTATIONS`.
2. Use `idSchema` for any value that goes into a request path.
3. Register it in `src/index.ts`.
4. Update the tool counts in `scripts/smoke.mjs` and `src/tools/schemas.test.ts`, and [tools.md](tools.md).

## CI and releases

CI runs on Node 24. Merging a version bump to `main` triggers `publish.yml`: a build job, then a `publish` job in the `npm-publish` environment (manual approval) that publishes with provenance and creates the GitHub release. Dependency bumps to bundled packages (SDK, zod, esbuild) change the shipped code and count as a patch release.
