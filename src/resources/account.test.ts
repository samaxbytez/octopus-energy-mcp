import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { OctopusEnergyClient } from "../client.js";
import {
  getAccountDetails,
  clearAccountCache,
  registerAccountResource,
} from "./account.js";

function createMockClient() {
  return {
    get: vi.fn().mockResolvedValue({
      properties: [
        {
          electricity_meter_points: [
            {
              mpan: "1234567890123",
              meters: [{ serial_number: "ELEC001" }],
              agreements: [
                {
                  tariff_code: "E-1R-VAR-22-11-01-C",
                  valid_from: "2020-01-01T00:00Z",
                  valid_to: null,
                },
              ],
            },
          ],
          gas_meter_points: [
            {
              mprn: "9876543210",
              meters: [{ serial_number: "GAS001" }],
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
    }),
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

describe("getAccountDetails", () => {
  it("fetches and extracts meter details", async () => {
    const client = createMockClient();
    const details = await getAccountDetails(client, "A-TEST1234");

    expect(client.get).toHaveBeenCalledWith(
      "/v1/accounts/A-TEST1234/",
      undefined,
      true
    );
    expect(details.account_number).toBe("A-TEST1234");
    expect(details.meters.electricity).toHaveLength(1);
    expect(details.meters.electricity[0]).toEqual({
      mpan: "1234567890123",
      serial_number: "ELEC001",
      tariff_code: "E-1R-VAR-22-11-01-C",
    });
    expect(details.meters.gas).toHaveLength(1);
    expect(details.meters.gas[0]).toEqual({
      mprn: "9876543210",
      serial_number: "GAS001",
      tariff_code: "G-1R-VAR-22-11-01-C",
    });
  });

  it("caches results on subsequent calls", async () => {
    const client = createMockClient();
    await getAccountDetails(client, "A-TEST1234");
    await getAccountDetails(client, "A-TEST1234");

    expect(client.get).toHaveBeenCalledTimes(1);
  });

  it("handles account with no meters", async () => {
    const client = createMockClient();
    (client.get as any).mockResolvedValue({ properties: [{}] });

    const details = await getAccountDetails(client, "A-EMPTY");
    expect(details.meters.electricity).toHaveLength(0);
    expect(details.meters.gas).toHaveLength(0);
  });
});

describe("registerAccountResource", () => {
  it("registers a resource with the server", () => {
    const registerResource = vi.fn();
    const server = { registerResource } as any;
    const client = createMockClient();

    registerAccountResource(server, client, "A-TEST1234");

    expect(registerResource).toHaveBeenCalledWith(
      "account-details",
      "octopus-energy://account",
      expect.objectContaining({
        description: expect.any(String),
        mimeType: "application/json",
      }),
      expect.any(Function)
    );
  });

  it("resource callback returns account details as JSON", async () => {
    const registerResource = vi.fn();
    const server = { registerResource } as any;
    const client = createMockClient();

    registerAccountResource(server, client, "A-TEST1234");

    const callback = registerResource.mock.calls[0][3];
    const result = await callback(new URL("octopus-energy://account"), {});

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].uri).toBe("octopus-energy://account");
    expect(result.contents[0].mimeType).toBe("application/json");

    const parsed = JSON.parse(result.contents[0].text);
    expect(parsed.account_number).toBe("A-TEST1234");
    expect(parsed.meters.electricity[0].mpan).toBe("1234567890123");
  });
});
