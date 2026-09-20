import { describe, expect, it } from "vitest";
import type { SoundCarouselOrder } from "@workspace/db";
import {
  collectSoundCarouselSources,
  projectSoundCarouselOrder,
  soundCarouselRevision,
} from "./soundCarouselOrder";

function savedRow(
  key: string,
  label: string,
  visible: boolean,
  sortOrder: number,
  id: number,
): SoundCarouselOrder {
  const timestamp = new Date("2026-09-20T00:00:00.000Z");
  return { id, key, label, visible, sortOrder, createdAt: timestamp, updatedAt: timestamp };
}

describe("sound carousel order projection", () => {
  it("retains dormant settings and restores them when a collection returns", () => {
    const persisted = [
      savedRow("collection:Lluvia", "Lluvia", false, 0, 1),
      savedRow("collection:Mar", "Mar", true, 1, 2),
    ];
    expect(projectSoundCarouselOrder(persisted, [{ key: "collection:Mar", label: "Mar" }]).carousels)
      .toHaveLength(1);
    expect(projectSoundCarouselOrder(persisted, [
      { key: "collection:Lluvia", label: "Lluvia" },
      { key: "collection:Mar", label: "Mar" },
    ]).carousels[0]).toMatchObject({ key: "collection:Lluvia", visible: false, sortOrder: 0 });
  });

  it("appends new collections visible by default", () => {
    const persisted = [savedRow("collection:Mar", "Mar", true, 0, 1)];
    const projected = projectSoundCarouselOrder(persisted, [
      { key: "collection:Mar", label: "Mar" },
      { key: "collection:Viento", label: "Viento" },
    ]);
    expect(projected.carousels[1]).toMatchObject({ key: "collection:Viento", visible: true, sortOrder: 1 });
  });

  it("collects unique published tags and supports legacy tags", () => {
    expect(collectSoundCarouselSources([
      { sonidosTags: ["Todos los sonidos", "Lluvia"], sonidosTag: null },
      { sonidosTags: ["Lluvia"], sonidosTag: null },
      { sonidosTags: [], sonidosTag: "Sonidos Binaurales" },
    ]).map((item) => item.label)).toEqual([
      "Todos los sonidos", "Sonidos binaurales", "Lluvia",
    ]);
  });

  it("calculates the same revision regardless of row order", () => {
    const first = savedRow("collection:Lluvia", "Lluvia", true, 1, 1);
    const second = savedRow("collection:Mar", "Mar", false, 0, 2);
    const active = [{ key: "collection:Lluvia", label: "Lluvia" }];
    expect(soundCarouselRevision([first, second], active)).toBe(
      soundCarouselRevision([second, first], active),
    );
  });
});