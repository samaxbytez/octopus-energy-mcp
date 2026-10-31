// Test-only: routes api.octopus.energy to the fake API and every other host to
// the "evil" listener, so the harness can see exactly where requests go.
const [fakePort, evilPort] = [process.env.ATTACK_FAKE_PORT, process.env.ATTACK_EVIL_PORT];
const real = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const u = new URL(typeof input === "string" ? input : input.url);
  const port = u.hostname === "api.octopus.energy" ? fakePort : evilPort;
  const headers = { ...(init?.headers ?? {}), "x-orig-host": u.host };
  return real(`http://127.0.0.1:${port}${u.pathname}${u.search}`, { ...init, headers });
};
