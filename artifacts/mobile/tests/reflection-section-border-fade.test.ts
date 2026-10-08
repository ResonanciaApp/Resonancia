import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("../components/InnerSpaceCard.tsx", import.meta.url), "utf8");
const transition = source.split("sectionBorderOpacity.value = reduceMotion")[1].split(";\n")[0];

test("El borde pasa de 85% cerrado a 33% abierto y vuelve al cerrar, en todos los temas", () => {
  const opacity = { value: 0.85 };
  const calls: any[] = [];
  const update = new Function(
    "sectionBorderOpacity", "reduceMotion", "opening", "withTiming", "PANEL_DURATION", "ReanimatedEasing",
    `sectionBorderOpacity.value = reduceMotion${transition};`,
  );
  const timing = (target: number, config: any) => {
    calls.push({ target, config });
    return target;
  };
  const easing = { quad: "quad", inOut: (value: any) => value };
  update(opacity, false, true, timing, 620, easing);
  assert.equal(opacity.value, 0.33);
  update(opacity, false, false, timing, 620, easing);
  assert.equal(opacity.value, 0.85);
  assert.deepEqual(calls.map(call => call.target), [0.33, 0.85]);
  assert.ok(calls.every(call => call.config.duration === 620));
  assert.doesNotMatch(transition, /theme|profileVariant|canonicalVerticalInsets/);
  assert.match(source, /useSharedValue\(0\.85\);\s+const sectionBorderStyle/);
});

test("Movimiento reducido aplica el borde sin animación, y la capa no captura toques", () => {
  const opacity = { value: 0.85 };
  const update = new Function(
    "sectionBorderOpacity", "reduceMotion", "opening", "withTiming", "PANEL_DURATION", "ReanimatedEasing",
    `sectionBorderOpacity.value = reduceMotion${transition};`,
  );
  const timing = () => { throw new Error("No debe animar"); };
  update(opacity, true, true, timing, 620, {});
  assert.equal(opacity.value, 0.33);
  update(opacity, true, false, timing, 620, {});
  assert.equal(opacity.value, 0.85);
  assert.match(source, /testID="reflection-section-border"\s+pointerEvents="none"/);
  assert.match(source, /sectionBorderStyle,\s*\]\}/);
  assert.match(source, /sectionBackgroundColor[\s\S]*?\{ borderColor: "transparent" \}/);
});

test("El borde decorativo alcanza el contorno exterior sin modificar el layout", () => {
  const expression = source.match(/const sectionBorderInset = ([^\n;]+);/)?.[1];
  assert.ok(expression);
  const inset = new Function("canonicalVerticalInsets", "profileVariant", "theme", "getThemeStyleId", `return ${expression};`);
  for (const id of ["cloudy", "natural", "indigo2", "pleyades"]) {
    assert.equal(inset(true, true, { id }, (value: string) => value), -1);
    assert.equal(inset(false, false, { id }, (value: string) => value), -1);
    assert.equal(inset(true, false, { id }, (value: string) => value), id === "cloudy" ? 0 : -1);
  }
  for (const side of ["top", "right", "bottom", "left"]) {
    assert.match(source, new RegExp(`${side}: sectionBorderInset`));
  }
  assert.match(source, /borderRadius=\{profileVariant \? 16 : 24\}/);
  assert.match(source, /borderWidth=\{profileVariant \? 1 : 2\}/);
});
