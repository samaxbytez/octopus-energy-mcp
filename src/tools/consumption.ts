import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { idSchema, READ_ONLY_ANNOTATIONS } from "../schemas.js";
import { OctopusEnergyClient } from "../client.js";
import { jsonResponse, errorResponse, logToolCall, buildParams } from "../utils.js";
import { getAccountDetails } from "../resources/account.js";

interface Meter {
  id: string;
  serial_number: string;
}

interface ConsumptionTool {
  name: string;
  title: string;
  description: string;
  /** "mpan" or "mprn" */
  idField: "mpan" | "mprn";
  idLabel: string;
  idDescription: string;
  fuel: "electricity" | "gas";
}

const TOOLS: ConsumptionTool[] = [
  {
    name: "octopus_energy_get_electricity_consumption",
    title: "Get Electricity Consumption",
    description:
      "Retrieve electricity consumption data for a specific meter. Returns half-hourly consumption in kWh. Requires authentication.",
    idField: "mpan",
    idLabel: "MPAN",
    idDescription: "The MPAN (Meter Point Administration Number).",
    fuel: "electricity",
  },
  {
    name: "octopus_energy_get_gas_consumption",
    title: "Get Gas Consumption",
    description:
      "Retrieve gas consumption data for a specific meter. SMETS1 meters return kWh, SMETS2 meters return cubic meters. Requires authentication.",
    idField: "mprn",
    idLabel: "MPRN",
    idDescription: "The MPRN (Meter Point Reference Number).",
    fuel: "gas",
  },
];

/**
 * Pair a meter point id with its serial number. Explicit values always win; a
 * missing half is looked up from the account by matching the half that was given.
 */
function pairMeter(
  meters: Meter[],
  id?: string,
  serial?: string
): { id?: string; serial?: string } {
  if (id && serial) return { id, serial };
  if (!id && !serial) return { id: meters[0]?.id, serial: meters[0]?.serial_number };
  const match = id
    ? meters.find((m) => m.id === id)
    : meters.find((m) => m.serial_number === serial);
  return id ? { id, serial: match?.serial_number } : { id: match?.id, serial };
}

export function registerConsumptionTools(
  server: McpServer,
  client: OctopusEnergyClient,
  accountNumber?: string
): void {
  for (const tool of TOOLS) {
    const optional = "Optional if account number is configured.";
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description:
          tool.description +
          (accountNumber
            ? ` ${tool.idLabel} and serial number are optional — if omitted, they will be auto-discovered from your account.`
            : ""),
        annotations: READ_ONLY_ANNOTATIONS,
        inputSchema: {
          [tool.idField]: idSchema
            .optional()
            .describe(`${tool.idDescription} ${optional}`),
          serial_number: idSchema
            .optional()
            .describe(`The meter serial number. ${optional}`),
          period_from: z
            .string()
            .optional()
            .describe("Start of period in ISO 8601 format (e.g., 2024-01-01T00:00Z)"),
          period_to: z
            .string()
            .optional()
            .describe("End of period in ISO 8601 format (e.g., 2024-01-31T23:59Z)"),
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
      async (args: Record<string, unknown>) => {
        const {
          serial_number,
          period_from,
          period_to,
          page_size,
          order_by,
          group_by,
          page,
        } = args as Record<string, string | number | undefined>;
        const givenId = args[tool.idField] as string | undefined;
        logToolCall(tool.name, {
          [tool.idField]: givenId,
          serial_number,
          period_from,
          period_to,
          group_by,
        });
        try {
          let { id, serial } = {
            id: givenId,
            serial: serial_number as string | undefined,
          };

          if ((!id || !serial) && accountNumber) {
            const account = await getAccountDetails(client, accountNumber);
            const meters: Meter[] = (
              account.meters[tool.fuel] as Array<Record<string, string>>
            ).map((m) => ({ id: m[tool.idField], serial_number: m.serial_number }));
            ({ id, serial } = pairMeter(meters, id, serial));
          }

          if (!id || !serial) {
            return errorResponse(
              new Error(
                `${tool.idLabel} and serial number are required. Provide them as parameters or configure OCTOPUS_ENERGY_ACCOUNT_NUMBER for auto-discovery.`
              )
            );
          }

          // Discovered values come from the API response; validate them like user input.
          const safeId = idSchema.parse(id);
          const safeSerial = idSchema.parse(serial);

          const result = await client.get(
            `/v1/${tool.fuel}-meter-points/${safeId}/meters/${safeSerial}/consumption/`,
            buildParams({ period_from, period_to, page_size, order_by, group_by, page }),
            true
          );
          return jsonResponse(result);
        } catch (error) {
          return errorResponse(error);
        }
      }
    );
  }
}
