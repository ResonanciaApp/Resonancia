import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOtherThemeCards,
  buildOtherThemeInternalRoute,
  canonicalOtherThemeParentSlug,
  groupOtherThemeInternalSessions,
  hasOtherThemeInternalTag,
  parseOtherThemeInternalTag,
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

test("la portada configurada en Admin tiene prioridad sobre los fallbacks locales", () => {
  const configured = {
    ...section("rituales-de-luna", "Rituales de luna"),
    coverImagePath: "/objects/uploads/luna.webp",
  };
  const cards = buildOtherThemeCards({
    sections: [configured],
    localCards: [{
      id: "rituales-de-luna",
      label: "Local",
      description: "Fallback local",
      image: "local.jpg",
    }],
    sessions: [{ themeTag: ["Rituales de luna"], image: "sesion.jpg" }],
    isExcludedLabel: () => false,
    slugifyLabel: slugify,
    resolveCoverImage: (path) => `remote:${path}`,
  });

  assert.equal(cards[0]?.image, "remote:/objects/uploads/luna.webp");
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

test("las etiquetas editoriales internas nunca crean cards visibles", () => {
  const cards = buildOtherThemeCards({
    sections: [
      section(
        "category-theme-sonoterapia-vibracion",
        "__category_theme_sonoterapia__:Vibración",
      ),
      section(
        "supercategory-theme-sonidos-naturaleza",
        "__supercategory_theme_sonidos__:Naturaleza",
      ),
      section("rituales-de-luna", "Rituales de luna"),
    ],
    localCards: [],
    sessions: [],
    isExcludedLabel: () => false,
    slugifyLabel: slugify,
  });

  assert.deepEqual(cards.map((card) => card.id), ["rituales-de-luna"]);
});

test("conserva la última configuración cacheada ante una falla temporal", () => {
  const cached = [section("ansiedad", "Ansiedad")];
  const restored = parseExploreSectionsCache(JSON.stringify(cached));

  assert.deepEqual(restored, cached);
  assert.strictEqual(keepLastExploreSections(restored), restored);
  assert.deepEqual(keepLastExploreSections(null), []);
  assert.equal(parseExploreSectionsCache("{corrupto"), null);
});

test("parsea y agrupa etiquetas internas por temática principal", () => {
  assert.deepEqual(
    parseOtherThemeInternalTag("__other_theme_internal:ansiedad__:Calma"),
    { parentSlug: "ansiedad", label: "Calma" },
  );
  const sessions = [
    { themeTag: ["Para la ansiedad", "__other_theme_internal:ansiedad__:Calma"], image: "a" },
    { themeTag: ["Para la ansiedad", "__other_theme_internal:ansiedad__:Sueño"], image: "b" },
    { themeTag: ["Otra", "__other_theme_internal:otra__:Calma"], image: "c" },
  ];
  const groups = groupOtherThemeInternalSessions(sessions, "ansiedad", "Para la ansiedad");
  assert.deepEqual([...groups.keys()], ["Calma", "Sueño"]);
  assert.equal(groups.get("Calma")?.length, 1);
});

test("normaliza todos los IDs canónicos de las nueve temáticas", () => {
  const defaults = [
    ["Para la ansiedad", "para-la-ansiedad"],
    ["Energiza tus mañanas", "energiza-tus-mananas"],
    ["Foco y concentración", "foco-concentracion"],
    ["Suelto la Rabia", "suelto-la-rabia"],
    ["Crecimiento personal", "crecimiento-personal"],
    ["Armonía familiar", "armonia-familiar"],
    ["Respiración consciente", "respiracion-consciente"],
    ["Meditaciones Activas", "meditaciones-activas"],
    ["Astrología", "astrologia"],
  ] as const;
  for (const [label, slug] of defaults) {
    assert.equal(canonicalOtherThemeParentSlug(label), slug);
    assert.equal(
      parseOtherThemeInternalTag(`__other_theme_internal:${slug}__:Calma`)?.parentSlug,
      slug,
    );
  }
});

test("permite conservar en la vista general solo sesiones sin etiqueta hija", () => {
  const sessions = [
    { themeTag: ["Para la ansiedad"], image: "general" },
    { themeTag: ["Para la ansiedad", "__other_theme_internal:para-la-ansiedad__:Calma"], image: "child" },
  ];
  const general = sessions.filter(
    (session) => !hasOtherThemeInternalTag(session, "para-la-ansiedad", "Para la ansiedad"),
  );
  assert.deepEqual(general.map((session) => session.image), ["general"]);
});

test("construye la ruta interna preservando parent y etiqueta codificados", () => {
  assert.equal(
    buildOtherThemeInternalRoute("para-la-ansiedad", "Calma y sueño"),
    "/tag/para-la-ansiedad/internal/Calma%20y%20sue%C3%B1o",
  );
});

test("una etiqueta interna limita el carrusel a seis sesiones", () => {
  const sessions = Array.from({ length: 8 }, (_, index) => ({
    themeTag: ["Para la ansiedad", "__other_theme_internal:ansiedad__:Calma"],
    image: String(index),
  }));
  const group = groupOtherThemeInternalSessions(
    sessions,
    "ansiedad",
    "Para la ansiedad",
  ).get("Calma") ?? [];
  assert.equal(group.slice(0, 6).length, 6);
});

test("los tokens internos no se usan para la imagen de una card principal", () => {
  const cards = buildOtherThemeCards({
    sections: [section("ansiedad", "Para la ansiedad")],
    localCards: [],
    sessions: [{
      themeTag: ["__other_theme_internal:ansiedad__:Calma"],
      image: "internal.jpg",
    }],
    isExcludedLabel: () => false,
    slugifyLabel: slugify,
  });
  assert.equal(cards[0]?.image, undefined);
});