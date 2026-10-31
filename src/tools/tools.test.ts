import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { OctopusEnergyClient } from "../client.js";
import { registerAccountTools } from "./accounts.js";
import { registerProductTools } from "./products.js";
import { registerConsumptionTools } from "./consumption.js";
import { registerTariffTools } from "./tariffs.js";
import { clearAccountCache } from "../resources/account.js";

type ToolHandler = (...args: any[]) => any;

function createMockServer() {
  const tools = new Map<string, ToolHandler>();
  return {
    server: {
      registerTool: vi.fn((name: string, _config: unknown, cb: ToolHandler) => {
        tools.set(name, cb);
      }),
    } as any,
    tools,
  };
}

function createMockClient() {
  return {
    get: vi.fn().mockResolvedValue({ data: "mock" }),
  } as unknown as OctopusEnergyClient;
}

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  clearAccountCache();
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
});

describe("registerAccountTools", () => {
  it("registers 1 tool", () => {
    const { server } = createMockServer();
    const client = createMockClient();
    registerAccountTools(server, client);
    expect(server.registerTool).toHaveBeenCalledTimes(1);
  });

  it("octopus_energy_get_account calls client.get with auth", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerAccountTools(server, client);

    const handler = tools.get("octopus_energy_get_account")!;
    const result = await handler({ account_number: "A-1234ABCD" });

    expect(client.get).toHaveBeenCalledWith("/v1/accounts/A-1234ABCD/", undefined, true);
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual({ data: "mock" });
  });

  it("returns errorResponse when client throws", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    (client.get as any).mockRejectedValue(new Error("connection failed"));
    registerAccountTools(server, client);

    const handler = tools.get("octopus_energy_get_account")!;
    const result = await handler({ account_number: "A-1234ABCD" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Error: connection failed");
  });
});

describe("registerProductTools", () => {
  it("registers 2 tools", () => {
    const { server } = createMockServer();
    const client = createMockClient();
    registerProductTools(server, client);
    expect(server.registerTool).toHaveBeenCalledTimes(2);
  });

  it("octopus_energy_list_products calls client.get without auth", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerProductTools(server, client);

    const handler = tools.get("octopus_energy_list_products")!;
    await handler({ brand: "OCTOPUS_ENERGY" });

    expect(client.get).toHaveBeenCalledWith(
      "/v1/products/",
      expect.objectContaining({ brand: "OCTOPUS_ENERGY" })
    );
  });

  it("octopus_energy_get_product calls correct endpoint", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerProductTools(server, client);

    const handler = tools.get("octopus_energy_get_product")!;
    await handler({ product_code: "AGILE-FLEX-22-11-25" });

    expect(client.get).toHaveBeenCalledWith(
      "/v1/products/AGILE-FLEX-22-11-25/",
      expect.any(Object)
    );
  });
});

