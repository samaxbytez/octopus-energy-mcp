# Troubleshooting

**"API key is required for this endpoint"**: set `OCTOPUS_ENERGY_API_KEY`. Account and consumption tools need it.

**HTTP 401/403**: the key is wrong or revoked. Generate a new one on the [API access page](https://octopus.energy/dashboard/developer/).

**HTTP 429**: rate limited. The error includes the `Retry-After` seconds when the API sends it.

**"Invalid request path" or an ID validation error**: IDs may only contain letters, digits, `-` and `_`.

**"MPAN and serial number are required"**: pass `mpan`/`mprn` and `serial_number`, or set `OCTOPUS_ENERGY_ACCOUNT_NUMBER`.

**Empty rate results**: check `period_from` and `period_to` are ISO 8601 with a `Z` (e.g. `2024-01-01T00:00Z`).

**Consumption missing**: data can lag 24–48 hours and depends on your meter (SMETS1 vs SMETS2).

**Gas values look wrong**: SMETS1 reports kWh, SMETS2 reports cubic metres.

**Server not found / fails to start**: Node.js 24+ is required. Run `npx -y octopus-energy-mcp` in a terminal to see the error.
