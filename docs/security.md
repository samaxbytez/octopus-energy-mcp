# Security

## Threat model

Text returned by an API can be influenced by third parties, and an AI model may treat it as instructions (indirect prompt injection). So every tool argument is treated as attacker-controlled.

## What the server does

- **Read-only.** Every tool is a `GET`; each is annotated `readOnlyHint: true`. There is no tool that changes tariffs, payment details, direct debits or account data, so there is nothing to gate.
- **One destination.** Requests go only to `https://api.octopus.energy/v1/`. The client rejects absolute and scheme-relative URLs, backslashes, `..`, encoded dots and slashes and control characters, then re-checks that the resolved origin and path stay under the API base.
- **Strict IDs.** Values placed in request paths must match `^[a-zA-Z0-9_-]+$`. Meter IDs discovered from your account are validated the same way.
- **No redirects.** Redirects are refused, so the credential can't be forwarded elsewhere.
- **Limits.** 30-second timeout per request; response bodies over 5 MB and API error text are truncated or refused.
- **Credential handling.** The API key is only read from the environment and sent in the `Authorization` header. It is not logged or included in errors. Non-JSON error bodies are never echoed.
- **No runtime dependencies.** The package is one bundled file; third-party licences ship in `build/THIRD_PARTY_LICENSES.txt`. Releases are published from CI (main branch only) with npm provenance.

## Residual risk

`octopus_energy_get_account` returns personal data (address, meter identifiers). Anything the model can read it can repeat, so use accounts and assistants you trust.

## Verification

`npm run attack` starts the built server against a fake API and a second "evil" listener, then fires hostile values (traversal, encoded dots, absolute URLs, CRLF, NUL, 5 KB strings, `__proto__`) at every string argument of every tool. It asserts all requests stay under `/v1/`, no headers or query keys are injected, and the credential never reaches the evil host, including after a 302 redirect.

## Reporting

Open a private security advisory on the GitHub repository.
