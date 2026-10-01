import { describe, expect, it } from "vitest";
import { isFeaturedMomentEligible } from "./featuredMomentEligibility";
import type { CatalogSession } from "@workspace/db";

const session = {
  id: "1",
  title: "Baño de cuencos",
  subtitle: "Sesión de prueba",
  categoryId: "sonidos-ancestrales",
  categoryLabel: "Sonoterapia",
  duration: 20,
  description: "Una descripción válida.",
  isPlaceholder: false,
  status: "published",
} as CatalogSession;

describe("featured moment eligibility", () => {
  it("requires an actual reproducible main/base remote or known bundled track", () => {
    expect(isFeaturedMomentEligible(session, [])).toBe(false);
    expect(isFeaturedMomentEligible(session, [
      { role: "main", url: null, assetKey: "not-a-bundle" },
    ])).toBe(false);
    expect(isFeaturedMomentEligible(session, [
      { role: "base", url: null, assetKey: "bundle:1" },
    ])).toBe(true);
    expect(isFeaturedMomentEligible(session, [
      { role: "main", url: "/objects/session/audio.mp3", assetKey: null },
    ])).toBe(true);
  });

  it("excludes Music, retired category, placeholders, and unpublished sessions", () => {
    const track = [{ role: "main" as const, url: "/objects/session/audio.mp3", assetKey: null }];
    expect(isFeaturedMomentEligible({ ...session, categoryId: "musica-sonidos" }, track)).toBe(false);
    expect(isFeaturedMomentEligible({ ...session, categoryId: "reflexiones" }, track)).toBe(false);
    expect(isFeaturedMomentEligible({ ...session, isPlaceholder: true }, track)).toBe(false);
    expect(isFeaturedMomentEligible({ ...session, status: "draft" }, track)).toBe(false);
  });
});