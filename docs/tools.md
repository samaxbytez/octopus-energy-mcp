# Tools

All tools are read-only (`readOnlyHint: true`) and return compact JSON. ID arguments (`account_number`, `mpan`, `mprn`, `serial_number`, `product_code`, `tariff_code`) accept only letters, digits, `-` and `_` (max 100 chars). Dates are ISO 8601, e.g. `2024-01-01T00:00Z`.

## Account (requires API key)

| Tool | Endpoint | Parameters |
| --- | --- | --- |
| `octopus_energy_get_account` | `GET /v1/accounts/{account_number}/` | `account_number` |

## Products

| Tool | Endpoint | Parameters |
| --- | --- | --- |
| `octopus_energy_list_products` | `GET /v1/products/` | `brand`, `is_variable`, `is_business`, `is_green`, `is_prepay`, `available_at`, `page` |
| `octopus_energy_get_product` | `GET /v1/products/{product_code}/` | `product_code`, `tariffs_active_at` |

## Consumption (requires API key)

| Tool | Endpoint |
| --- | --- |
| `octopus_energy_get_electricity_consumption` | `GET /v1/electricity-meter-points/{mpan}/meters/{serial}/consumption/` |
| `octopus_energy_get_gas_consumption` | `GET /v1/gas-meter-points/{mprn}/meters/{serial}/consumption/` |

Parameters: `mpan`/`mprn` and `serial_number` (auto-discovered when an account number is set), `period_from`, `period_to`, `page_size` (max 25000), `order_by` (`period` or `-period`), `group_by` (`day`, `week`, `month`, `quarter`), `page`.

SMETS1 gas meters report kWh; SMETS2 report cubic metres.

## Tariffs (no API key)

Parameters for all: `product_code`, `tariff_code`, `period_from`, `period_to`, `page`, `page_size` (max 1500).

| Tool | Endpoint suffix |
| --- | --- |
| `octopus_energy_get_electricity_standard_unit_rates` | `/electricity-tariffs/{tariff}/standard-unit-rates/` |
| `octopus_energy_get_electricity_standing_charges` | `/electricity-tariffs/{tariff}/standing-charges/` |
| `octopus_energy_get_electricity_day_unit_rates` | `/electricity-tariffs/{tariff}/day-unit-rates/` |
| `octopus_energy_get_electricity_night_unit_rates` | `/electricity-tariffs/{tariff}/night-unit-rates/` |
| `octopus_energy_get_gas_standard_unit_rates` | `/gas-tariffs/{tariff}/standard-unit-rates/` |
| `octopus_energy_get_gas_standing_charges` | `/gas-tariffs/{tariff}/standing-charges/` |

All are under `/v1/products/{product_code}`.

## Pagination

List responses include the API's `count`, `next` and `previous` fields. Pass `page` to move through pages. Consumption and rate tools accept `page_size`.

## Resource

`octopus-energy://account` (only when both env vars are set): account number, properties, meters and active tariffs.
