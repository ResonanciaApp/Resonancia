import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import {
  REFLECTION_GALLERY_HEIGHT,
  REFLECTION_GALLERY_EXPANSION,
  reflectionPreviewLayout,
  fitReflectionPreviewWidth,
} from "../lib/reflection-gallery-layout.ts";
import { SHEET_EXPAND_MS } from "../lib/ambiental-duration-transition.ts";
import { clampReflectionStoryComposition } from "../lib/reflection-story-logic.ts";
import { reflectionGalleryScrollIndicator } from "../lib/reflection-gallery-layout.ts";

test("gallery scrollbar follows progress, clamps bounce and updates when the grid expands", () => {
  const top = reflectionGalleryScrollIndicator(100, 1000, 0);
  assert.equal(top.height, 18);
  assert.equal(top.translateY, 0);
  assert.equal(top.visible, true);
  const middle = reflectionGalleryScrollIndicator(100, 1000, 450);
  assert.equal(middle.progress, 0.5);
  assert.equal(middle.translateY, 41);
  const bottom = reflectionGalleryScrollIndicator(100, 1000, 900);
  assert.equal(bottom.translateY + bottom.height, 100);
  assert.equal(reflectionGalleryScrollIndicator(100, 1000, -20).progress, 0);
  assert.equal(reflectionGalleryScrollIndicator(100, 1000, 1000).progress, 1);
  const expanded = reflectionGalleryScrollIndicator(200, 1000, 800);
  assert.equal(expanded.height, 40);
  assert.equal(expanded.translateY + expanded.height, 200);
  assert.equal(reflectionGalleryScrollIndicator(200, 100, 0).visible, false);
  assert.equal(reflectionGalleryScrollIndicator(0, 0, 0).visible, false);
});

const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-8);
const source = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("grilla y hero intercambian exactamente 120 px manteniendo footer y proporción", () => {
  const baseWidth = 235.8;
  const baseline = reflectionPreviewLayout(baseWidth, 0);
  const footerY = 700;
  const heroTop = footerY - REFLECTION_GALLERY_HEIGHT - 20 - baseline.height;
  for (let frame = 0; frame <= 30; frame++) {
    const delta = REFLECTION_GALLERY_EXPANSION * frame / 30;
    const galleryHeight = REFLECTION_GALLERY_HEIGHT + delta;
    const preview = reflectionPreviewLayout(baseWidth, delta);
    close(preview.height, baseline.height - delta);
    close(preview.width / preview.height, 9 / 16);
    close(preview.scale, preview.width / baseWidth);
    close(footerY - galleryHeight - (heroTop + preview.height), 20);
  }
  assert.equal(REFLECTION_GALLERY_HEIGHT + REFLECTION_GALLERY_EXPANSION, 300);
  assert.deepEqual(reflectionPreviewLayout(baseWidth, 0), baseline);
});

test("el hero se ajusta a teléfonos pequeños y tablets sin alterar otros modales", () => {
  assert.equal(fitReflectionPreviewWidth(235.8, null), 235.8);
  for (const available of [180, 240, 450, 700]) {
    const width = fitReflectionPreviewWidth(400, available);
    const compact = reflectionPreviewLayout(width, 0);
    const expanded = reflectionPreviewLayout(width, 120);
    assert.ok(compact.height <= available - 24 + 1e-8);
    assert.ok(expanded.height > 0);
    close(compact.height - expanded.height, 120);
  }
});

test("el escalado visual no modifica la receta ni la composición exportada", () => {
  const recipe = { backgroundScale: 2, backgroundX: 0.12, backgroundY: -0.15, textX: 0.02, textY: -0.03 };
  const exported = clampReflectionStoryComposition(recipe);
  for (const delta of [0, 20, 60, 120, 40, 0]) {
    const viewport = reflectionPreviewLayout(230, delta);
    assert.deepEqual(clampReflectionStoryComposition(recipe), exported);
    // Pan events arrive in screen points; normalize by the actually displayed dimensions.
    close((10 / viewport.width) * viewport.width, 10);
    close((16 / viewport.height) * viewport.height, 16);
  }
});

