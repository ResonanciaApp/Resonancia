import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("../components/InnerSpaceCard.tsx", import.meta.url), "utf8");
const transition = source.split("sectionBorderOpacity.value = reduceMotion")[1].split(";\n")[0];

test("El borde aparece al 25% al expandir y desaparece al colapsar, sin distinguir temas", () => {
  const opacity = { value: 0 };
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
  assert.equal(opacity.value, 0.25);
  update(opacity, false, false, timing, 620, easing);
  assert.equal(opacity.value, 0);
  assert.deepEqual(calls.map(call => call.target), [0.25, 0]);
  assert.ok(calls.every(call => call.config.duration === 620));
  assert.doesNotMatch(transition, /theme|profileVariant|canonicalVerticalInsets/);
  assert.match(source, /useSharedValue\(0\);\s+const sectionBorderStyle/);
});

test("Movimiento reducido aplica el borde sin animación, y la capa no captura toques", () => {
  const opacity = { value: 0 };
  const update = new Function(
    "sectionBorderOpacity", "reduceMotion", "opening", "withTiming", "PANEL_DURATION", "ReanimatedEasing",
    `sectionBorderOpacity.value = reduceMotion${transition};`,
  );
  const timing = () => { throw new Error("No debe animar"); };
  update(opacity, true, true, timing, 620, {});
  assert.equal(opacity.value, 0.25);
  update(opacity, true, false, timing, 620, {});
  assert.equal(opacity.value, 0);
  assert.match(source, /testID="reflection-section-border"\s+pointerEvents="none"\s+style=\{\[StyleSheet.absoluteFill, sectionBorderStyle\]\}/);
  assert.match(source, /sectionBackgroundColor[\s\S]*?\{ borderColor: "transparent" \}/);
});
