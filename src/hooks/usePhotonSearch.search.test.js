import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PHOTON_URL, REMOTE_SEARCH_DEBOUNCE_MS } from "../lib/search.js";
import { usePhotonSearch } from "./usePhotonSearch.js";

function jsonResponse(body, ok = true) {
  return {
    ok,
    json: () => Promise.resolve(body),
  };
}

const cathedralPayload = {
  features: [
    {
      geometry: { coordinates: [-79.9532, 40.4443] },
      properties: { name: "Cathedral of Learning", city: "Pittsburgh" },
    },
  ],
};

describe("usePhotonSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("stays idle and does not fetch until the query is at least 3 characters", async () => {
    const { result, rerender } = renderHook(({ query }) => usePhotonSearch(query), {
      initialProps: { query: "cm" },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REMOTE_SEARCH_DEBOUNCE_MS);
    });

    expect(result.current).toEqual({ hits: [], status: "idle" });
    expect(fetch).not.toHaveBeenCalled();

    rerender({ query: "  cmu  " });
    expect(fetch).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REMOTE_SEARCH_DEBOUNCE_MS);
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    const requested = fetch.mock.calls[0][0];
    expect(String(requested)).toContain(PHOTON_URL);
    expect(String(requested)).toContain("q=cmu");
  });

  it("maps a successful Photon response after the debounce", async () => {
    fetch.mockResolvedValue(jsonResponse(cathedralPayload));

    const { result } = renderHook(() => usePhotonSearch("cathedral"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REMOTE_SEARCH_DEBOUNCE_MS);
    });

    expect(result.current.status).toBe("done");
    expect(result.current.hits).toEqual([
      {
        name: "Cathedral of Learning",
        detail: "Pittsburgh",
        lat: 40.4443,
        lng: -79.9532,
      },
    ]);
  });

  it("sets error and clears hits when Photon fails", async () => {
    fetch.mockResolvedValue(jsonResponse({}, false));

    const { result } = renderHook(() => usePhotonSearch("bridges"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REMOTE_SEARCH_DEBOUNCE_MS);
    });

    expect(result.current).toEqual({ hits: [], status: "error" });
  });

  it("does not apply a stale response after the query changes", async () => {
    fetch.mockImplementation((url, init = {}) => {
      const query = new URL(String(url), "https://photon.komoot.io").searchParams.get("q");
      if (query === "car") {
        return new Promise((resolve, reject) => {
          const abort = () => reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
          if (init.signal?.aborted) {
            abort();
            return;
          }
          init.signal?.addEventListener("abort", abort, { once: true });
        });
      }
      return Promise.resolve(jsonResponse(cathedralPayload));
    });

    const { result, rerender } = renderHook(({ query }) => usePhotonSearch(query), {
      initialProps: { query: "car" },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REMOTE_SEARCH_DEBOUNCE_MS);
    });

    rerender({ query: "cathedral" });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REMOTE_SEARCH_DEBOUNCE_MS);
    });

    expect(result.current.status).toBe("done");
    expect(result.current.hits.map((hit) => hit.name)).toEqual(["Cathedral of Learning"]);
    expect(result.current.hits.map((hit) => hit.name)).not.toContain("Old Result");
  });

  it("returns to idle when the query is cleared", async () => {
    fetch.mockResolvedValue(jsonResponse(cathedralPayload));
    const { result, rerender } = renderHook(({ query }) => usePhotonSearch(query), {
      initialProps: { query: "cathedral" },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REMOTE_SEARCH_DEBOUNCE_MS);
    });
    expect(result.current.status).toBe("done");

    rerender({ query: "" });
    expect(result.current).toEqual({ hits: [], status: "idle" });
  });
});
