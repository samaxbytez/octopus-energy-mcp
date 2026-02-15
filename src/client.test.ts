import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OctopusEnergyClient, OctopusEnergyApiError } from "./client.js";

let mockFetch: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockFetch = vi.fn();
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mockOk(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  } as Response;
}

function mockError(status: number, body: unknown): Response {
  return {
    ok: false,
    status,
    text: async () =>
      typeof body === "string" ? body : JSON.stringify(body),
  } as Response;
}

describe("OctopusEnergyClient - GET (unauthenticated)", () => {
  it("makes requests without auth header when not required", async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ count: 1, results: [] }));
    const client = new OctopusEnergyClient("test-key");
    await client.get("/v1/products/");

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/v1/products/");
    expect(opts.headers.Authorization).toBeUndefined();
  });

  it("appends query params", async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ count: 1, results: [] }));
    const client = new OctopusEnergyClient("token");
    await client.get("/v1/products/", { brand: "OCTOPUS_ENERGY", is_green: "true" });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("brand=OCTOPUS_ENERGY");
    expect(url).toContain("is_green=true");
  });

  it("handles empty response body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => "",
    } as Response);
    const client = new OctopusEnergyClient("token");
    const result = await client.get("/v1/test");
    expect(result).toEqual({});
  });
});

describe("OctopusEnergyClient - GET (authenticated)", () => {
  it("sends Basic Auth header when authentication is required", async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ number: "A-1234" }));
    const client = new OctopusEnergyClient("sk_live_abc123");
    await client.get("/v1/accounts/A-1234/", undefined, true);

    const [, opts] = mockFetch.mock.calls[0];
    const expectedAuth = `Basic ${btoa("sk_live_abc123:")}`;
    expect(opts.headers.Authorization).toBe(expectedAuth);
  });

  it("throws when auth required but no API key provided", async () => {
    const client = new OctopusEnergyClient();
    try {
      await client.get("/v1/accounts/A-1234/", undefined, true);
      expect.fail("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(OctopusEnergyApiError);
      const err = e as OctopusEnergyApiError;
      expect(err.status).toBe(401);
      expect(err.errorCode).toBe("missing_api_key");
    }
  });
});

describe("OctopusEnergyClient - error handling", () => {
  it("throws OctopusEnergyApiError with parsed fields", async () => {
    mockFetch.mockResolvedValueOnce(
      mockError(400, { detail: "Invalid MPAN" })
    );

    const client = new OctopusEnergyClient("token");
    try {
      await client.get("/v1/electricity-meter-points/bad/meters/bad/consumption/", undefined, true);
      expect.fail("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(OctopusEnergyApiError);
      const err = e as OctopusEnergyApiError;
      expect(err.status).toBe(400);
    }
  });

  it("returns safe fallback for malformed error body", async () => {
    mockFetch.mockResolvedValueOnce(mockError(500, "not json"));

    const client = new OctopusEnergyClient("token");
    try {
      await client.get("/v1/test");
      expect.fail("should have thrown");
    } catch (e) {
      const err = e as OctopusEnergyApiError;
      expect(err.errorCode).toBe("unknown");
      expect(err.message).not.toContain("not json");
    }
  });

  it("handles 404 errors", async () => {
    mockFetch.mockResolvedValueOnce(
      mockError(404, { detail: "Not found." })
    );

    const client = new OctopusEnergyClient("token");
    try {
      await client.get("/v1/products/NONEXISTENT/");
      expect.fail("should have thrown");
    } catch (e) {
      const err = e as OctopusEnergyApiError;
      expect(err.status).toBe(404);
    }
  });
});
