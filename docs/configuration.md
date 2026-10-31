# Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `OCTOPUS_ENERGY_API_KEY` | For account and consumption tools | Sent as HTTP Basic auth (key as username, blank password) to `api.octopus.energy` only. |
| `OCTOPUS_ENERGY_ACCOUNT_NUMBER` | Recommended | Enables `mpan`/`mprn`/`serial_number` auto-discovery and the `octopus-energy://account` resource. The first current electricity and gas meter on the account is used (export meters and properties you have moved out of are skipped). If you pass only an `mpan`/`mprn` or only a `serial_number`, the other half is looked up from the account; pass both to query a meter that isn't listed. |

The account lookup is cached in memory for 24 hours. The server logs one JSON line per tool call to stderr; long values are truncated and the API key is never logged.

The API base URL is fixed and not configurable.
