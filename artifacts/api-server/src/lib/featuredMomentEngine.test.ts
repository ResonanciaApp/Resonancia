import { describe, expect, it } from "vitest";
import {
  editorialDate,
  migrateLegacyPin,
  nextEditorialBoundary,
  recordManualAsSeen,
  resolveManualOverride,
  takeAutomaticId,
} from "./featuredMomentEngine";

describe("featured moment daily cycle engine", () => {
  it("uses the Chilean calendar across year boundaries and both DST offsets", () => {
    expect(editorialDate(new Date("2025-01-01T02:59:59.000Z"))).toBe("2024-12-31");
    expect(editorialDate(new Date("2025-01-01T03:00:00.000Z"))).toBe("2025-01-01");
    const summer = new Date("2025-01-15T12:00:00.000Z");
    const winter = new Date("2025-07-15T12:00:00.000Z");
    expect(nextEditorialBoundary(summer).toISOString()).toBe("2025-01-16T03:00:00.000Z");
    expect(nextEditorialBoundary(winter).toISOString()).toBe("2025-07-16T04:00:00.000Z");
  });

  it("cycles without replacement and avoids repeating the prior cycle's final ID", () => {
    const ids = ["a", "b", "c"];
    let cycle = {
      queue: [] as string[],
      knownSessionIds: [] as string[],
      lastAutomaticId: null as string | null,
    };
    const first = takeAutomaticId(ids, cycle, null, () => 0);
    cycle = first.cycle;
    const second = takeAutomaticId(ids, cycle, first.id, () => 0);
    cycle = second.cycle;
    const third = takeAutomaticId(ids, cycle, second.id, () => 0);
    expect(new Set([first.id, second.id, third.id]).size).toBe(3);
    const next = takeAutomaticId(ids, third.cycle, third.id, () => 0);
    expect(next.id).not.toBe(third.id);
  });

  it("handles zero/one candidates and catalog additions/removals without a reset", () => {
    const empty = takeAutomaticId(
      [],
      { queue: ["old"], knownSessionIds: ["old"], lastAutomaticId: null },
      null,
    );
    expect(empty.id).toBeNull();
    expect(empty.cycle).toEqual({ queue: [], knownSessionIds: [], lastAutomaticId: null });
    const republished = takeAutomaticId(
      ["old", "new"],
      empty.cycle,
      null,
      () => 0,
    );
    expect(["old", "new"]).toContain(republished.id);
    const one = takeAutomaticId(["only"], { queue: [], knownSessionIds: [], lastAutomaticId: "only" }, "only", () => 0);
    expect(one.id).toBe("only");
    const current = takeAutomaticId(["b", "new"], { queue: ["a", "b"], knownSessionIds: ["a", "b"], lastAutomaticId: "a" }, null, () => 0);
    expect(current.id).toBe("b");
    expect(current.cycle.queue).toContain("new");
    expect(current.cycle.queue).not.toContain("a");
  });

  it("does not immediately repeat a manually displayed session when alternatives exist", () => {
    expect(takeAutomaticId(["a", "b"], { queue: ["a", "b"], knownSessionIds: ["a", "b"], lastAutomaticId: null }, "a", () => 0).id).toBe("b");
  });

  it("counts a publicly exposed manual ID as seen without consuming unrelated pending IDs", () => {
    const firstManual = recordManualAsSeen("c", {
      queue: [],
      knownSessionIds: [],
      lastAutomaticId: null,
    });
    expect(firstManual.cycle).toEqual({
      queue: [],
      knownSessionIds: ["c"],
      lastAutomaticId: null,
    });
    const automatic = takeAutomaticId(["a", "b", "c"], firstManual.cycle, "c", () => 0);
    expect(automatic.id).not.toBe("c");

    const newManual = recordManualAsSeen("c", {
      queue: ["b"],
      knownSessionIds: ["a", "b"],
      lastAutomaticId: "a",
    });
    expect(newManual.cycle.queue).toEqual(["b"]);
    expect(newManual.cycle.knownSessionIds).toEqual(["a", "b", "c"]);
    expect(takeAutomaticId(["a", "b", "c"], newManual.cycle, "c", () => 0).id).toBe("b");
  });

  it("prefers avoiding last shown at a cycle boundary when that conflicts with last automatic", () => {
    const result = takeAutomaticId(
      ["a", "b"],
      { queue: [], knownSessionIds: ["a", "b"], lastAutomaticId: "a" },
      "b",
      () => 0.99,
    );
    expect(result.id).toBe("a");
  });

  it("reshuffles only after every known candidate has been consumed", () => {
    const eligible = ["a", "b", "c"];
    let cycle = { queue: [] as string[], knownSessionIds: [] as string[], lastAutomaticId: null as string | null };
    const firstCycle: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const result = takeAutomaticId(eligible, cycle, firstCycle.at(-1) ?? null, () => 0);
      firstCycle.push(result.id!);
      cycle = result.cycle;
    }
    expect(new Set(firstCycle).size).toBe(3);
    expect(cycle.queue).toEqual([]);
    expect(cycle.knownSessionIds).toHaveLength(3);

    const secondCycle: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const result = takeAutomaticId(
        eligible,
        cycle,
        secondCycle.at(-1) ?? firstCycle.at(-1)!,
        () => 0.99,
      );
      secondCycle.push(result.id!);
      cycle = result.cycle;
    }
    expect(new Set(secondCycle).size).toBe(3);
    expect(secondCycle[0]).not.toBe(firstCycle.at(-1));
    expect(secondCycle).not.toEqual(firstCycle);
    expect(cycle.knownSessionIds).toEqual(eligible);
  });

  it("invalidates a manual choice when its date or current eligibility changes", () => {
    expect(resolveManualOverride("a", "2025-01-01", "2025-01-01", ["a"])).toBe("a");
    expect(resolveManualOverride("a", "2025-01-01", "2025-01-02", ["a"])).toBeNull();
    expect(resolveManualOverride("a", "2025-01-02", "2025-01-02", ["b"])).toBeNull();
  });

  it("migrates only the first eligible legacy pin once", () => {
    expect(migrateLegacyPin(["placeholder", "valid"], ["valid"], false)).toBe("valid");
    expect(migrateLegacyPin(["valid"], ["valid"], true)).toBeNull();
    expect(migrateLegacyPin(["invalid"], ["valid"], false)).toBeNull();
  });
});