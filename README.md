# octopus-energy-mcp

[![npm version](https://img.shields.io/npm/v/octopus-energy-mcp)](https://www.npmjs.com/package/octopus-energy-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server for the [Octopus Energy API](https://developer.octopus.energy/). Query energy products, tariff pricing, electricity and gas consumption data, and account details directly from Claude and other MCP-compatible AI assistants.

Some endpoints (products, tariff rates) are publicly available without authentication. Account and consumption endpoints require an API key.

## Features

- **Account** - Retrieve account details, properties, meter points, and tariff agreements
- **Products** - List and search available energy products/tariffs with filters
- **Consumption** - Get half-hourly electricity and gas consumption data with aggregation options
- **Tariffs** - Query electricity and gas unit rates, standing charges, day/night rates for any tariff

## Prerequisites

- **Node.js** >= 18
- **Octopus Energy API key** (optional - only needed for account and consumption endpoints)
  - Log in to your [Octopus Energy account](https://octopus.energy/dashboard/developer/)
  - Your API key is shown on the developer dashboard
  - The key looks like `sk_live_...`

## Installation

### Using npx (recommended)

```bash
npx octopus-energy-mcp
```

### Global install

```bash
npm install -g octopus-energy-mcp
octopus-energy-mcp
```

### Build from source

```bash
git clone https://github.com/samaxbytez/octopus-energy-mcp.git
cd octopus-energy-mcp
npm install
npm run build
npm start
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OCTOPUS_ENERGY_API_KEY` | No* | Your Octopus Energy API key |

*Required for account and consumption endpoints. Product and tariff endpoints work without authentication.

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "octopus-energy": {
      "command": "npx",
      "args": ["-y", "octopus-energy-mcp"],
      "env": {
        "OCTOPUS_ENERGY_API_KEY": "sk_live_your_api_key_here"
      }
    }
  }
}
```

### Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "octopus-energy": {
      "command": "npx",
      "args": ["-y", "octopus-energy-mcp"],
      "env": {
        "OCTOPUS_ENERGY_API_KEY": "sk_live_your_api_key_here"
      }
    }
  }
}
```

### Other MCP Clients

The server communicates via stdio. Run the binary and connect your MCP client to stdin/stdout:

```bash
OCTOPUS_ENERGY_API_KEY=sk_live_... npx octopus-energy-mcp
```

## Architecture

```
octopus-energy-mcp/
├── src/
│   ├── index.ts              # Entry point, server setup
│   ├── client.ts             # HTTP client with Basic Auth
│   ├── utils.ts              # Shared utilities (responses, logging)
│   ├── client.test.ts        # Client tests
│   ├── utils.test.ts         # Utils tests
│   └── tools/
│       ├── accounts.ts       # Account endpoint
│       ├── products.ts       # Product listing and details
│       ├── consumption.ts    # Electricity and gas consumption
│       ├── tariffs.ts        # Tariff unit rates and standing charges
│       └── tools.test.ts     # Tool handler tests
├── package.json
├── tsconfig.json
└── README.md
```

The client uses HTTP Basic Auth (API key as username, blank password) per the Octopus Energy API specification. Public endpoints skip authentication entirely.

## Tools Reference

### Account

| Tool | Description | Auth | API Endpoint |
|------|-------------|------|-------------|
| `octopus_energy_get_account` | Get account details, properties, meters, tariffs | Yes | `GET /v1/accounts/{account_number}/` |

**Parameters:** `account_number` (required)

### Products

| Tool | Description | Auth | API Endpoint |
|------|-------------|------|-------------|
| `octopus_energy_list_products` | List available energy products | No | `GET /v1/products/` |
| `octopus_energy_get_product` | Get product details and tariffs | No | `GET /v1/products/{product_code}/` |

**List parameters:** `brand`, `is_variable`, `is_business`, `is_green`, `is_prepay`, `available_at`, `page` (all optional)

**Get parameters:** `product_code` (required), `tariffs_active_at` (optional)

### Consumption

| Tool | Description | Auth | API Endpoint |
|------|-------------|------|-------------|
| `octopus_energy_get_electricity_consumption` | Get electricity meter consumption | Yes | `GET /v1/electricity-meter-points/{mpan}/meters/{serial}/consumption/` |
| `octopus_energy_get_gas_consumption` | Get gas meter consumption | Yes | `GET /v1/gas-meter-points/{mprn}/meters/{serial}/consumption/` |

**Parameters:** `mpan`/`mprn` (required), `serial_number` (required), `period_from`, `period_to`, `page_size`, `order_by`, `group_by`, `page` (optional)

### Tariffs

| Tool | Description | Auth | API Endpoint |
|------|-------------|------|-------------|
| `octopus_energy_get_electricity_standard_unit_rates` | Electricity unit rates (inc. Agile/Go pricing) | No | `GET /v1/products/{code}/electricity-tariffs/{tariff}/standard-unit-rates/` |
| `octopus_energy_get_electricity_standing_charges` | Electricity daily standing charges | No | `GET /v1/products/{code}/electricity-tariffs/{tariff}/standing-charges/` |
| `octopus_energy_get_electricity_day_unit_rates` | Day rates for Economy 7/10 tariffs | No | `GET /v1/products/{code}/electricity-tariffs/{tariff}/day-unit-rates/` |
| `octopus_energy_get_electricity_night_unit_rates` | Night rates for Economy 7/10 tariffs | No | `GET /v1/products/{code}/electricity-tariffs/{tariff}/night-unit-rates/` |
| `octopus_energy_get_gas_standard_unit_rates` | Gas unit rates | No | `GET /v1/products/{code}/gas-tariffs/{tariff}/standard-unit-rates/` |
| `octopus_energy_get_gas_standing_charges` | Gas daily standing charges | No | `GET /v1/products/{code}/gas-tariffs/{tariff}/standing-charges/` |

**Parameters:** `product_code` (required), `tariff_code` (required), `period_from`, `period_to`, `page`, `page_size` (optional)

## Example Prompts

- "What energy products does Octopus Energy currently offer?"
- "Show me the Agile tariff electricity prices for London (region C) today"
- "What's the current standing charge for my electricity tariff?"
- "Get my electricity consumption for January 2024, grouped by day"
- "Compare the gas unit rates between two different products"
- "Show me my account details and meter serial numbers"
- "What are the night rates on the Economy 7 tariff for my region?"
- "How much electricity did I use last month?"
- "List all green energy tariffs available right now"
- "What were the Agile prices during peak hours yesterday?"

## Development

```bash
# Install dependencies
npm install

# Type check
npm run type-check

# Run tests
npm test

# Watch mode for tests
npm run test:watch

# Build
npm run build

# Lint
npm run lint

# Format
npm run format
```

### Adding New Tools

1. Create a new file in `src/tools/` (or add to an existing category)
2. Follow the pattern: export a `register*Tools(server, client)` function
3. Use `logToolCall()` at the start of every handler
4. Wrap API calls in try/catch with `jsonResponse()`/`errorResponse()`
5. Import and call your register function in `src/index.ts`
6. Add tests in `src/tools/tools.test.ts`

## Troubleshooting

### "API key is required for this endpoint"
Set the `OCTOPUS_ENERGY_API_KEY` environment variable. Account and consumption endpoints require authentication.

### "HTTP 403" errors
Your API key may be invalid or expired. Generate a new one from the [Octopus Energy developer dashboard](https://octopus.energy/dashboard/developer/).

### Product/tariff endpoints return empty results
Check your `period_from`/`period_to` parameters. Dates must be in ISO 8601 format with timezone (e.g., `2024-01-01T00:00Z`). Omitting the `Z` can cause issues during daylight savings transitions.

### Consumption data is missing
Consumption data may take up to 24-48 hours to appear after the reading period. Smart meter data availability depends on your meter type (SMETS1 vs SMETS2).

### "Server not found" in Claude Desktop
Ensure `npx` is available in your PATH. Try running `npx octopus-energy-mcp` in a terminal first to verify the package installs correctly.

### Gas consumption values seem wrong
SMETS1 meters return consumption in kWh, while SMETS2 meters return cubic meters. You may need to convert cubic meters to kWh using the calorific value and volume correction factor.

## License

MIT
