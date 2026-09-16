import assert from "node:assert/strict";
import test from "node:test";

import { resolveFeaturedMoment } from "../data/featured-moment.ts";
import type { Session } from "../data/sessions.ts";

function session(
  id: string,
  overrides: Partial<Session> = {},
): Session {
  return {
    id,
    title: id,
    subtitle: "",
    categoryId: "ambientales",
    categoryLabel: "Ambientales",
    duration: 10,
    durationLabel: "10 min",
    image: 0,
    description: "",
    benefits: [],
    instruments: [],
    ...overrides,
  };
}

test("a pinned published catalog session overrides the daily rotation regardless of category", () => {
  const daily = session("daily", {
    categoryId: "meditaciones-guiadas",
    isFeatured: true,
  });
  const pinned = session("pinned", {
    categoryId: "ambientales",
  });

  assert.equal(
    resolveFeaturedMoment([daily, pinned], pinned.id, new Date("2026-09-16")),
    pinned,
  );
});

test("Destacada en Inicio participates in the daily rotation when no session is pinned", () => {
  const regular = session("regular");
  const featured = session("featured", { isFeatured: true });

  assert.equal(
    resolveFeaturedMoment([regular, featured], null, new Date("2026-09-16")),
    featured,
  );
});

test("placeholders cannot appear as pinned or rotating home content", () => {
  const placeholder = session("placeholder", {
    isFeatured: true,
    isPlaceholder: true,
  });

  assert.equal(
    resolveFeaturedMoment([placeholder], placeholder.id, new Date("2026-09-16")),
    undefined,
  );
});