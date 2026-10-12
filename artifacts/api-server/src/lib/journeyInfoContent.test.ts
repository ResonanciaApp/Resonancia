import { describe, expect, it } from "vitest";
import { DEFAULT_JOURNEY_INFO, validateJourneyInfoUpdate } from "./journeyInfoContent";
describe("Journey explanation", () => {
  it("preserves the initial explanation and trims edits", () => {
    expect(validateJourneyInfoUpdate({ content: DEFAULT_JOURNEY_INFO, revision: 0 }).success).toBe(true);
    const result = validateJourneyInfoUpdate({ content: { title: " Otro título ", description: " Párrafo 1\n\nPárrafo 2 " }, revision: 2 });
    expect(result.success && result.data.content).toEqual({ title: "Otro título", description: "Párrafo 1\n\nPárrafo 2" });
  });
  it("rejects empty, oversized and invalid revisions", () => {
    for (const content of [{ title: " ", description: "x" }, { title: "x", description: "" }, { title: "x".repeat(101), description: "x" }, { title: "x", description: "x".repeat(5001) }]) {
      expect(validateJourneyInfoUpdate({ content, revision: 0 }).success).toBe(false);
    }
    expect(validateJourneyInfoUpdate({ content: DEFAULT_JOURNEY_INFO, revision: -1 }).success).toBe(false);
  });
});
