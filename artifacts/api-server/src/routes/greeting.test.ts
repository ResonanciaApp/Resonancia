import { describe, expect, it } from "vitest";
import { publicGreetingDto, validateGreetingUpdate } from "./greeting";

describe("greeting API boundary helpers", () => {
  it("requires nonblank text when enabled", () => {
    expect(validateGreetingUpdate({ enabled: true, text: "   ", revision: 0 }).success).toBe(false);
    expect(validateGreetingUpdate({ enabled: true, text: "Buenos días", revision: 0 }).success).toBe(true);
  });

  it("accepts null text when disabled", () => {
    expect(validateGreetingUpdate({ enabled: false, text: null, revision: 0 }).success).toBe(true);
  });

  it("hides stored disabled text from the public DTO", () => {
    const dto = publicGreetingDto({
      id: 1,
      enabled: false,
      text: "private draft",
      revision: 3,
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    expect(dto).toEqual({ enabled: false, text: null });
    expect(dto).not.toHaveProperty("revision");
    expect(dto).not.toHaveProperty("updatedAt");
  });
});