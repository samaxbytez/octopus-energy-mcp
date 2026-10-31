// Live attack test: fires hostile values at every string argument of every tool
// and asserts requests stay under /v1/, carry no injected headers or query keys,
// and that the credential never reaches the evil host (including via 302).
import http from "node:http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const KEY = "SECRET-API-KEY-12345";
const fake = [];
const evil = [];
const record = (store) => (req, res) => {
  store.push({ url: req.url, headers: req.headers });
  if (store === fake && req.url.includes("REDIRECT")) {
    res.writeHead(302, { Location: `http://evil.example/steal` }).end();
    return;
  }
  res.setHeader("content-type", "application/json").end(
    JSON.stringify({ properties: [], results: [], count: 0 })
  );
};
const listen = (s) => new Promise((r) => s.listen(0, "127.0.0.1", () => r(s.address().port)));
const fakeSrv = http.createServer(record(fake));
const evilSrv = http.createServer(record(evil));
const [fakePort, evilPort] = [await listen(fakeSrv), await listen(evilSrv)];

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["--import", "./scripts/attack-preload.mjs", "build/index.js"],
  env: {
    PATH: process.env.PATH,
    OCTOPUS_ENERGY_API_KEY: KEY,
    OCTOPUS_ENERGY_ACCOUNT_NUMBER: "A-TEST1234",
    ATTACK_FAKE_PORT: String(fakePort),
    ATTACK_EVIL_PORT: String(evilPort),
  },
  stderr: "pipe",
});
let stderr = "";
transport.stderr?.on("data", (d) => (stderr += d));
const client = new Client({ name: "attack", version: "0.0.0" });
await client.connect(transport);

const HOSTILE = [
  "../x", "..%2fx", "%2e%2e/x", "%2E%2E%2Fx", "/../../x", "..\\x",
  "https://evil.example/x", "//evil.example/x", "http://evil.example@api.octopus.energy/",
  "＠evil.example", "REDIRECT", "A-REDIRECT",
  "x\r\nX-Injected: 1", "x\nHost: evil.example", "1?inj=1", "1&inj=1", "1#frag",
  "x\u0000y", "a".repeat(5000), "", " ", "constructor", "__proto__",
];

const { tools } = await client.listTools();
let calls = 0;
for (const tool of tools) {
  const props = Object.entries(tool.inputSchema.properties ?? {});
  for (const [name, schema] of props) {
    if (schema.type !== "string") continue;
    for (const value of HOSTILE) {
      // fill other required string args with valid values
      const args = { [name]: value };
      for (const [n, s] of props) {
        if (n !== name && (tool.inputSchema.required ?? []).includes(n) && s.type === "string") {
          args[n] = "VALID-ID";
        }
      }
      // extra prototype-pollution style keys
      args.__proto__ = { polluted: true };
      args.constructor = "x";
      await client.callTool({ name: tool.name, arguments: args }).catch(() => {});
      calls++;
    }
  }
}
// credentialed redirect path
for (const t of ["octopus_energy_get_account"]) {
  await client.callTool({ name: t, arguments: { account_number: "A-REDIRECT" } }).catch(() => {});
  calls++;
}
// valid control calls (auto-discovery uses configured account)
await client.callTool({ name: "octopus_energy_get_account", arguments: { account_number: "A-TEST1234" } });
await client.close();
fakeSrv.close();
evilSrv.close();

const failures = [];
const ALLOWED_QUERY = new Set([
  "brand", "is_variable", "is_business", "is_green", "is_prepay", "available_at", "page",
  "tariffs_active_at", "period_from", "period_to", "page_size", "order_by", "group_by",
]);
for (const r of fake) {
  const u = new URL(r.url, "http://x");
  if (!u.pathname.startsWith("/v1/")) failures.push(`outside base: ${r.url}`);
  if (/%2e|%2f|%5c|\.\./i.test(u.pathname)) failures.push(`traversal reached API: ${r.url}`);
  for (const k of u.searchParams.keys()) if (!ALLOWED_QUERY.has(k)) failures.push(`injected query ${k}: ${r.url}`);
  if (r.headers["x-injected"] || r.headers.host?.includes("evil")) failures.push(`injected header: ${r.url}`);
}
if (evil.length) failures.push(`evil host received ${evil.length} request(s)`);
if (JSON.stringify(evil).includes(KEY) || JSON.stringify(evil).toLowerCase().includes("authorization")) {
  failures.push("credential leaked to evil host");
}
if (stderr.includes(KEY) || Buffer.from(KEY + ":").toString("base64") && stderr.includes(Buffer.from(KEY + ":").toString("base64"))) {
  failures.push("credential appeared in server stderr");
}

console.log(`attack: ${calls} calls, ${fake.length} reached fake API, ${evil.length} reached evil host`);
if (failures.length) {
  console.error([...new Set(failures)].slice(0, 20).join("\n"));
  process.exit(1);
}
console.log("attack: ok");