function mountExpansion() {
  let expanded = false;
  let listener: ((enabled: boolean) => void) | undefined;
  let cleanup: (() => void) | undefined;
  let removed = false;
  let cancelled = 0;
  let resolvePreference!: (value: boolean) => void;
  const progress = { value: 0 };
  const timings: { from: number; to: number; duration: number; reduceMotion: string; easing: (x: number) => number }[] = [];
  const module = { exports: {} as { useReflectionGalleryExpansion: () => { expanded: boolean; toggle: () => void; heightReduction: typeof progress } } };
  const compiled = ts.transpileModule(source("../hooks/useReflectionGalleryExpansion.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(compiled, {
    exports: module.exports,
    console,
    require: (id: string) => {
      if (id === "react") return {
        useState: () => [expanded, (value: boolean) => { expanded = value; }],
        useRef: (value: unknown) => ({ current: value }),
        useCallback: (fn: unknown) => fn,
        useEffect: (fn: () => () => void) => { cleanup = fn(); },
      };
      if (id === "react-native") return { AccessibilityInfo: {
        isReduceMotionEnabled: () => new Promise<boolean>(resolve => { resolvePreference = resolve; }),
        addEventListener: (_: string, fn: typeof listener) => {
          listener = fn;
          return { remove: () => { removed = true; } };
        },
      } };
      if (id === "react-native-reanimated") return {
        useSharedValue: () => progress,
        cancelAnimation: () => { cancelled++; },
        ReduceMotion: { Always: "always", System: "system" },
        Easing: {
          quad: (x: number) => x * x,
          inOut: (fn: (x: number) => number) => (x: number) => x < 0.5 ? fn(x * 2) / 2 : 1 - fn((1 - x) * 2) / 2,
        },
        withTiming: (to: number, config: Omit<typeof timings[number], "from" | "to">) => {
          timings.push({ from: progress.value, to, ...config });
          return to;
        },
      };
      if (id === "@/lib/ambiental-duration-transition") return { SHEET_EXPAND_MS };
      if (id === "@/lib/reflection-gallery-layout") return { REFLECTION_GALLERY_EXPANSION };
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  const hook = module.exports.useReflectionGalleryExpansion();
  return {
    hook, progress, timings,
    get expanded() { return expanded; },
    get removed() { return removed; },
    get cancelled() { return cancelled; },
    preference: (enabled: boolean) => resolvePreference(enabled),
    changePreference: (enabled: boolean) => listener!(enabled),
    unmount: () => cleanup!(),
  };
}

test("el botón alterna y revierte desde el progreso actual usando la curva Ambiental", () => {
  const instance = mountExpansion();
  assert.equal(instance.expanded, false);
  instance.hook.toggle();
  assert.equal(instance.expanded, true);
  assert.equal(instance.timings[0].to, 120);
  assert.equal(instance.timings[0].duration, SHEET_EXPAND_MS);
  close(instance.timings[0].easing(0.25), 0.125);
  close(instance.timings[0].easing(0.75), 0.875);
  instance.progress.value = 37;
  instance.hook.toggle();
  assert.equal(instance.expanded, false);
  assert.equal(instance.timings[1].from, 37);
  assert.equal(instance.timings[1].to, 0);
  instance.progress.value = 19;
  instance.hook.toggle();
  assert.equal(instance.timings[2].from, 19);
  assert.equal(instance.timings[2].to, 120);
  instance.unmount();
});

test("Reducir movimiento completa la transición y una lectura vieja no pisa la preferencia", async () => {
  const instance = mountExpansion();
  instance.hook.toggle();
  instance.progress.value = 32;
  instance.changePreference(true);
  assert.equal(instance.progress.value, 120);
  instance.preference(false);
  await Promise.resolve();
  instance.hook.toggle();
  assert.equal(instance.timings[1].reduceMotion, "always");
  assert.equal(instance.progress.value, 0);
  instance.changePreference(false);
  instance.hook.toggle();
  assert.equal(instance.timings[2].reduceMotion, "system");
  instance.unmount();
});

test("cerrar cancela el trabajo y reabrir comienza contraído", async () => {
  const instance = mountExpansion();
  instance.hook.toggle();
  instance.progress.value = 40;
  instance.unmount();
  const cancellations = instance.cancelled;
  instance.preference(true);
  await Promise.resolve();
  assert.equal(instance.cancelled, cancellations);
  assert.equal(instance.removed, true);
  const reopened = mountExpansion();
  assert.equal(reopened.progress.value, 0);
  assert.equal(reopened.expanded, false);
  reopened.unmount();
});

test("solo este compositor activa el tamaño animado; captura y catálogo permanecen independientes", () => {
  const share = source("../components/ReflectionShare.tsx");
  const modal = source("../components/StoryShareModal.tsx");
  assert.match(share, /onPress=\{toggle\}/);
  assert.match(share, /accessibilityState=\{\{ expanded \}\}/);
  assert.match(share, /previewHeightReduction=\{heightReduction\}/);
  assert.match(share, /height: REFLECTION_GALLERY_HEIGHT \+ heightReduction.value/);
  assert.match(share, /displayScale=\{previewContext\?\.displayScale\}/);
  assert.match(share, /<Animated\.ScrollView[\s\S]*?contentContainerStyle=\{styles.galleryContent\}/);
  assert.match(share, /onScroll=\{galleryScrollHandler\}/);
  assert.match(share, /scrollEventThrottle=\{16\}/);
  assert.match(share, /pointerEvents="none" accessible=\{false\}[\s\S]*?testID="reflection-gallery-scroll-track"/);
  assert.match(share, /catalog.map\(\(item\)/);
  assert.match(modal, /renderArtwork\(STORY_WIDTH, true/);
  assert.match(modal, /width: STORY_WIDTH,\s*height: STORY_HEIGHT/);
  assert.match(modal, /: renderArtwork\(previewWidth, false, previewCallbacks\)/);
  assert.doesNotMatch(share, /key=\{expanded|setComposition\(.*expanded/);
});

test("el control está fuera de la grilla y solo este flujo usa los nuevos fondos y tipografía", () => {
  const share = source("../components/ReflectionShare.tsx");
  const modal = source("../components/StoryShareModal.tsx");
  const ast = ts.createSourceFile("ReflectionShare.tsx", share, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let found = false;
  const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node) && node.openingElement.attributes.getText(ast).includes("styles.gallerySection")) {
      const elements = node.children.filter(ts.isJsxElement);
      assert.equal(elements.length, 2);
      assert.match(elements[0].openingElement.attributes.getText(ast), /styles.galleryControls/);
      assert.match(elements[1].openingElement.attributes.getText(ast), /styles.galleryContainer/);
      assert.match(elements[0].getText(ast), /onPress=\{toggle\}/);
      assert.doesNotMatch(elements[1].getText(ast), /onPress=\{toggle\}/);
      found = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  assert.ok(found);
  assert.match(share, /closeButtonBackgroundColor="rgba\(255,255,255,0\.1\)"/);
  assert.match(share, /galleryToggle: \{[^}]*backgroundColor: "rgba\(255,255,255,0\.1\)"/);
  assert.match(share, /instagramActionText: \{[^}]*fontSize: 13,[^}]*fontFamily: "Manrope650"/);
  assert.match(modal, /lightActionButtons && styles.actionTextSoftDark,\s*instagramActionTextStyle/);
  assert.match(source("../app/_layout.tsx"), /Manrope650: require\("\.\.\/assets\/fonts\/Manrope650\.ttf"\)/);
});

test("el contenedor del chevron no desplaza ni reduce el hero y conserva sus límites táctiles", () => {
  const share = source("../components/ReflectionShare.tsx");
  const ast = ts.createSourceFile("ReflectionShare.tsx", share, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const styles: Record<string, Record<string, number | string>> = {};
  const visit = (node: ts.Node) => {
    if (ts.isPropertyAssignment(node) && ["gallerySection", "galleryControls", "galleryContainer"].includes(node.name.getText(ast))) {
      styles[node.name.getText(ast)] = runInNewContext(`(${node.initializer.getText(ast)})`, { REFLECTION_GALLERY_HEIGHT });
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  const { gallerySection: section, galleryControls: controls, galleryContainer: gallery } = styles;
  assert.equal(controls.position, "absolute");
  assert.equal(controls.top, 0);
  assert.ok(Number(section.paddingTop) >= Number(controls.height));
  assert.equal(Number(section.paddingTop) + Number(section.marginTop), 0);
  for (const delta of [0, 30, 60, 120]) {
    const originalOccupiedHeight = REFLECTION_GALLERY_HEIGHT + delta + 20;
    const occupiedHeight = Number(section.paddingTop) + Number(section.marginTop)
      + Number(gallery.height) + delta + Number(section.marginBottom);
    assert.equal(occupiedHeight, originalOccupiedHeight);
    for (const availableHeight of [450, 600, 750]) {
      const originalArea = availableHeight - originalOccupiedHeight;
      const currentArea = availableHeight - occupiedHeight;
      const originalPreview = reflectionPreviewLayout(fitReflectionPreviewWidth(235.8, originalArea + delta), delta);
      const currentPreview = reflectionPreviewLayout(fitReflectionPreviewWidth(235.8, currentArea + delta), delta);
      assert.deepEqual(currentPreview, originalPreview);
      close((currentArea - currentPreview.height) / 2, (originalArea - originalPreview.height) / 2);
    }
  }
  assert.match(share, /style=\{styles\.gallerySection\} pointerEvents="box-none"/);
  assert.match(share, /style=\{styles\.galleryControls\} pointerEvents="box-none"/);
  assert.match(share, /previewOffsetY=\{-20\}/);
});
