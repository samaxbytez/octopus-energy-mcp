import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { idSchema, READ_ONLY_ANNOTATIONS } from "../schemas.js";
import { OctopusEnergyClient } from "../client.js";
import { jsonResponse, errorResponse, logToolCall } from "../utils.js";

export function registerAccountTools(
  server: McpServer,
  client: OctopusEnergyClient
): void {
  server.registerTool(
    "octopus_energy_get_account",
    {
      title: "Get Account",
      description:
        "Retrieve account details including properties, meter points (MPAN/MPRN), meter serial numbers, and current/historical tariff agreements. Requires authentication.",
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        account_number: idSchema.describe(
          "The Octopus Energy account number (e.g., A-AAAA1111)"
        ),
      },
    },
    async ({ account_number }) => {
      logToolCall("octopus_energy_get_account", { account_number });
      try {
        const result = await client.get(
          `/v1/accounts/${account_number}/`,
          undefined,
          true
        );
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );
}
