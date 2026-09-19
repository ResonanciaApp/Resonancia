import assert from "node:assert/strict";
import test from "node:test";

import {
  getCategoryTagRouteNamespace,
  getCategoryEditorialTags,
  getCategorySessionTags,
  getCategoryTabs,
} from "../data/category-tabs.ts";

test("reads only category-specific editorial labels for tagged categories", () => {
  const session = {
    themeTag: [
      "__category_theme_meditaciones__:Visualizaciones nuevas",
      "__category_theme_sonoterapia__:Cuencos",
      "__supercategory_theme_descanso__:Opción A",
    ],
  } as never;

  assert.deepEqual(
    getCategoryEditorialTags(session, "meditaciones-guiadas"),
    ["Visualizaciones nuevas"],
  );
  assert.deepEqual(
    getCategoryEditorialTags(session, "sonidos-ancestrales"),
    ["Cuencos"],
  );
});

test("category editorial tabs use labels actually assigned to visible sessions", () => {
  const sessions = [
    { themeTag: ["__category_theme_meditaciones__:Mantras"] },
    { themeTag: ["__category_theme_meditaciones__:Mantras"] },
    { themeTag: ["__category_theme_sonoterapia__:Gongs"] },
  ] as never[];

  const labels = [
    ...new Set(
      sessions.flatMap((session) =>
        getCategoryEditorialTags(session, "meditaciones-guiadas"),
      ),
    ),
  ];
  assert.deepEqual(labels, ["Mantras"]);
});

test("legacy category tags remain separate from editorial screen tags", () => {
  const session = {
    meditationTag: "Visualizaciones",
    themeTag: ["__category_theme_meditaciones__:Respiración"],
  } as never;

  assert.deepEqual(getCategorySessionTags(session, "meditaciones-guiadas"), ["Visualizaciones"]);
  assert.deepEqual(getCategoryEditorialTags(session, "meditaciones-guiadas"), ["Respiración"]);
});

test("keeps legacy route semantics when a label collides with an editorial label", () => {
  const sessions = [
    {
      categoryId: "meditaciones-guiadas",
      meditationTag: "Respiración",
      themeTag: ["__category_theme_meditaciones__:Respiración"],
    },
    {
      categoryId: "meditaciones-guiadas",
      themeTag: ["__category_theme_meditaciones__:Respiración"],
    },
  ] as never[];

  assert.equal(
    getCategoryTagRouteNamespace(sessions, "meditaciones-guiadas", "Respiración"),
    "legacy",
  );

  const editorialOnly = sessions.slice(1);
  assert.equal(
    getCategoryTagRouteNamespace(editorialOnly, "meditaciones-guiadas", "Respiración"),
    "legacy",
  );
  assert.equal(
    getCategoryTagRouteNamespace(
      editorialOnly,
      "meditaciones-guiadas",
      "Respiración",
      "editorial",
    ),
    "editorial",
  );
});

test("keeps more than five untagged sessions in the all-category set", () => {
  const sessions = [
    { themeTag: ["__category_theme_meditaciones__:Mantras"] },
    ...Array.from({ length: 6 }, () => ({ themeTag: [] })),
  ] as never[];
  const editorialIds = new Set(
    sessions
      .flatMap((session, index) =>
        getCategoryEditorialTags(session, "meditaciones-guiadas").length ? [index] : [],
      ),
  );

  assert.equal(editorialIds.has(0), true);
  assert.equal(editorialIds.has(1), false);
  assert.equal(sessions.length, 7);
});

test("main category landing tabs come from legacy subcategory fields", () => {
  const cases = [
    ["musica-sonidos", { soundTag: "Ambient" }],
    ["meditaciones-guiadas", { meditationTag: "Respirar" }],
    ["ambientales", { sonidosTag: "Lluvia" }],
    ["charlas", { podcastTag: "Ciencia" }],
    ["sonidos-ancestrales", { ancestralTag: "Cuencos" }],
    ["historias", { sabiduriaTag: "Mitos" }],
  ] as const;
  for (const [categoryId, session] of cases) {
    const tabs = getCategoryTabs(
      [{
        ...session,
        themeTag: [`__category_theme_${categoryId}__:Editorial only`],
      }] as never[],
      categoryId,
    );
    assert.deepEqual(tabs, Object.values(session));
  }
});