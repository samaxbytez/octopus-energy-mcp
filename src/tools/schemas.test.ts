import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import type { OctopusEnergyClient } from "../client.js";
import { registerAccountTools } from "./accounts.js";
import { registerProductTools } from "./products.js";
import { registerConsumptionTools } from "./consumption.js";
import { registerTariffTools } from "./tariffs.js";

type Config = {
  annotations?: Record<string, unknown>;
  inputSchema: Record<string, z.ZodType>;
};

const tools = new Map<string, Config>();
const server = {
  registerTool: vi.fn((name: string, config: Config) => void tools.set(name, config)),
} as any;
const client = { get: vi.fn() } as unknown as OctopusEnergyClient;
registerAccountTools(server, client);
registerProductTools(server, client);
registerConsumptionTools(server, client);
registerTariffTools(server, client);

const ID_ARGS = [
  "account_number",
  "mpan",
  "mprn",
  "serial_number",
  "product_code",
  "tariff_code",
];
const PAYLOADS = [
  "../x",
  "%2e%2e/x",
  "1?x",
  "1#x",
  "a/b",
  "a\\b",
  "a b",
  "a\r\nb",
  "x".repeat(101),
  "",
];

describe("tool schemas", () => {
  it("registers 11 read-only tools", () => {
    expect(tools.size).toBe(11);
    for (const [name, c] of tools) {
      expect(c.annotations?.readOnlyHint, name).toBe(true);
      expect(c.annotations?.destructiveHint, name).toBe(false);
    }
  });

  for (const [name, config] of tools) {
    for (const arg of ID_ARGS.filter((a) => a in config.inputSchema)) {
      it(`${name}.${arg} rejects path-injection payloads`, () => {
        for (const p of PAYLOADS) {
          expect(config.inputSchema[arg].safeParse(p).success, JSON.stringify(p)).toBe(
            false
          );
        }
        expect(
          config.inputSchema[arg].safeParse("E-1R-AGILE-FLEX-22-11-25-C").success
        ).toBe(true);
      });
    }
  }
});
