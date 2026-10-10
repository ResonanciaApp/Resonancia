import assert from "node:assert/strict";
import test from "node:test";
import { GROWTH_WORLD_TEMPLATES, normalizeGrowthWorlds, visibleGrowthWorlds } from "../utils/growthWorlds.ts";

test("la compatibilidad adopta dos mundos sin resucitar un catálogo explícitamente vacío", () => {
  const legacy = normalizeGrowthWorlds({ stages: [{ group: "florecimiento", imageUrl: "/objects/cover" }] as never });
  assert.equal(legacy.length, 2);
  assert.equal(legacy[0].coverUrl, "/objects/cover");
  assert.deepEqual(normalizeGrowthWorlds({ worlds: [], stages: [] }), []);
  const edited = [{ ...GROWTH_WORLD_TEMPLATES[0], name: "Mi mundo", coverUrl: "/objects/new" }];
  assert.equal(normalizeGrowthWorlds({ worlds: edited, stages: [] }), edited);
});

test("solo muestra alcanzados, actual y el próximo mundo con fases configuradas", () => {
  const stages = GROWTH_WORLD_TEMPLATES.map((w, index) => ({ group: w.id, startDay: index * 50 }));
  const check = (days: number, ids: string[], upcoming: string[]) => {
    const visible = visibleGrowthWorlds(GROWTH_WORLD_TEMPLATES, stages, days);
    assert.deepEqual(visible.map(v => v.world.id), ids);
    assert.deepEqual(visible.filter(v => v.upcoming).map(v => v.world.id), upcoming);
  };
  check(16, ["florecimiento", "ascenso"], ["ascenso"]);
  check(50, ["florecimiento", "ascenso", "iluminacion"], ["iluminacion"]);
  check(100, ["florecimiento", "ascenso", "iluminacion", "llegada"], ["llegada"]);
  check(200, GROWTH_WORLD_TEMPLATES.map(w => w.id), []);
  assert.deepEqual(visibleGrowthWorlds(GROWTH_WORLD_TEMPLATES, [], 200), []);
  assert.deepEqual(visibleGrowthWorlds(GROWTH_WORLD_TEMPLATES, stages.slice(0, 1), 200).map(v => v.world.id), ["florecimiento"]);
});

test("omitir un mundo vacío conserva su posición editorial y usa días oficiales, no premios históricos", () => {
  const stages = [{ group: "florecimiento", startDay: 0 }, { group: "iluminacion", startDay: 113 }, { group: "despertar", startDay: 200 }];
  const visible = visibleGrowthWorlds(GROWTH_WORLD_TEMPLATES, stages, 16);
  assert.deepEqual(visible.map(v => [v.world.id, v.index, v.upcoming]), [["florecimiento", 0, false], ["iluminacion", 2, true]]);
});
