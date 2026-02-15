#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { OctopusEnergyClient } from "./client.js";
import { registerAccountTools } from "./tools/accounts.js";
import { registerProductTools } from "./tools/products.js";
import { registerConsumptionTools } from "./tools/consumption.js";
import { registerTariffTools } from "./tools/tariffs.js";

const OCTOPUS_ENERGY_API_KEY = process.env.OCTOPUS_ENERGY_API_KEY;

if (!OCTOPUS_ENERGY_API_KEY) {
  console.error(
    "WARNING: OCTOPUS_ENERGY_API_KEY not set. Only unauthenticated endpoints (products, tariffs) will work."
  );
}

const client = new OctopusEnergyClient(OCTOPUS_ENERGY_API_KEY);

const server = new McpServer({
  name: "octopus-energy-mcp",
  version: "1.0.0",
});

registerAccountTools(server, client);
registerProductTools(server, client);
registerConsumptionTools(server, client);
registerTariffTools(server, client);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Octopus Energy MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
