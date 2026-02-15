import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { OctopusEnergyClient } from "../client.js";
import {
  jsonResponse,
  errorResponse,
  logToolCall,
  buildParams,
} from "../utils.js";
import { getAccountDetails } from "../resources/account.js";

export function registerConsumptionTools(
  server: McpServer,
  client: OctopusEnergyClient,
  accountNumber?: string
): void {
  server.registerTool(
    "octopus_energy_get_electricity_consumption",
    {
      title: "Get Electricity Consumption",
      description:
        "Retrieve electricity consumption data for a specific meter. Returns half-hourly consumption in kWh. Requires authentication." +
        (accountNumber
          ? " MPAN and serial number are optional — if omitted, they will be auto-discovered from your account."
          : ""),
      inputSchema: {
        mpan: z
          .string()
          .optional()
          .describe(
            "The MPAN (Meter Point Administration Number). Optional if account number is configured."
          ),
        serial_number: z
          .string()
          .optional()
          .describe(
            "The meter serial number. Optional if account number is configured."
          ),
        period_from: z
          .string()
          .optional()
          .describe(
            "Start of period in ISO 8601 format (e.g., 2024-01-01T00:00Z)"
          ),
        period_to: z
          .string()
          .optional()
          .describe(
            "End of period in ISO 8601 format (e.g., 2024-01-31T23:59Z)"
          ),
        page_size: z
          .number()
          .int()
          .positive()
          .max(25000)
          .optional()
          .describe("Number of results per page (default 100, max 25000)"),
        order_by: z
          .enum(["period", "-period"])
          .optional()
          .describe(
            "Sort order: 'period' for oldest first, '-period' for newest first"
          ),
        group_by: z
          .enum(["day", "week", "month", "quarter"])
          .optional()
          .describe("Aggregate consumption by time period"),
        page: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Page number for pagination"),
      },
    },
    async ({
      mpan,
      serial_number,
      period_from,
      period_to,
      page_size,
      order_by,
      group_by,
      page,
    }) => {
      logToolCall("octopus_energy_get_electricity_consumption", {
        mpan,
        serial_number,
        period_from,
        period_to,
        group_by,
      });
      try {
        let resolvedMpan = mpan;
        let resolvedSerial = serial_number;

        if ((!resolvedMpan || !resolvedSerial) && accountNumber) {
          const account = await getAccountDetails(client, accountNumber);
          const meter = account.meters.electricity[0];
          if (meter) {
            resolvedMpan = resolvedMpan ?? meter.mpan;
            resolvedSerial = resolvedSerial ?? meter.serial_number;
          }
        }

        if (!resolvedMpan || !resolvedSerial) {
          return errorResponse(
            new Error(
              "MPAN and serial number are required. Provide them as parameters or configure OCTOPUS_ENERGY_ACCOUNT_NUMBER for auto-discovery."
            )
          );
        }

        const result = await client.get(
          `/v1/electricity-meter-points/${resolvedMpan}/meters/${resolvedSerial}/consumption/`,
          buildParams({
            period_from,
            period_to,
            page_size,
            order_by,
            group_by,
            page,
          }),
          true
        );
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "octopus_energy_get_gas_consumption",
    {
      title: "Get Gas Consumption",
      description:
        "Retrieve gas consumption data for a specific meter. SMETS1 meters return kWh, SMETS2 meters return cubic meters. Requires authentication." +
        (accountNumber
          ? " MPRN and serial number are optional — if omitted, they will be auto-discovered from your account."
          : ""),
      inputSchema: {
        mprn: z
          .string()
          .optional()
          .describe(
            "The MPRN (Meter Point Reference Number). Optional if account number is configured."
          ),
        serial_number: z
          .string()
          .optional()
          .describe(
            "The meter serial number. Optional if account number is configured."
          ),
        period_from: z
          .string()
          .optional()
          .describe(
            "Start of period in ISO 8601 format (e.g., 2024-01-01T00:00Z)"
          ),
        period_to: z
          .string()
          .optional()
          .describe(
            "End of period in ISO 8601 format (e.g., 2024-01-31T23:59Z)"
          ),
        page_size: z
          .number()
          .int()
          .positive()
          .max(25000)
          .optional()
          .describe("Number of results per page (default 100, max 25000)"),
        order_by: z
          .enum(["period", "-period"])
          .optional()
          .describe(
            "Sort order: 'period' for oldest first, '-period' for newest first"
          ),
        group_by: z
          .enum(["day", "week", "month", "quarter"])
          .optional()
          .describe("Aggregate consumption by time period"),
        page: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Page number for pagination"),
      },
    },
    async ({
      mprn,
      serial_number,
      period_from,
      period_to,
      page_size,
      order_by,
      group_by,
      page,
    }) => {
      logToolCall("octopus_energy_get_gas_consumption", {
        mprn,
        serial_number,
        period_from,
        period_to,
        group_by,
      });
      try {
        let resolvedMprn = mprn;
        let resolvedSerial = serial_number;

        if ((!resolvedMprn || !resolvedSerial) && accountNumber) {
          const account = await getAccountDetails(client, accountNumber);
          const meter = account.meters.gas[0];
          if (meter) {
            resolvedMprn = resolvedMprn ?? meter.mprn;
            resolvedSerial = resolvedSerial ?? meter.serial_number;
          }
        }

        if (!resolvedMprn || !resolvedSerial) {
          return errorResponse(
            new Error(
              "MPRN and serial number are required. Provide them as parameters or configure OCTOPUS_ENERGY_ACCOUNT_NUMBER for auto-discovery."
            )
          );
        }

        const result = await client.get(
          `/v1/gas-meter-points/${resolvedMprn}/meters/${resolvedSerial}/consumption/`,
          buildParams({
            period_from,
            period_to,
            page_size,
            order_by,
            group_by,
            page,
          }),
          true
        );
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );
}
