import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { idSchema, READ_ONLY_ANNOTATIONS } from "../schemas.js";
import { OctopusEnergyClient } from "../client.js";
import { jsonResponse, errorResponse, logToolCall, buildParams } from "../utils.js";

interface TariffTool {
  name: string;
  title: string;
  description: string;
  fuel: "electricity" | "gas";
  suffix: string;
  tariffDesc: string;
  /** Richer parameter descriptions, used by the headline tool. */
  detailed?: boolean;
}

const NO_AUTH = "Does not require authentication.";

const TARIFF_TOOLS: TariffTool[] = [
  {
    name: "octopus_energy_get_electricity_standard_unit_rates",
    title: "Get Electricity Standard Unit Rates",
    description: `Retrieve standard unit rates for an electricity tariff. Returns prices including/excluding VAT. ${NO_AUTH} Useful for Agile, Go, and other tariff pricing.`,
    fuel: "electricity",
    suffix: "standard-unit-rates",
    tariffDesc: "The tariff code (e.g., E-1R-AGILE-FLEX-22-11-25-C)",
    detailed: true,
  },
  {
    name: "octopus_energy_get_electricity_standing_charges",
    title: "Get Electricity Standing Charges",
    description: `Retrieve standing charges for an electricity tariff. Returns daily standing charge including/excluding VAT. ${NO_AUTH}`,
    fuel: "electricity",
    suffix: "standing-charges",
    tariffDesc: "The tariff code",
  },
  {
    name: "octopus_energy_get_electricity_day_unit_rates",
    title: "Get Electricity Day Unit Rates",
    description: `Retrieve day unit rates for a dual-register electricity tariff (Economy 7/10). ${NO_AUTH}`,
    fuel: "electricity",
    suffix: "day-unit-rates",
    tariffDesc: "The dual-register tariff code",
  },
  {
    name: "octopus_energy_get_electricity_night_unit_rates",
    title: "Get Electricity Night Unit Rates",
    description: `Retrieve night unit rates for a dual-register electricity tariff (Economy 7/10). ${NO_AUTH}`,
    fuel: "electricity",
    suffix: "night-unit-rates",
    tariffDesc: "The dual-register tariff code",
  },
  {
    name: "octopus_energy_get_gas_standard_unit_rates",
    title: "Get Gas Standard Unit Rates",
    description: `Retrieve standard unit rates for a gas tariff. Returns prices including/excluding VAT. ${NO_AUTH}`,
    fuel: "gas",
    suffix: "standard-unit-rates",
    tariffDesc: "The gas tariff code",
  },
  {
    name: "octopus_energy_get_gas_standing_charges",
    title: "Get Gas Standing Charges",
    description: `Retrieve standing charges for a gas tariff. Returns daily standing charge including/excluding VAT. ${NO_AUTH}`,
    fuel: "gas",
    suffix: "standing-charges",
    tariffDesc: "The gas tariff code",
  },
];

export function registerTariffTools(
  server: McpServer,
  client: OctopusEnergyClient
): void {
  for (const tool of TARIFF_TOOLS) {
    const d = tool.detailed;
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        annotations: READ_ONLY_ANNOTATIONS,
        inputSchema: {
          product_code: idSchema.describe(
            d ? "The product code (e.g., AGILE-FLEX-22-11-25)" : "The product code"
          ),
          tariff_code: idSchema.describe(tool.tariffDesc),
          period_from: z
            .string()
            .optional()
            .describe(
              d
                ? "Start of period in ISO 8601 format (e.g., 2024-01-01T00:00Z)"
                : "Start of period in ISO 8601 format"
            ),
          period_to: z
            .string()
            .optional()
            .describe(
              d
                ? "End of period in ISO 8601 format (e.g., 2024-01-31T23:59Z)"
                : "End of period in ISO 8601 format"
            ),
          page: z
            .number()
            .int()
            .positive()
            .optional()
            .describe(d ? "Page number for pagination" : "Page number"),
          page_size: z
            .number()
            .int()
            .positive()
            .max(1500)
            .optional()
            .describe(
              d
                ? "Number of results per page (default 100)"
                : "Results per page (default 100)"
            ),
        },
      },
      async ({ product_code, tariff_code, period_from, period_to, page, page_size }) => {
        logToolCall(tool.name, { product_code, tariff_code, period_from, period_to });
        try {
          const result = await client.get(
            `/v1/products/${product_code}/${tool.fuel}-tariffs/${tariff_code}/${tool.suffix}/`,
            buildParams({ period_from, period_to, page, page_size })
          );
          return jsonResponse(result);
        } catch (error) {
          return errorResponse(error);
        }
      }
    );
  }
}
