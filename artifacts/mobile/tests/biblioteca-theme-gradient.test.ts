import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import ts from "typescript";

const readSource = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

function findNode<T extends ts.Node>(
  root: ts.Node,
  predicate: (node: ts.Node) => node is T,
): T | undefined {
  if (predicate(root)) return root;
  let match: T | undefined;
  ts.forEachChild(root, (child) => {
    if (!match) match = findNode(child, predicate);
  });
  return match;
}

function containsNode(root: ts.Node, predicate: (node: ts.Node) => boolean): boolean {
  if (predicate(root)) return true;
  let found = false;
  ts.forEachChild(root, (child) => {
    if (!found) found = containsNode(child, predicate);
  });
  return found;
}

function evaluateTsExpression(
  expression: string,
  parameters: string[],
  values: unknown[],
): unknown {
  const compiled = ts.transpileModule(
    `function renderExtracted(${parameters.join(", ")}) { return ${expression}; }`,
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.None,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText;
  const createRenderer = new Function("React", `${compiled}; return renderExtracted;`);
  return (createRenderer(React) as (...args: unknown[]) => unknown)(...values);
}

const profileSource = readSource("../components/ProfileScreenBase.tsx");
const profileAst = ts.createSourceFile(
  "ProfileScreenBase.tsx",
  profileSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const libraryBackgroundBranch = findNode(
  profileAst,
  (node): node is ts.ConditionalExpression =>
    ts.isConditionalExpression(node)
    && node.condition.getText(profileAst) === "asTab"
    && containsNode(
      node.whenTrue,
      (child) => ts.isJsxSelfClosingElement(child)
        && child.tagName.getText(profileAst) === "LinearGradient",
    ),
);
assert.ok(libraryBackgroundBranch, "ProfileScreenBase should own the asTab Biblioteca root gradient");
const libraryRootGradient = findNode(
  libraryBackgroundBranch.whenTrue,
  (node): node is ts.JsxSelfClosingElement =>
    ts.isJsxSelfClosingElement(node) && node.tagName.getText(profileAst) === "LinearGradient",
);
assert.ok(libraryRootGradient);

const theme = {
  gradient: ["#1D2C58", "#1D2557", "#1E2257", "#231E56", "#231D58", "#2C1D58", "#2F1E5F"],
  gradientLocations: [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1],
  gradientStart: { x: 0.5, y: 0 },
  gradientEnd: { x: 0.5, y: 1 },
};

test("Biblioteca's actual asTab root gradient renders every active-theme stop and position", () => {
  const Gradient = () => null;
  const StyleSheet = { absoluteFill: { position: "absolute", inset: 0 } };
  const element = evaluateTsExpression(
    libraryRootGradient.getText(profileAst),
    ["LinearGradient", "StyleSheet", "activeTheme"],
    [Gradient, StyleSheet, theme],
  ) as React.ReactElement<Record<string, unknown>>;

  assert.equal(element.type, Gradient);
  assert.deepEqual(element.props.colors, theme.gradient);
  assert.deepEqual(element.props.locations, theme.gradientLocations);
  assert.deepEqual(element.props.start, theme.gradientStart);
  assert.deepEqual(element.props.end, theme.gradientEnd);
  assert.equal(element.props.pointerEvents, "none");
  assert.match(
    libraryBackgroundBranch.whenFalse.getText(profileAst),
    /SacredBackground variant="gradient" noImage ambientGlowMode="none"/,
    "the normal Perfil background branch remains unchanged",
  );
});

test("standalone Biblioteca and BibliotecaOverlay both use the library-scoped asTab root", () => {
  const standaloneRoute = readSource("../app/(tabs)/biblioteca.tsx");
  const overlay = readSource("../components/BibliotecaOverlay.tsx");

  assert.match(standaloneRoute, /<ProfileScreenBase asTab \/>/);
  assert.match(
    overlay,
    /<ProfileScreenBase asTab onBack=\{closeLib\} initialLibraryTab=\{libraryInitialTab\} \/>/,
  );
});

test("direct BibliotecaScreen standalone wrapper uses the complete active theme", () => {
  const source = readSource("../components/BibliotecaScreen.tsx");
  const ast = ts.createSourceFile(
    "BibliotecaScreen.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const wrapperProps = findNode(
    ast,
    (node): node is ts.VariableDeclaration =>
      ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text === "wrapperProps",
  );
  assert.ok(wrapperProps?.initializer && ts.isConditionalExpression(wrapperProps.initializer));
  const wrapperRoot = findNode(
    ast,
    (node): node is ts.JsxElement =>
      ts.isJsxElement(node) && node.openingElement.tagName.getText(ast) === "Wrapper",
  );
  assert.ok(wrapperRoot);
  assert.ok(
    wrapperRoot.openingElement.attributes.properties.some(
      (attribute) => ts.isJsxSpreadAttribute(attribute)
        && /wrapperProps/.test(attribute.expression.getText(ast)),
    ),
    "the tested wrapper props must be applied to BibliotecaScreen's root",
  );

  const props = evaluateTsExpression(
    wrapperProps.initializer.getText(ast),
    ["embedded", "sceneTheme", "styles"],
    [false, theme, { root: { flex: 1 } }],
  ) as Record<string, unknown>;
  assert.deepEqual(props.colors, theme.gradient);
  assert.deepEqual(props.locations, theme.gradientLocations);
  assert.deepEqual(props.start, theme.gradientStart);
  assert.deepEqual(props.end, theme.gradientEnd);

  const embeddedProps = evaluateTsExpression(
    wrapperProps.initializer.getText(ast),
    ["embedded", "sceneTheme", "styles"],
    [true, theme, { root: { flex: 1 } }],
  ) as Record<string, unknown>;
  assert.deepEqual(embeddedProps, { style: { flex: 1 } });
});