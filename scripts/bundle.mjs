// Bundles src/index.ts into one self-contained build/index.js and writes
// build/THIRD_PARTY_LICENSES.txt for every bundled package.
import { build } from "esbuild";
import { readFileSync, writeFileSync, readdirSync, existsSync, chmodSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
mkdirSync("build", { recursive: true });

const result = await build({
  entryPoints: ["src/index.ts"],
  outfile: "build/index.js",
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  metafile: true,
  legalComments: "none",
  define: { __VERSION__: JSON.stringify(pkg.version) },
  banner: {
    js: 'import { createRequire as __cr } from "node:module";\nconst require = __cr(import.meta.url);',
  },
});

const pkgDirs = new Map();
for (const input of Object.keys(result.metafile.inputs)) {
  const i = input.lastIndexOf("node_modules/");
  if (i === -1) continue;
  const rest = input.slice(i + "node_modules/".length).split("/");
  const name = rest[0].startsWith("@") ? `${rest[0]}/${rest[1]}` : rest[0];
  pkgDirs.set(name, input.slice(0, i) + "node_modules/" + name);
}

const sections = [];
for (const [name, dir] of [...pkgDirs].sort()) {
  const file = readdirSync(dir).find((f) => /^(licen[sc]e|copying)(\..*)?$/i.test(f));
  if (!file) throw new Error(`No licence file for bundled package ${name}`);
  const version = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).version;
  sections.push(`${name}@${version}\n${"-".repeat(40)}\n${readFileSync(join(dir, file), "utf8").trim()}\n`);
}
writeFileSync("build/THIRD_PARTY_LICENSES.txt", sections.join("\n\n"));
chmodSync("build/index.js", 0o755);
console.log(`bundled ${pkgDirs.size} packages -> build/index.js`);
