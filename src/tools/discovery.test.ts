import { describe, it, expect, vi, beforeEach } from "vitest";
import type { OctopusEnergyClient } from "../client.js";
import { registerConsumptionTools } from "./consumption.js";
import { clearAccountCache } from "../resources/account.js";

const account = {
  properties: [
    {
      moved_out_at: "2020-01-01T00:00:00Z",
      electricity_meter_points: [
        { mpan: "OLD", agreements: [], meters: [{ serial_number: "OLDSN" }] },
      ],
      gas_meter_points: [],
    },
    {
      moved_out_at: null,
      electricity_meter_points: [
        {
          mpan: "EXPORT1",
          is_export: true,
          agreements: [
            {
              tariff_code: "E-EXP",
              valid_from: "2020-01-01T00:00:00+01:00",
              valid_to: null,
            },
          ],
          meters: [{ serial_number: "EXSN" }],
        },
        {
          mpan: "IMP1",
          agreements: [
            {
              tariff_code: "E-1R",
              valid_from: "2020-01-01T00:00:00+01:00",
              valid_to: null,
            },
          ],
          meters: [{ serial_number: "SN1" }],
        },
        {
          mpan: "IMP2",
          agreements: [
            { tariff_code: "E-1R", valid_from: "2020-01-01T00:00:00Z", valid_to: null },
          ],
          meters: [{ serial_number: "SN2" }],
        },
      ],
      gas_meter_points: [
        { mprn: "G1", agreements: [], meters: [{ serial_number: "GSN" }] },
      ],
    },
  ],
};

let handler: (a: Record<string, unknown>) => Promise<any>;
let get: ReturnType<typeof vi.fn>;

beforeEach(() => {
  clearAccountCache();
  vi.spyOn(console, "error").mockImplementation(() => {});
  get = vi.fn(async (path: string) =>
    path.startsWith("/v1/accounts/") ? account : { ok: true }
  );
  const tools = new Map<string, any>();
  registerConsumptionTools(
    { registerTool: (n: string, _c: unknown, cb: any) => tools.set(n, cb) } as any,
    { get } as unknown as OctopusEnergyClient,
    "A-TEST"
  );
  handler = tools.get("octopus_energy_get_electricity_consumption");
});

const consumptionPath = () =>
  get.mock.calls.find((c) => c[0].includes("consumption"))?.[0];

describe("meter auto-discovery", () => {
  it("skips export meters and moved-out properties", async () => {
    await handler({});
    expect(consumptionPath()).toBe(
      "/v1/electricity-meter-points/IMP1/meters/SN1/consumption/"
    );
  });

  it("pairs a given mpan with its own serial", async () => {
    await handler({ mpan: "IMP2" });
    expect(consumptionPath()).toBe(
      "/v1/electricity-meter-points/IMP2/meters/SN2/consumption/"
    );
  });

  it("pairs a given serial with its own mpan", async () => {
    await handler({ serial_number: "SN2" });
    expect(consumptionPath()).toBe(
      "/v1/electricity-meter-points/IMP2/meters/SN2/consumption/"
    );
  });

  it("errors instead of mismatching an mpan that is not on the account", async () => {
    const res = await handler({ mpan: "UNKNOWN" });
    expect(res.isError).toBe(true);
    expect(consumptionPath()).toBeUndefined();
  });

  it("rejects discovered ids that fail validation", async () => {
    get.mockResolvedValueOnce({
      properties: [
        {
          electricity_meter_points: [{ mpan: "A?x=1", meters: [{ serial_number: "S" }] }],
        },
      ],
    });
    const res = await handler({});
    expect(res.isError).toBe(true);
    expect(consumptionPath()).toBeUndefined();
  });
});
