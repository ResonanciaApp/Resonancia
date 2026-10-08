import { describe, expect, it } from "vitest";
import { publicPremiumStatus } from "./publicMembership";

describe("public membership presentation", () => {
  const now = Date.parse("2026-10-08T00:00:00Z");
  it("preserves unknown rather than labeling an unverified user free", () => {
    expect(publicPremiumStatus(null, now)).toBeNull();
    expect(publicPremiumStatus(undefined, now)).toBeNull();
  });
  it("shows an active subscription before its real expiration", () => {
    expect(publicPremiumStatus({ active: true, expiresAt: "2026-11-08T00:00:00Z" }, now)).toBe(true);
  });
  it("removes the badge at expiration without waiting for the owner to reopen", () => {
    expect(publicPremiumStatus({ active: true, expiresAt: "2026-10-08T00:00:00Z" }, now)).toBe(false);
  });
  it("handles inactive and non-expiring reported entitlements", () => {
    expect(publicPremiumStatus({ active: false, expiresAt: null }, now)).toBe(false);
    expect(publicPremiumStatus({ active: true, expiresAt: null }, now)).toBe(true);
  });
  it("does not invent a status from a corrupt expiry", () => {
    expect(publicPremiumStatus({ active: true, expiresAt: "not-a-date" }, now)).toBeNull();
  });
});
