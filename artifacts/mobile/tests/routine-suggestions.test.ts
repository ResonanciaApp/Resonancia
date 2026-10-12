import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../context/RutinaContext.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("routine.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function readConstant(name: string): any {
  let expression: ts.Expression | undefined;
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name) expression = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(expression);
  return new Function(ts.transpileModule(`return (${expression.getText(ast)});`, {}).outputText)();
}
const tabs = readConstant("ROUTINE_CATEGORY_TABS") as string[];
const groups = readConstant("SUGGESTION_GROUPS") as Record<string, string[]>;
const suggested = readConstant("SUGGESTED_CATEGORY_BY_TITLE") as Record<string, string>;

test("all screenshot categories are available in their original order", () => {
  assert.deepEqual(tabs, ["Sugerido", "Practicar", "Dormir", "Autocuidado", "Días difíciles",
    "Nutrición", "Gratitud", "Seres queridos", "Ejercicio", "Productividad"]);
  const expectedCounts = [7, 14, 13, 11, 10, 11, 11, 11, 11, 10];
  tabs.forEach((tab, index) => {
    assert.equal(groups[tab].length, expectedCounts[index], tab);
    assert.equal(new Set(groups[tab]).size, groups[tab].length, `${tab}: overlapping screenshots must not create duplicates`);
    assert.ok(groups[tab].every(title => title === title.trim() && title.length <= 80));
  });
});

test("screenshot continuations and accents are preserved", () => {
  assert.deepEqual(groups.Practicar.slice(7), ["Visualizar", "Hacer un escáner corporal",
    "Practicar la bondad amorosa", "Siéntate en silencio", "Moverme con conciencia",
    "Reflexionar después de la práctica", "Probar algo nuevo"]);
  assert.deepEqual(groups.Dormir.slice(-3), ["Descansar sin culpa",
    "Dejar a un lado las preocupaciones del mañana", "Apreciar el descanso"]);
  assert.ok(groups["Seres queridos"].includes('Di "te quiero"'));
  assert.equal(groups.Nutrición[3], "Elegir un tentempié equilibrado");
  assert.equal(groups.Ejercicio.at(-1), "Hacer 5 abdominales");
  assert.equal(groups.Productividad.at(-1), "Dejar de trabajar cuando es hora de parar");
});

test("suggested activities resolve to valid categories containing their text", () => {
  for (const title of groups.Sugerido) {
    assert.ok(tabs.includes(suggested[title]));
    assert.ok(groups[suggested[title]].includes(title), title);
  }
  assert.equal(suggested["Comer algo nutritivo"], "Nutrición");
});
