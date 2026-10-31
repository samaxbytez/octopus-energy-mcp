import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OctopusEnergyClient } from "../client.js";
import { CACHE_TTL_MS } from "../utils.js";

export interface MeterInfo {
  electricity: Array<{
    mpan: string;
    serial_number: string;
    tariff_code: string | null;
  }>;
  gas: Array<{
    mprn: string;
    serial_number: string;
    tariff_code: string | null;
  }>;
}

export interface AccountDetails {
  account_number: string;
  properties: unknown[];
  meters: MeterInfo;
  raw: unknown;
}

let cachedDetails: AccountDetails | null = null;
let cacheTimestamp = 0;

export function clearAccountCache(): void {
  cachedDetails = null;
  cacheTimestamp = 0;
}

interface Agreement {
  tariff_code?: string;
  valid_from?: string;
  valid_to?: string | null;
}

interface MeterPoint {
  is_export?: boolean;
  agreements?: Agreement[];
  meters?: Array<{ serial_number: string }>;
  [idKey: string]: unknown;
}

function activeTariff(agreements: Agreement[], now: number): string | null {
  const active = agreements.find((a) => {
    const from = a.valid_from ? Date.parse(a.valid_from) : -Infinity;
    const to = a.valid_to ? Date.parse(a.valid_to) : Infinity;
    return from <= now && now <= to;
  });
  return active?.tariff_code ?? null;
}

/** Meters on points with a current tariff come first; export points are skipped. */
function collect<K extends "mpan" | "mprn">(
  points: MeterPoint[],
  idKey: K,
  now: number
): Array<{ [P in K]: string } & { serial_number: string; tariff_code: string | null }> {
  const found = [];
  for (const point of points) {
    if (point?.is_export) continue;
    const tariff_code = activeTariff(point?.agreements ?? [], now);
    for (const meter of point?.meters ?? []) {
      found.push({
        [idKey]: point[idKey] as string,
        serial_number: meter.serial_number,
        tariff_code,
      } as { [P in K]: string } & { serial_number: string; tariff_code: string | null });
    }
  }
  return found.sort(
    (x, y) => Number(y.tariff_code !== null) - Number(x.tariff_code !== null)
  );
}

function extractMeters(accountData: any): MeterInfo {
  const now = Date.now();
  const electricity: MeterPoint[] = [];
  const gas: MeterPoint[] = [];
  for (const property of accountData?.properties ?? []) {
    if (property?.moved_out_at) continue;
    electricity.push(...(property?.electricity_meter_points ?? []));
    gas.push(...(property?.gas_meter_points ?? []));
  }
  return {
    electricity: collect(electricity, "mpan", now),
    gas: collect(gas, "mprn", now),
  };
}

export async function getAccountDetails(
  client: OctopusEnergyClient,
  accountNumber: string
): Promise<AccountDetails> {
  if (
    cachedDetails &&
    cachedDetails.account_number === accountNumber &&
    Date.now() - cacheTimestamp < CACHE_TTL_MS
  ) {
    return cachedDetails;
  }

  const data = await client.get(`/v1/accounts/${accountNumber}/`, undefined, true);

  const meters = extractMeters(data);
  cachedDetails = {
    account_number: accountNumber,
    properties: (data as any)?.properties ?? [],
    meters,
    raw: data,
  };
  cacheTimestamp = Date.now();
  return cachedDetails;
}

export function registerAccountResource(
  server: McpServer,
  client: OctopusEnergyClient,
  accountNumber: string
): void {
  server.registerResource(
    "account-details",
    "octopus-energy://account",
    {
      description:
        "Your Octopus Energy account details including properties, meter points (MPAN/MPRN), meter serial numbers, and current tariffs. Read this at the start of a conversation to discover meter details for consumption queries.",
      mimeType: "application/json",
    },
    async () => {
      const details = await getAccountDetails(client, accountNumber);
      return {
        contents: [
          {
            uri: "octopus-energy://account",
            mimeType: "application/json",
            text: JSON.stringify({
              account_number: details.account_number,
              properties: details.properties,
              meters: details.meters,
            }),
          },
        ],
      };
    }
  );
}
