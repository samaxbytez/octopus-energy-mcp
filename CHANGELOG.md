# Changelog

## 2.0.0 - 2026-10-31

### Breaking

- Requires Node.js 24 or newer (was 18).

### Security

- IDs used in request paths (account number, meter IDs, product and tariff codes) now accept only letters, digits, `-` and `_`. Meter IDs found from your account are checked the same way.
- The API client refuses absolute, encoded and traversal paths, refuses redirects, times out after 30 seconds, and no longer echoes non-JSON error bodies.
- Response bodies over 5 MB are refused, and API error text is clipped.
- The package is now one bundled file with no runtime dependencies. MCP SDK updated to 1.32.2.

### Added

- Every tool is marked read-only.
- Rate-limit errors (429) include the `Retry-After` time.

### Fixed

- Passing only an MPAN/MPRN or only a serial number no longer pairs it with the wrong meter.
- Auto-discovery skips export meters and properties you have moved out of, and compares tariff dates correctly.
- The server reports its real version.
- The account cache is no longer shared between different account numbers.

### Changed

- Tool output is compact JSON.
- The account resource no longer repeats the properties list.
