import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import {
  drawerOffset,
  dragProgress,
  drawerSpringConfig,
  foregroundCornerRadius,
  foregroundShadowOpacity,
  foregroundVeilOpacity,
  foregroundTranslateX,
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
    const values = {
      v0: animation.velocity,
      x0: animation.current - target,
      omega0: animation.omega0,
      t: 1 / hz,
    };
    const raw = animation.zeta < 1
      ? engine.utils.underDampedSpringCalculations(animation, { ...values, zeta: animation.zeta, omega1: animation.omega1 })
      : engine.utils.criticallyDampedSpringCalculations(animation, values);
    const finished = animation.onFrame(animation, 1 + frame * 1000 / hz);
    positions.push(animation.current);
    if (finished) return { positions, rawTerminal: raw.position, elapsed: frame * 1000 / hz };
  }
  assert.fail("spring must finish");
}

test("installed spring reproduces the old closing position and radius snap", () => {
  const old = trace({ ...drawerSpringConfig(0, 390, 0), energyThreshold: 0.00001 });
  assert.ok(old.rawTerminal * drawerOffset(390) > 0.7);
  assert.ok(foregroundCornerRadius(old.rawTerminal) > 1.8);
  assert.equal(old.positions.at(-1), 0);
});

test("closing retains its critically damped trajectory and precise terminal tail", () => {
  const original = { ...drawerSpringConfig(0, 390, 0), energyThreshold: 0.00001 };
  const closing = drawerSpringConfig(0, 390, 0);
  assert.equal(closing.damping, 50);
  assert.equal(closing.overshootClamping, true);
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

test("programmatic and gesture settle use the destination and current progress", () => {
  const source = readFileSync(new URL("../context/DrawerContext.tsx", import.meta.url), "utf8");
  assert.match(source, /drawerSpringConfig\(0, drawerWidth\.value, destination, drawerProgress\.value\)/);
  assert.match(source, /drawerSpringConfig\(velocityX, drawerWidth\.value, target, drawerProgress\.value\)/);
});

test("real-engine opening rebounds a few pixels then settles at the 75px strip", () => {
  for (const hz of [60, 90, 120]) {
    for (const width of [320, 390, 430, 768, 1024]) {
      for (const [start, velocity] of [[0, 0], [0.2, 200], [0.5, 1600], [0.98, 5000]]) {
        const result = trace(drawerSpringConfig(velocity, width, 1, start), start, 1, hz);
        const positions = result.positions.map(p => foregroundTranslateX(p, width));
        const destination = drawerOffset(width);
        assert.ok(Math.max(...positions) > destination, "rebound is actually visible");
        assert.ok(Math.max(...positions) <= destination + 10, "fast gestures cannot push Inicio offscreen");
        assert.equal(positions.at(-1), destination);
        assert.equal(width - positions.at(-1)!, 75);
        assert.ok(result.elapsed < 1000);
        for (const p of result.positions) {
          assert.ok(foregroundVeilOpacity(p) >= 0 && foregroundVeilOpacity(p) <= 0.13);
          assert.ok(foregroundShadowOpacity(p) >= 0 && foregroundShadowOpacity(p) <= 0.24);
        }
      }
    }
  }
});

test("interrupting a rebound preserves position, finger tracking and release velocity", () => {
  for (const width of [320, 390, 768]) {
    for (const extra of [0.5, 4, 8]) {
      const start = 1 + extra / drawerOffset(width);
      const startX = foregroundTranslateX(start, width);
      for (const dx of [0, -0.1, -1, -5, -20]) {
        const progress = dragProgress(start, dx, width);
        assert.ok(Math.abs(foregroundTranslateX(progress, width) - (startX + dx)) < 1e-9);
      }
      const eps = 1e-7;
      const derivative = (foregroundTranslateX(start + eps, width) - foregroundTranslateX(start - eps, width)) / (2 * eps);
      for (const target of [0, 1] as const) {
        const config = drawerSpringConfig(-600, width, target, start);
        assert.ok(Math.abs(config.velocity * derivative + 600) < 0.001);
      }
    }
  }
});
