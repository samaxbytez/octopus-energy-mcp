import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { OctopusEnergyClient } from "../client.js";
import {
  jsonResponse,
  errorResponse,
  logToolCall,
  buildParams,
} from "../utils.js";

export function registerProductTools(
  server: McpServer,
  client: OctopusEnergyClient
): void {
  server.registerTool(
    "octopus_energy_list_products",
    {
      title: "List Products",
      description:
        "List available energy products/tariffs. Does not require authentication. Supports filtering by brand, variable/fixed, business/domestic, green, and prepay.",
      inputSchema: {
        brand: z
          .string()
          .optional()
          .describe("Filter by brand (e.g., OCTOPUS_ENERGY)"),
        is_variable: z
          .boolean()
          .optional()
          .describe("Filter for variable tariffs only"),
        is_business: z
          .boolean()
          .optional()
          .describe("Filter for business tariffs only"),
        is_green: z
          .boolean()
          .optional()
          .describe("Filter for green tariffs only"),
        is_prepay: z
          .boolean()
          .optional()
          .describe("Filter for prepay tariffs only"),
        available_at: z
          .string()
          .optional()
          .describe(
            "Filter products available at this ISO 8601 datetime (e.g., 2024-01-01T00:00Z)"
          ),
        page: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Page number for pagination (default 1)"),
      },
    },
    async ({ brand, is_variable, is_business, is_green, is_prepay, available_at, page }) => {
      logToolCall("octopus_energy_list_products", {
        brand,
        is_variable,
        is_business,
        is_green,
        is_prepay,
        available_at,
        page,
      });
      try {
        const result = await client.get(
          "/v1/products/",
          buildParams({
            brand,
            is_variable,
            is_business,
            is_green,
            is_prepay,
            available_at,
            page,
          })
        );
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "octopus_energy_get_product",
    {
      title: "Get Product Details",
      description:
        "Retrieve detailed information about a specific product including its tariffs, standing charges, and unit rates. Does not require authentication.",
      inputSchema: {
        product_code: z
          .string()
          .describe(
            "The product code (e.g., AGILE-FLEX-22-11-25, GO-VAR-22-10-14)"
          ),
        tariffs_active_at: z
          .string()
          .optional()
          .describe(
            "Filter tariffs active at this ISO 8601 datetime (e.g., 2024-01-01T00:00Z)"
          ),
      },
    },
    async ({ product_code, tariffs_active_at }) => {
      logToolCall("octopus_energy_get_product", {
        product_code,
        tariffs_active_at,
      });
      try {
        const result = await client.get(
          `/v1/products/${product_code}/`,
          buildParams({ tariffs_active_at })
        );
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );
}
