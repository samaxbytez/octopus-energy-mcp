#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { OctopusEnergyClient } from "./client.js";
import { registerAccountTools } from "./tools/accounts.js";
import { registerProductTools } from "./tools/products.js";
import { registerConsumptionTools } from "./tools/consumption.js";
import { registerTariffTools } from "./tools/tariffs.js";
import { registerAccountResource } from "./resources/account.js";
import { VERSION } from "./version.js";

const OCTOPUS_ENERGY_API_KEY = process.env.OCTOPUS_ENERGY_API_KEY;
const OCTOPUS_ENERGY_ACCOUNT_NUMBER = process.env.OCTOPUS_ENERGY_ACCOUNT_NUMBER;

if (!OCTOPUS_ENERGY_API_KEY) {
  console.error(
    "WARNING: OCTOPUS_ENERGY_API_KEY not set. Only unauthenticated endpoints (products, tariffs) will work."
  );
}

if (!OCTOPUS_ENERGY_ACCOUNT_NUMBER) {
  console.error(
    "WARNING: OCTOPUS_ENERGY_ACCOUNT_NUMBER not set. Consumption tools will require explicit MPAN/MPRN and serial numbers."
  );
}

const client = new OctopusEnergyClient(OCTOPUS_ENERGY_API_KEY);

const server = new McpServer({
  name: "octopus-energy-mcp",
  version: VERSION,
});

registerAccountTools(server, client);
registerProductTools(server, client);
registerConsumptionTools(server, client, OCTOPUS_ENERGY_ACCOUNT_NUMBER);
registerTariffTools(server, client);

if (OCTOPUS_ENERGY_API_KEY && OCTOPUS_ENERGY_ACCOUNT_NUMBER) {
  registerAccountResource(server, client, OCTOPUS_ENERGY_ACCOUNT_NUMBER);
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Octopus Energy MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
