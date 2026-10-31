# octopus-energy-mcp

[![npm](https://img.shields.io/npm/v/octopus-energy-mcp)](https://www.npmjs.com/package/octopus-energy-mcp)
[![CI](https://github.com/samaxbytez/octopus-energy-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/samaxbytez/octopus-energy-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Ask your AI assistant about Octopus Energy tariffs, your account and your smart-meter usage. An [MCP](https://modelcontextprotocol.io) server over stdio for the [Octopus Energy REST API](https://developer.octopus.energy/).

**Read-only by design.** All 11 tools are `GET` requests to `api.octopus.energy`. Nothing can change a tariff, payment detail or account setting. The published package is a single bundled file with no runtime dependencies. See [docs/security.md](docs/security.md).

## How it fits together

```
AI app (Claude, Cursor, ...)  --stdio-->  octopus-energy-mcp  --HTTPS GET-->  api.octopus.energy/v1
                                          (your machine)                       (Basic auth, your API key)
```

The API key stays in your local environment and is only ever sent to `api.octopus.energy`.

## Quick start

1. **Get your API key and account number** from the [developer dashboard](https://octopus.energy/dashboard/developer/). Product and tariff tools work without them.
2. **Add the server** to your AI app:

   ```json
   {
     "mcpServers": {
       "octopus-energy": {
         "command": "npx",
         "args": ["-y", "octopus-energy-mcp"],
         "env": {
           "OCTOPUS_ENERGY_API_KEY": "sk_live_...",
           "OCTOPUS_ENERGY_ACCOUNT_NUMBER": "A-1234ABCD"
         }
       }
     }
   }
   ```

3. **Ask**: "What was my electricity usage last week, grouped by day?"

Requires Node.js 24 or newer. Other apps (Codex CLI, Cursor, VS Code, Windsurf, Gemini CLI): [docs/setup.md](docs/setup.md).

## What it can do

| Area | Tools | Needs API key |
| --- | --- | --- |
| Account | `octopus_energy_get_account` | Yes |
| Products | `octopus_energy_list_products`, `octopus_energy_get_product` | No |
| Consumption | `octopus_energy_get_electricity_consumption`, `octopus_energy_get_gas_consumption` | Yes |
| Tariffs | standard / day / night unit rates and standing charges for electricity and gas (6 tools) | No |

With an account number configured, meter details are discovered automatically and exposed as the `octopus-energy://account` resource. Full reference: [docs/tools.md](docs/tools.md).

## Settings

| Variable | Required | Purpose |
| --- | --- | --- |
| `OCTOPUS_ENERGY_API_KEY` | For account and consumption | Basic-auth credential for the Octopus API |
| `OCTOPUS_ENERGY_ACCOUNT_NUMBER` | Recommended | Enables meter auto-discovery and the account resource |

## Development

```bash
npm ci
npm test && npm run lint && npm run type-check
npm run build && npm run smoke && npm run attack
```

See [docs/development.md](docs/development.md).

## Documentation

| Doc | Contents |
| --- | --- |
| [docs/setup.md](docs/setup.md) | Step-by-step setup for each AI app |
| [docs/configuration.md](docs/configuration.md) | Environment variables |
| [docs/tools.md](docs/tools.md) | Tool, parameter and resource reference |
| [docs/security.md](docs/security.md) | Threat model and protections |
| [docs/troubleshooting.md](docs/troubleshooting.md) | Common problems |
| [docs/development.md](docs/development.md) | Build, test, release |

## Links

[npm](https://www.npmjs.com/package/octopus-energy-mcp) · [Issues](https://github.com/samaxbytez/octopus-energy-mcp/issues) · [Octopus API docs](https://developer.octopus.energy/) · MIT licence
