import { describe, expect, it } from "vitest";

import { resolvePinnedFeaturedValue } from "./pinnedFeatured";

describe("resolvePinnedFeaturedValue", () => {
  it("keeps a published non-placeholder session pinned", () => {
    expect(resolvePinnedFeaturedValue({
      currentValue: true,
      requestedValue: undefined,
      status: "published",
      isPlaceholder: false,
    })).toEqual({ valid: true, value: true });
  });

  it("clears the pin when the session becomes a placeholder", () => {
    expect(resolvePinnedFeaturedValue({
      currentValue: true,
      requestedValue: undefined,
      status: "published",
      isPlaceholder: true,
    })).toEqual({ valid: true, value: false });
  });

  it("clears the pin when a session leaves published state", () => {
    expect(resolvePinnedFeaturedValue({
      currentValue: true,
      requestedValue: undefined,
      status: "draft",
      isPlaceholder: false,
    })).toEqual({ valid: true, value: false });
  });

  it("rejects pinning a draft or placeholder explicitly", () => {
    expect(resolvePinnedFeaturedValue({
      currentValue: false,
      requestedValue: true,
      status: "draft",
      isPlaceholder: false,
    })).toEqual({ valid: false });
    expect(resolvePinnedFeaturedValue({
      currentValue: false,
      requestedValue: true,
      status: "published",
      isPlaceholder: true,
    })).toEqual({ valid: false });
  });
});