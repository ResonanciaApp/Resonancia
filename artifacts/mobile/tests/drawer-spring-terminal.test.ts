import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import {
  drawerOffset,
  drawerSpringConfig,
  foregroundCornerRadius,
  foregroundShadowOpacity,
  foregroundVeilOpacity,
} from "../lib/drawerGeometry.ts";

/** Execute the installed Reanimated spring's real onStart/onFrame/termination,
 * rather than a mocked spring that instantly assigns the target.
 * Only UI scheduling/decoration and logging are stubbed; scalar physics is real.
 * This is not a native renderer or an FPS/perceptual measurement. */
function nativeSpringEngine() {
  const cache = new Map<string, any>();
  function load(name: string): any {
    if (cache.has(name)) return cache.get(name);
    const module = { exports: {} as any };
    cache.set(name, module.exports);
    const source = readFileSync(new URL(
      `../node_modules/react-native-reanimated/src/animation/spring/${name}.ts`,
      import.meta.url,
    ), "utf8");
    const code = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    runInNewContext(code, {
      module, exports: module.exports,
      require(id: string) {
        if (id === "../util") return {
          defineAnimation: (_target: number, factory: () => any) => factory(),
          getReduceMotionForAnimation: () => false,
        };
        if (id === "../../common") return { logger: { warn: (message: string) => assert.fail(message) } };
        return load(id.replace("./", ""));
      },
    });
    return module.exports;
  }
  return { spring: load("spring"), utils: load("springUtils") };
}

const engine = nativeSpringEngine();
function trace(config: ReturnType<typeof drawerSpringConfig>, start = 1, target = 0, hz = 60) {
  const animation = engine.spring.withSpring(target, config);
  animation.onStart(animation, start, 1);
  const positions = [start];
  for (let frame = 1; frame <= hz * 3; frame++) {
    const raw = engine.utils.criticallyDampedSpringCalculations(animation, {
      v0: animation.velocity,
      x0: animation.current - target,
      omega0: animation.omega0,
      t: 1 / hz,
    });
    const finished = animation.onFrame(animation, 1 + frame * 1000 / hz);
    positions.push(animation.current);
    if (finished) return { positions, rawTerminal: raw.position, elapsed: frame * 1000 / hz };
  }
  assert.fail("spring must finish");
}

test("installed spring reproduces the old closing position and radius snap", () => {
  const old = trace(drawerSpringConfig(0, 390, 1));
  assert.ok(old.rawTerminal * drawerOffset(390) > 0.7);
  assert.ok(foregroundCornerRadius(old.rawTerminal) > 1.8);
  assert.equal(old.positions.at(-1), 0);
});

test("closing precision changes only the terminal tail, never the opening or main trajectory", () => {
  const original = drawerSpringConfig(0, 390);
  const closing = drawerSpringConfig(0, 390, 0);
  const opening = drawerSpringConfig(0, 390, 1);
  assert.deepEqual(opening, original);
  assert.deepEqual({ ...closing, energyThreshold: original.energyThreshold }, original);
  const before = trace(original);
  const after = trace(closing);
  assert.deepEqual(after.positions.slice(0, before.positions.length - 1), before.positions.slice(0, -1));
  assert.ok(after.rawTerminal * drawerOffset(390) < 0.02);
  assert.ok(foregroundCornerRadius(after.rawTerminal) < 0.05);
});

test("consecutive real-engine closes reach exact zero monotonically at 60/90/120 Hz", () => {
  let closes = 0;
  for (const hz of [60, 90, 120]) {
    for (const width of [320, 390, 430, 768, 1024]) {
      for (const start of [0.05, 0.25, 0.5, 1]) {
        for (const velocityX of [0, -50, -500, -1600]) {
          const config = drawerSpringConfig(velocityX, width, 0);
          const result = trace(config, start, 0, hz);
          for (let frame = 1; frame < result.positions.length; frame++) {
            assert.ok(result.positions[frame] >= 0);
            assert.ok(result.positions[frame] <= result.positions[frame - 1]);
          }
          assert.equal(result.positions.at(-1), 0);
          // A genuine crossing with release momentum is intentional clamping,
          // not an energy-threshold snap; assess the latter only.
          if (result.rawTerminal >= 0) {
            assert.ok(result.rawTerminal * drawerOffset(width) < 0.08);
            assert.ok(foregroundCornerRadius(result.rawTerminal) < 0.065);
          }
          assert.equal(foregroundCornerRadius(0), 0);
          assert.equal(foregroundShadowOpacity(0), 0);
          assert.equal(foregroundVeilOpacity(0), 0);
          closes++;
        }
      }
    }
  }
  assert.equal(closes, 240);
});

test("programmatic and gesture settle select precision using their destination", () => {
  const source = readFileSync(new URL("../context/DrawerContext.tsx", import.meta.url), "utf8");
  assert.match(source, /drawerSpringConfig\(0, drawerWidth\.value, destination\)/);
  assert.match(source, /drawerSpringConfig\(velocityX, drawerWidth\.value, target\)/);
});
