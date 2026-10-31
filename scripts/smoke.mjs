// Starts build/index.js over MCP stdio and checks version, tools, annotations
// and that the package has no runtime dependencies.
import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const fail = (m) => {
  console.error(`smoke: FAIL ${m}`);
  process.exit(1);
};

if (Object.keys(pkg.dependencies ?? {}).length) fail("package has runtime dependencies");

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["build/index.js"],
  env: { PATH: process.env.PATH, OCTOPUS_ENERGY_API_KEY: "", OCTOPUS_ENERGY_ACCOUNT_NUMBER: "" },
  stderr: "ignore",
});
const client = new Client({ name: "smoke", version: "0.0.0" });
await client.connect(transport);

const v = client.getServerVersion();
if (v?.version !== pkg.version) fail(`version ${v?.version} != ${pkg.version}`);

const { tools } = await client.listTools();
if (tools.length !== 11) fail(`expected 11 tools, got ${tools.length}`);
for (const t of tools) {
  if (t.annotations?.readOnlyHint !== true) fail(`${t.name} not readOnly`);
}

await client.close();
console.log(`smoke: ok (v${pkg.version}, ${tools.length} tools)`);
