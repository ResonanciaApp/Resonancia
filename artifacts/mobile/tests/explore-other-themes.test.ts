import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOtherThemeCards,
  keepLastExploreSections,
  parseExploreSectionsCache,
  type ExploreSection,
} from "../lib/explore-other-themes.ts";

const slugify = (label: string) =>
  label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const section = (
  slug: string,
  label: string,
  visible = true,
  sortOrder = 0,
): ExploreSection => ({ slug, label, visible, sortOrder });

test("mantiene el orden del Admin y elimina las cards ocultas", () => {
  const cards = buildOtherThemeCards({
    sections: [
      section("segunda", "Segunda", true, 0),
      section("oculta", "Oculta", false, 1),
      section("primera", "Primera", true, 2),
    ],
    localCards: [],
    sessions: [],
    isExcludedLabel: () => false,
    slugifyLabel: slugify,
  });

  assert.deepEqual(cards.map((card) => card.id), ["segunda", "primera"]);
});

test("una categoría dinámica usa la imagen de una sesión con el mismo tag", () => {
  const cards = buildOtherThemeCards({
    sections: [section("rituales-de-luna", "Rituales de luna")],
    localCards: [],
    sessions: [{ themeTag: ["Rituales de luna"], image: "luna.jpg" }],
    isExcludedLabel: () => false,
    slugifyLabel: slugify,
  });

  assert.equal(cards[0]?.image, "luna.jpg");
  assert.equal(cards[0]?.label, "Rituales de luna");
});

test("una categoría dinámica sin sesión queda disponible para el fallback visual", () => {
  const cards = buildOtherThemeCards({
    sections: [section("tema-nuevo", "Tema nuevo")],
    localCards: [],
    sessions: [],
    isExcludedLabel: () => false,
    slugifyLabel: slugify,
  });

  assert.equal(cards[0]?.image, undefined);
});

test("deduplica slugs y excluye categorías reservadas", () => {
  const cards = buildOtherThemeCards({
    sections: [
      section("repetida", "Repetida"),
      section("repetida", "Repetida duplicada"),
      section("chakra-corazon", "Chakra corazón"),
    ],
    localCards: [],
    sessions: [],
    isExcludedLabel: (label) => label.startsWith("Chakra"),
    slugifyLabel: slugify,
  });

  assert.deepEqual(cards.map((card) => card.id), ["repetida"]);
});

test("conserva la última configuración cacheada ante una falla temporal", () => {
  const cached = [section("ansiedad", "Ansiedad")];
  const restored = parseExploreSectionsCache(JSON.stringify(cached));

  assert.deepEqual(restored, cached);
  assert.strictEqual(keepLastExploreSections(restored), restored);
  assert.deepEqual(keepLastExploreSections(null), []);
  assert.equal(parseExploreSectionsCache("{corrupto"), null);
});