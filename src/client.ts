const BASE_URL = "https://api.octopus.energy/v1";

export class OctopusEnergyApiError extends Error {
  public readonly status: number;
  public readonly errorCode: string;

  constructor(status: number, errorCode: string, message: string) {
    super(
      `Octopus Energy API error (${status}): ${errorCode} - ${message}`
    );
    this.name = "OctopusEnergyApiError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

function parseApiError(
  status: number,
  body: string
): OctopusEnergyApiError {
  try {
    const parsed = JSON.parse(body);
    const code = parsed?.error ?? parsed?.code ?? parsed?.detail ?? "unknown";
    const message =
      parsed?.message ?? parsed?.detail ?? parsed?.error_description ?? `HTTP ${status}`;
    return new OctopusEnergyApiError(status, code, message);
  } catch {
    return new OctopusEnergyApiError(status, "unknown", `HTTP ${status} error`);
  }
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
    return this.request<T>("GET", path, params, requiresAuth);
  }

  private async request<T = unknown>(
    method: string,
    path: string,
    params?: Record<string, string>,
    requiresAuth = false
  ): Promise<T> {
    const url = new URL(path, BASE_URL);

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
      const encoded = btoa(`${this.apiKey}:`);
      headers["Authorization"] = `Basic ${encoded}`;
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw parseApiError(response.status, errorBody);
    }

    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  }
}
