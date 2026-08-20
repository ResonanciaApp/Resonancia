import { afterEach, describe, expect, it } from "vitest";
import {
  getCapacityMetricsSnapshot,
  normalizeCapacityRoute,
  recordCapacityObservation,
  resetCapacityMetricsForTests,
} from "./capacityMetrics";

afterEach(() => resetCapacityMetricsForTests());

describe("capacity metrics", () => {
  it("uses the matched route template without keeping identifiers", () => {
    expect(
      normalizeCapacityRoute({
        baseUrl: "/api",
        path: "/api/dm/with/123",
        route: { path: "/dm/with/:userId" },
      } as never),
    ).toBe("/api/dm/with/:userId");
  });

  it("does not retain raw unmatched paths", () => {
    expect(
      normalizeCapacityRoute({
        baseUrl: "",
        path: "/private-value-not-a-route",
        route: undefined,
      } as never),
    ).toBe("/__unmatched__");
  });

  it("keeps bounded latency and status aggregates", () => {
    for (const durationMs of [10, 20, 30, 40, 100]) {
      recordCapacityObservation({
        method: "GET",
        route: "/api/catalog",
        statusCode: durationMs === 100 ? 500 : 200,
        durationMs,
        responseBytes: 100,
      });
    }

    const [route] = getCapacityMetricsSnapshot().routes;
    expect(route.count).toBe(5);
    expect(route.errors).toBe(1);
    expect(route.latencyMs.p50).toBe(30);
    expect(route.latencyMs.p95).toBe(100);
    expect(route.statusCodes).toEqual({ 200: 4, 500: 1 });
  });

  it("keeps a global cap when many distinct routes arrive", () => {
    for (let index = 0; index < 110; index += 1) {
      recordCapacityObservation({
        method: index % 2 === 0 ? "GET" : "POST",
        route: `/api/test/${index}`,
        statusCode: 200,
        durationMs: 1,
        responseBytes: 0,
      });
    }

    const routes = getCapacityMetricsSnapshot().routes;
    expect(routes).toHaveLength(100);
    expect(routes.find((route) => route.route === "__other__")?.count).toBe(11);
  });
});