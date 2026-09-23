import { describe, expect, it } from "vitest";

import {
  optionalVideoThemeSchema,
  RESERVED_VIDEO_THEME,
  VIDEO_THEME_MAX_LENGTH,
} from "./videoTheme";

describe("optionalVideoThemeSchema", () => {
  it("normalizes a custom video theme", () => {
    expect(optionalVideoThemeSchema.parse("  Filosofía   oriental  ")).toBe(
      "Filosofía oriental",
    );
  });

  it("normalizes decomposed Unicode before storing a theme", () => {
    expect(optionalVideoThemeSchema.parse("Mu\u0301sica")).toBe("Música");
  });

  it("allows a video to have no theme", () => {
    expect(optionalVideoThemeSchema.parse(null)).toBeNull();
    expect(optionalVideoThemeSchema.parse(undefined)).toBeUndefined();
  });

  it("rejects empty and excessively long themes", () => {
    expect(() => optionalVideoThemeSchema.parse("   ")).toThrow();
    expect(() =>
      optionalVideoThemeSchema.parse("x".repeat(VIDEO_THEME_MAX_LENGTH + 1)),
    ).toThrow();
  });

  it("rejects the reserved all-videos label regardless of case", () => {
    expect(() => optionalVideoThemeSchema.parse(RESERVED_VIDEO_THEME)).toThrow();
    expect(() => optionalVideoThemeSchema.parse("todos")).toThrow();
    expect(() => optionalVideoThemeSchema.parse(" \tTODOS\t ")).toThrow();
  });
});