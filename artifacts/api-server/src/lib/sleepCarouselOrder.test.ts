import { describe, expect, it } from "vitest";
import type { SleepCarouselOrder } from "@workspace/db";
import {
  projectSleepCarouselOrder,
  sleepCarouselRevision,
} from "./sleepCarouselOrder";

function savedRow(
  key: string,
  type: "session" | "playlist",
  label: string,
  visible: boolean,
  sortOrder: number,
  id: number,
): SleepCarouselOrder {
  const timestamp = new Date("2026-09-11T00:00:00.000Z");
  return {
    id,
    key,
    type,
    label,
    visible,
    sortOrder,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe("sleep carousel order projection", () => {
  it("preserves a dormant playlist carousel and restores its saved state on reactivation", () => {
    const persisted = [
      savedRow("playlist:42", "playlist", "Dormir profundo", false, 1, 1),
      savedRow("playlist:99", "playlist", "Pausa nocturna", false, 0, 2),
    ];

    const whileDormant = projectSleepCarouselOrder(
      persisted,
      [{ id: 42, title: "Dormir profundo" }],
    );
    expect(whileDormant.carousels.some((item) => item.key === "playlist:99")).toBe(false);

    const reactivated = projectSleepCarouselOrder(
      persisted,
      [
        { id: 42, title: "Dormir profundo" },
        { id: 99, title: "Pausa nocturna" },
      ],
    );
    expect(reactivated.carousels.find((item) => item.key === "playlist:99")).toMatchObject({
      visible: false,
      sortOrder: 0,
    });
  });

  it("calculates the same revision regardless of database row order", () => {
    const first = savedRow("playlist:42", "playlist", "Dormir profundo", true, 2, 1);
    const second = savedRow("session:ruido", "session", "Ruido", false, 0, 2);
    const active = [{ id: 42, title: "Dormir profundo" }];

    expect(sleepCarouselRevision([first, second], active)).toBe(
      sleepCarouselRevision([second, first], active),
    );
  });
});