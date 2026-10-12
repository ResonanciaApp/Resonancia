import { describe, expect, it } from "vitest";
import { DEFAULT_STREAK_INFO, validateStreakInfoUpdate } from "./streakInfoContent";

const input = () => ({ content: structuredClone(DEFAULT_STREAK_INFO), revision: 0 });
describe("streak information editorial validation", () => {
  it("starts with the four existing cards", () => {
    expect(validateStreakInfoUpdate(input()).success).toBe(true);
  });
  it("trims text and keeps canonical identity and ordering", () => {
    const body = input();
    body.content.title = "  Mis rachas  ";
    body.content.cards.reverse();
    const parsed = validateStreakInfoUpdate(body);
    expect(parsed.success && parsed.data.content.title).toBe("Mis rachas");
    expect(parsed.success && parsed.data.content.cards.map(card => card.id))
      .toEqual(["current", "accumulated", "longest", "completed"]);
  });
  it("rejects missing and duplicated types", () => {
    const body = input();
    body.content.cards[1].id = "current";
    expect(validateStreakInfoUpdate(body).success).toBe(false);
    body.content.cards.pop();
    expect(validateStreakInfoUpdate(body).success).toBe(false);
  });
  it("rejects blank or oversized text and invalid revisions", () => {
    const body = input();
    body.content.cards[0].description = " \n ";
    expect(validateStreakInfoUpdate(body).success).toBe(false);
    expect(validateStreakInfoUpdate({ ...input(), revision: -1 }).success).toBe(false);
    const oversized = input();
    oversized.content.title = "a".repeat(101);
    expect(validateStreakInfoUpdate(oversized).success).toBe(false);
  });
});
