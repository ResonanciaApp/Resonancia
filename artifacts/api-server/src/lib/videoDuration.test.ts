import { describe, expect, it } from "vitest";
import { resolveVideoDuration } from "./videoDuration";

describe("public video duration", () => {
  it("preserves the saved duration when Bunny metadata is unavailable", () => {
    expect(resolveVideoDuration(null, "1:47")).toBe("1:47");
    expect(resolveVideoDuration("", "2:07")).toBe("2:07");
  });

  it("prefers a newly detected duration", () => {
    expect(resolveVideoDuration("2:08", "2:07")).toBe("2:08");
  });

  it("does not invent a duration when both sources are unknown", () => {
    expect(resolveVideoDuration(null, "")).toBe("");
    expect(resolveVideoDuration(null, "  ")).toBe("");
  });
});