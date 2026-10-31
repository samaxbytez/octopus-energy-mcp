const BASE_URL = new URL("https://api.octopus.energy/v1/");
const BASE_PATH = "/v1/";
const TIMEOUT_MS = 30_000;

export class OctopusEnergyApiError extends Error {
  public readonly status: number;
  public readonly errorCode: string;

  constructor(status: number, errorCode: string, message: string) {
    super(`Octopus Energy API error (${status}): ${errorCode} - ${message}`);
    this.name = "OctopusEnergyApiError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

function parseApiError(
  status: number,
  body: string,
  retryAfter: string | null
): OctopusEnergyApiError {
  const retry = status === 429 && retryAfter ? ` (retry after ${retryAfter}s)` : "";
  try {
    const parsed = JSON.parse(body);
    const code = parsed?.error ?? parsed?.code ?? parsed?.detail ?? "unknown";
    const message =
      parsed?.message ?? parsed?.detail ?? parsed?.error_description ?? `HTTP ${status}`;
    return new OctopusEnergyApiError(status, code, `${message}${retry}`);
  } catch {
    // Never echo non-JSON bodies.
    return new OctopusEnergyApiError(status, "unknown", `HTTP ${status} error${retry}`);
  }
}

/** Resolve a request path against the API base, refusing anything that escapes it. */
export function resolveApiUrl(path: string): URL {
  if (
    /^[a-z][a-z0-9+.-]*:|^\/\/|\\|\.\.|%2e|%2f|%5c/i.test(path) ||
    [...path].some((c) => c.charCodeAt(0) <= 0x1f || c.charCodeAt(0) === 0x7f)
  ) {
    throw new Error("Invalid request path");
  }
  const url = new URL(path.replace(/^\/+/, ""), BASE_URL);
  if (url.origin !== BASE_URL.origin || !url.pathname.startsWith(BASE_PATH)) {
    throw new Error("Invalid request path");
  }
  return url;
}

export class OctopusEnergyClient {
  private apiKey: string | null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? null;
  }

  async get<T = unknown>(
    path: string,
    params?: Record<string, string>,
    requiresAuth = false
  ): Promise<T> {
    // Callers pass paths like "/v1/products/"; the base already ends in /v1/.
    const url = resolveApiUrl(path.replace(/^\/?v1\//, ""));

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }

    const headers: Record<string, string> = {};

    if (requiresAuth) {
      if (!this.apiKey) {
        throw new OctopusEnergyApiError(
          401,
          "missing_api_key",
          "API key is required for this endpoint"
        );
      }
      // Octopus Energy uses HTTP Basic Auth: API key as username, blank password
      headers["Authorization"] = `Basic ${btoa(`${this.apiKey}:`)}`;
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      throw parseApiError(
        response.status,
        await response.text(),
        response.headers.get("Retry-After")
      );
    }

    const text = await response.text();
    if (!text) return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new OctopusEnergyApiError(
        response.status,
        "invalid_response",
        "Response was not valid JSON"
      );
    }
  }
}
