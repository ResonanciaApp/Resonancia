import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const home = readFileSync(new URL("../app/(tabs)/inicio8.tsx", import.meta.url), "utf8");
const profile = readFileSync(new URL("../components/ProgressMirrorSections.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("inicio8.tsx", home, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declarations = ast.statements.filter(ts.isVariableStatement)
  .flatMap(statement => [...statement.declarationList.declarations]);
const header = declarations.find(declaration => declaration.name.getText(ast) === "Inicio2HeroStatic");
assert.ok(header?.initializer && ts.isCallExpression(header.initializer));
const headerFunction = header.initializer.arguments[0];
assert.ok(ts.isFunctionExpression(headerFunction));
const blinkNames = new Set(["weekBlink", "weekPressRunning", "handleWeekPress"]);
const blinkStatements = headerFunction.body.statements.filter(statement =>
  ts.isVariableStatement(statement)
    ? statement.declarationList.declarations.some(declaration => blinkNames.has(declaration.name.getText(ast)))
    : ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression)
      && statement.expression.expression.getText(ast) === "useEffect",
).map(statement => statement.getText(ast)).join("\n");
const homeFunction = ast.statements.find(statement =>
  ts.isFunctionDeclaration(statement) && statement.name?.text === "HomeScreen2",
);
assert.ok(homeFunction && ts.isFunctionDeclaration(homeFunction) && homeFunction.body);
const progressDeclaration = homeFunction.body.statements.filter(ts.isVariableStatement)
  .find(statement => statement.declarationList.declarations.some(declaration => declaration.name.getText(ast) === "handleOpenProgress"));
assert.ok(progressDeclaration);
const compile = (source: string) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function harness() {
  const pushed: string[] = [];
  const sequences: any[][] = [];
  let active: ((result: { finished: boolean }) => void) | undefined;
  let cleanup: () => void;
  class Value {
    constructor(public value: number) {}
    setValue(value: number) { this.value = value; }
    stopAnimation() {
      const callback = active;
      active = undefined;
      callback?.({ finished: false });
    }
  }
  const Animated = {
    Value,
    timing: (target: Value, config: unknown) => ({ target, config }),
    sequence: (animations: any[]) => ({
      start: (callback: typeof active) => { sequences.push(animations); active = callback; },
    }),
  };
  const open = new Function("useCallback", "router", `${compile(progressDeclaration.getText(ast))}\nreturn handleOpenProgress;`)(
    (callback: unknown) => callback, { push: (route: string) => pushed.push(route) },
  );
  const press = new Function("useRef", "useCallback", "useEffect", "Animated", "onOpenProfile",
    `${compile(blinkStatements)}\nreturn handleWeekPress;`)(
    (initial: unknown) => ({ current: initial }),
    (callback: unknown) => callback,
    (effect: () => () => void) => { cleanup = effect(); },
    Animated, open,
  );
  return {
    press, pushed, sequences,
    cleanup: () => cleanup(),
    finish(finished: boolean) {
      const callback = active;
      active = undefined;
      callback?.({ finished });
    },
  };
}

test("Home weekdays are one accessible progress link inside the existing parallax layer", () => {
  const headerSource = headerFunction.getText(ast);
  assert.match(headerSource, /slowHeaderStyle,[\s\S]*?testID="inicio3-streak-row"/);
  assert.match(headerSource, /testID="inicio3-streak-row"[\s\S]*?<Pressable\s+onPress=\{handleWeekPress\}/);
  assert.match(headerSource, /accessibilityLabel="Abrir Tu progreso semanal"/);
  assert.match(headerSource, /<Animated\.View style=\{\{ opacity: weekBlink \}\}>\s*<StreakWeekRow \/>/);
  const renderedHeader = home.match(/<Inicio2HeroStatic[\s\S]*?\/>/)?.[0];
  assert.ok(renderedHeader);
  assert.match(renderedHeader, /onOpenProfile=\{handleOpenProgress\}/);
});

test("all seven days blink exactly like Profile, then open the same route as Home lotus", () => {
  const h = harness();
  h.press();
  assert.deepEqual(h.pushed, []);
  const configs = h.sequences[0].map(animation => animation.config);
  assert.deepEqual(configs, [
    { toValue: 0.55, duration: 70, useNativeDriver: true },
    { toValue: 1, duration: 100, useNativeDriver: true },
  ]);
  assert.match(profile, /toValue: 0\.55,\s*duration: 70,\s*useNativeDriver: true/);
  assert.match(profile, /toValue: 1,\s*duration: 100,\s*useNativeDriver: true/);
  h.finish(true);
  assert.deepEqual(h.pushed, ["/progreso"]);
});

test("rapid taps open progress once; interrupted blinks do not navigate", () => {
  const h = harness();
  h.press();
  h.press();
  assert.equal(h.sequences.length, 1);
  h.finish(false);
  assert.deepEqual(h.pushed, []);
  h.press();
  h.finish(true);
  assert.deepEqual(h.pushed, ["/progreso"]);
});

test("leaving the header cancels a pending blink and navigation", () => {
  const h = harness();
  h.press();
  h.cleanup();
  h.finish(true);
  assert.deepEqual(h.pushed, []);
});
