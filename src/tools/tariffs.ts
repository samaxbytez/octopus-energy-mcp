import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { OctopusEnergyClient } from "../client.js";
import {
  jsonResponse,
  errorResponse,
  logToolCall,
  buildParams,
} from "../utils.js";

export function registerTariffTools(
  server: McpServer,
  client: OctopusEnergyClient
): void {
  server.registerTool(
    "octopus_energy_get_electricity_standard_unit_rates",
    {
      title: "Get Electricity Standard Unit Rates",
      description:
        "Retrieve standard unit rates for an electricity tariff. Returns prices including/excluding VAT. Does not require authentication. Useful for Agile, Go, and other tariff pricing.",
      inputSchema: {
        product_code: z
          .string()
          .describe("The product code (e.g., AGILE-FLEX-22-11-25)"),
        tariff_code: z
          .string()
          .describe(
            "The tariff code (e.g., E-1R-AGILE-FLEX-22-11-25-C)"
          ),
        period_from: z
          .string()
          .optional()
          .describe("Start of period in ISO 8601 format (e.g., 2024-01-01T00:00Z)"),
        period_to: z
          .string()
          .optional()
          .describe("End of period in ISO 8601 format (e.g., 2024-01-31T23:59Z)"),
        page: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Page number for pagination"),
        page_size: z
          .number()
          .int()
          .positive()
          .max(1500)
          .optional()
          .describe("Number of results per page (default 100)"),
      },
    },
    async ({ product_code, tariff_code, period_from, period_to, page, page_size }) => {
      logToolCall("octopus_energy_get_electricity_standard_unit_rates", {
        product_code,
        tariff_code,
        period_from,
        period_to,
      });
      try {
        const result = await client.get(
          `/v1/products/${product_code}/electricity-tariffs/${tariff_code}/standard-unit-rates/`,
          buildParams({ period_from, period_to, page, page_size })
        );
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "octopus_energy_get_electricity_standing_charges",
    {
      title: "Get Electricity Standing Charges",
      description:
        "Retrieve standing charges for an electricity tariff. Returns daily standing charge including/excluding VAT. Does not require authentication.",
      inputSchema: {
        product_code: z.string().describe("The product code"),
        tariff_code: z.string().describe("The tariff code"),
        period_from: z
          .string()
          .optional()
          .describe("Start of period in ISO 8601 format"),
        period_to: z
          .string()
          .optional()
          .describe("End of period in ISO 8601 format"),
        page: z.number().int().positive().optional().describe("Page number"),
        page_size: z
          .number()
          .int()
          .positive()
          .max(1500)
          .optional()
          .describe("Results per page (default 100)"),
      },
    },
    async ({ product_code, tariff_code, period_from, period_to, page, page_size }) => {
      logToolCall("octopus_energy_get_electricity_standing_charges", {
        product_code,
        tariff_code,
      });
      try {
        const result = await client.get(
          `/v1/products/${product_code}/electricity-tariffs/${tariff_code}/standing-charges/`,
          buildParams({ period_from, period_to, page, page_size })
        );
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "octopus_energy_get_electricity_day_unit_rates",
    {
      title: "Get Electricity Day Unit Rates",
      description:
        "Retrieve day unit rates for a dual-register electricity tariff (Economy 7/10). Does not require authentication.",
      inputSchema: {
        product_code: z.string().describe("The product code"),
        tariff_code: z
          .string()
          .describe("The dual-register tariff code"),
        period_from: z
          .string()
          .optional()
          .describe("Start of period in ISO 8601 format"),
        period_to: z
          .string()
          .optional()
          .describe("End of period in ISO 8601 format"),
        page: z.number().int().positive().optional().describe("Page number"),
        page_size: z
          .number()
          .int()
          .positive()
          .max(1500)
          .optional()
          .describe("Results per page (default 100)"),
      },
    },
    async ({ product_code, tariff_code, period_from, period_to, page, page_size }) => {
      logToolCall("octopus_energy_get_electricity_day_unit_rates", {
        product_code,
        tariff_code,
      });
      try {
        const result = await client.get(
          `/v1/products/${product_code}/electricity-tariffs/${tariff_code}/day-unit-rates/`,
          buildParams({ period_from, period_to, page, page_size })
        );
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "octopus_energy_get_electricity_night_unit_rates",
    {
      title: "Get Electricity Night Unit Rates",
      description:
        "Retrieve night unit rates for a dual-register electricity tariff (Economy 7/10). Does not require authentication.",
      inputSchema: {
        product_code: z.string().describe("The product code"),
        tariff_code: z
          .string()
          .describe("The dual-register tariff code"),
        period_from: z
          .string()
          .optional()
          .describe("Start of period in ISO 8601 format"),
        period_to: z
          .string()
          .optional()
          .describe("End of period in ISO 8601 format"),
        page: z.number().int().positive().optional().describe("Page number"),
        page_size: z
          .number()
          .int()
          .positive()
          .max(1500)
          .optional()
          .describe("Results per page (default 100)"),
      },
    },
    async ({ product_code, tariff_code, period_from, period_to, page, page_size }) => {
      logToolCall("octopus_energy_get_electricity_night_unit_rates", {
        product_code,
        tariff_code,
      });
      try {
        const result = await client.get(
          `/v1/products/${product_code}/electricity-tariffs/${tariff_code}/night-unit-rates/`,
          buildParams({ period_from, period_to, page, page_size })
        );
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "octopus_energy_get_gas_standard_unit_rates",
    {
      title: "Get Gas Standard Unit Rates",
      description:
        "Retrieve standard unit rates for a gas tariff. Returns prices including/excluding VAT. Does not require authentication.",
      inputSchema: {
        product_code: z.string().describe("The product code"),
        tariff_code: z.string().describe("The gas tariff code"),
        period_from: z
          .string()
          .optional()
          .describe("Start of period in ISO 8601 format"),
        period_to: z
          .string()
          .optional()
          .describe("End of period in ISO 8601 format"),
        page: z.number().int().positive().optional().describe("Page number"),
        page_size: z
          .number()
          .int()
          .positive()
          .max(1500)
          .optional()
          .describe("Results per page (default 100)"),
      },
    },
    async ({ product_code, tariff_code, period_from, period_to, page, page_size }) => {
      logToolCall("octopus_energy_get_gas_standard_unit_rates", {
        product_code,
        tariff_code,
      });
      try {
        const result = await client.get(
          `/v1/products/${product_code}/gas-tariffs/${tariff_code}/standard-unit-rates/`,
          buildParams({ period_from, period_to, page, page_size })
        );
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "octopus_energy_get_gas_standing_charges",
    {
      title: "Get Gas Standing Charges",
      description:
        "Retrieve standing charges for a gas tariff. Returns daily standing charge including/excluding VAT. Does not require authentication.",
      inputSchema: {
        product_code: z.string().describe("The product code"),
        tariff_code: z.string().describe("The gas tariff code"),
        period_from: z
          .string()
          .optional()
          .describe("Start of period in ISO 8601 format"),
        period_to: z
          .string()
          .optional()
          .describe("End of period in ISO 8601 format"),
        page: z.number().int().positive().optional().describe("Page number"),
        page_size: z
          .number()
          .int()
          .positive()
          .max(1500)
          .optional()
          .describe("Results per page (default 100)"),
      },
    },
    async ({ product_code, tariff_code, period_from, period_to, page, page_size }) => {
      logToolCall("octopus_energy_get_gas_standing_charges", {
        product_code,
        tariff_code,
      });
      try {
        const result = await client.get(
          `/v1/products/${product_code}/gas-tariffs/${tariff_code}/standing-charges/`,
          buildParams({ period_from, period_to, page, page_size })
        );
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );
}
