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

function extractMeters(accountData: any): MeterInfo {
  const meters: MeterInfo = { electricity: [], gas: [] };

  const properties = accountData?.properties ?? [];
  for (const property of properties) {
    for (const ep of property?.electricity_meter_points ?? []) {
      const mpan = ep.mpan;
      for (const meter of ep?.meters ?? []) {
        const agreements = ep.agreements ?? [];
        const now = new Date().toISOString();
        const activeTariff =
          agreements.find(
            (a: any) => a.valid_from <= now && (!a.valid_to || a.valid_to >= now)
          )?.tariff_code ?? null;
        meters.electricity.push({
          mpan,
          serial_number: meter.serial_number,
          tariff_code: activeTariff,
        });
      }
    }

    for (const gp of property?.gas_meter_points ?? []) {
      const mprn = gp.mprn;
      for (const meter of gp?.meters ?? []) {
        const agreements = gp.agreements ?? [];
        const now = new Date().toISOString();
        const activeTariff =
          agreements.find(
            (a: any) => a.valid_from <= now && (!a.valid_to || a.valid_to >= now)
          )?.tariff_code ?? null;
        meters.gas.push({
          mprn,
          serial_number: meter.serial_number,
          tariff_code: activeTariff,
        });
      }
    }
  }

  return meters;
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

  const data = await client.get(
    `/v1/accounts/${encodeURIComponent(accountNumber)}/`,
    undefined,
    true
  );

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
            text: JSON.stringify(details),
          },
        ],
      };
    }
  );
}