describe("registerConsumptionTools", () => {
  it("registers 2 tools", () => {
    const { server } = createMockServer();
    const client = createMockClient();
    registerConsumptionTools(server, client);
    expect(server.registerTool).toHaveBeenCalledTimes(2);
  });

  it("octopus_energy_get_electricity_consumption calls correct endpoint with auth", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerConsumptionTools(server, client);

    const handler = tools.get("octopus_energy_get_electricity_consumption")!;
    await handler({
      mpan: "1234567890123",
      serial_number: "ABC123",
      period_from: "2024-01-01T00:00Z",
      period_to: "2024-01-31T23:59Z",
    });

    expect(client.get).toHaveBeenCalledWith(
      "/v1/electricity-meter-points/1234567890123/meters/ABC123/consumption/",
      expect.objectContaining({
        period_from: "2024-01-01T00:00Z",
        period_to: "2024-01-31T23:59Z",
      }),
      true
    );
  });

  it("octopus_energy_get_gas_consumption calls correct endpoint with auth", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerConsumptionTools(server, client);

    const handler = tools.get("octopus_energy_get_gas_consumption")!;
    await handler({
      mprn: "9876543210",
      serial_number: "GAS001",
      group_by: "day",
    });

    expect(client.get).toHaveBeenCalledWith(
      "/v1/gas-meter-points/9876543210/meters/GAS001/consumption/",
      expect.objectContaining({ group_by: "day" }),
      true
    );
  });

  it("returns error when no mpan/serial and no account number", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerConsumptionTools(server, client);

    const handler = tools.get("octopus_energy_get_electricity_consumption")!;
    const result = await handler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("MPAN and serial number are required");
  });

  it("auto-discovers electricity meter from account when mpan/serial omitted", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();

    // First call returns account data, second call returns consumption data
    (client.get as any)
      .mockResolvedValueOnce({
        properties: [
          {
            electricity_meter_points: [
              {
                mpan: "AUTO_MPAN_123",
                meters: [{ serial_number: "AUTO_SERIAL" }],
                agreements: [
                  {
                    tariff_code: "E-1R-VAR-22-11-01-C",
                    valid_from: "2020-01-01T00:00Z",
                    valid_to: null,
                  },
                ],
              },
            ],
            gas_meter_points: [],
          },
        ],
      })
      .mockResolvedValueOnce({ results: [] });

    registerConsumptionTools(server, client, "A-TEST1234");

    const handler = tools.get("octopus_energy_get_electricity_consumption")!;
    await handler({ period_from: "2024-01-01T00:00Z" });

    // Second call should use auto-discovered meter details
    expect(client.get).toHaveBeenCalledWith(
      "/v1/electricity-meter-points/AUTO_MPAN_123/meters/AUTO_SERIAL/consumption/",
      expect.objectContaining({ period_from: "2024-01-01T00:00Z" }),
      true
    );
  });

  it("auto-discovers gas meter from account when mprn/serial omitted", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();

    (client.get as any)
      .mockResolvedValueOnce({
        properties: [
          {
            electricity_meter_points: [],
            gas_meter_points: [
              {
                mprn: "AUTO_MPRN_456",
                meters: [{ serial_number: "AUTO_GAS_SERIAL" }],
                agreements: [
                  {
                    tariff_code: "G-1R-VAR-22-11-01-C",
                    valid_from: "2020-01-01T00:00Z",
                    valid_to: null,
                  },
                ],
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({ results: [] });

    registerConsumptionTools(server, client, "A-TEST1234");

    const handler = tools.get("octopus_energy_get_gas_consumption")!;
    await handler({ group_by: "day" });

    expect(client.get).toHaveBeenCalledWith(
      "/v1/gas-meter-points/AUTO_MPRN_456/meters/AUTO_GAS_SERIAL/consumption/",
      expect.objectContaining({ group_by: "day" }),
      true
    );
  });
});

describe("registerTariffTools", () => {
  it("registers 6 tools", () => {
    const { server } = createMockServer();
    const client = createMockClient();
    registerTariffTools(server, client);
    expect(server.registerTool).toHaveBeenCalledTimes(6);
  });

  it("octopus_energy_get_electricity_standard_unit_rates calls correct endpoint", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerTariffTools(server, client);

    const handler = tools.get("octopus_energy_get_electricity_standard_unit_rates")!;
    await handler({
      product_code: "AGILE-FLEX-22-11-25",
      tariff_code: "E-1R-AGILE-FLEX-22-11-25-C",
      period_from: "2024-01-01T00:00Z",
    });

    expect(client.get).toHaveBeenCalledWith(
      "/v1/products/AGILE-FLEX-22-11-25/electricity-tariffs/E-1R-AGILE-FLEX-22-11-25-C/standard-unit-rates/",
      expect.objectContaining({ period_from: "2024-01-01T00:00Z" })
    );
  });

  it("octopus_energy_get_gas_standing_charges calls correct endpoint", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerTariffTools(server, client);

    const handler = tools.get("octopus_energy_get_gas_standing_charges")!;
    await handler({
      product_code: "VAR-22-11-01",
      tariff_code: "G-1R-VAR-22-11-01-C",
    });

    expect(client.get).toHaveBeenCalledWith(
      "/v1/products/VAR-22-11-01/gas-tariffs/G-1R-VAR-22-11-01-C/standing-charges/",
      expect.any(Object)
    );
  });

  it("returns errorResponse when tariff tool throws", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    (client.get as any).mockRejectedValue(new Error("not found"));
    registerTariffTools(server, client);

    const handler = tools.get("octopus_energy_get_electricity_standing_charges")!;
    const result = await handler({
      product_code: "TEST",
      tariff_code: "E-1R-TEST-C",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Error: not found");
  });
});
