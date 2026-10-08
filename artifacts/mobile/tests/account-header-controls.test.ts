import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("profile.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let header: ts.JsxElement | undefined;
const selected: string[] = [];
function visit(node: ts.Node) {
  if (ts.isJsxElement(node) && node.openingElement.getText(ast).includes('testID="account-header-actions"')) header = node;
  if (ts.isPropertyAssignment(node) && /^(accountBackButton|accountSaveButton.*|stickyHeaderRow|libraryTabHeaderRow)$/.test(node.name.getText(ast))) selected.push(node.getText(ast));
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(header);
const styles = new Function(`return ({${selected.join(",")}});`)();
const compiled = ts.transpileModule(`return (${header.getText(ast)});`, { compilerOptions: { jsx: ts.JsxEmit.React } }).outputText;
const factory = new Function("React", "View", "Pressable", "Text", "Feather", "styles", "onBack", "router", "saveAccount", "accountSaveDisabled", compiled);
const flat = (value: any): any => Array.isArray(value) ? Object.assign({}, ...value.map(flat)) : value ?? {};
const callbacks = new Map<string, () => void>();
let pressed = false;
const Native = (props: any) => {
  const style = flat(typeof props.style === "function" ? props.style({ pressed }) : props.style);
  if (props.onPress) callbacks.set(props.testID, () => { if (!props.disabled) props.onPress(); });
  return React.createElement("div", {
    "data-testid": props.testID, "data-icon": props.name, "data-disabled": props.disabled,
    "data-height": style.height, "data-background": style.backgroundColor, "data-opacity": style.opacity,
  }, props.children);
};

test("edit header has X on the left and one compact 43px Guardar at the right edge, without a title", () => {
  assert.equal(styles.accountBackButton.height, 43);
  assert.equal(styles.accountSaveButton.height, styles.accountBackButton.height);
  assert.equal(styles.accountSaveButton.marginLeft, "auto");
  assert.equal(styles.accountSaveButton.width, undefined);
  assert.equal(styles.accountSaveButton.flex, undefined);
  assert.equal(styles.stickyHeaderRow.alignItems, "center");
  assert.equal(styles.stickyHeaderRow.paddingHorizontal, 20);
  assert.equal((source.match(/onPress=\{saveAccount\}/g) ?? []).length, 1);
  assert.ok(source.indexOf('testID="account-save"') < source.indexOf("<KeyboardAvoidingView"));
  assert.doesNotMatch(header!.getText(ast), /Editar detalles|Mi cuenta|chevron-left/);
});

test("Guardar retains disabled, enabled and pressed appearance and X retains both back paths", () => {
  let saves = 0, backs = 0, routerBacks = 0;
  const render = (disabled: boolean, onBack: (() => void) | undefined = () => { backs++; }) => {
    callbacks.clear();
    return renderToStaticMarkup(factory(React, Native, Native, Native, Native, styles, onBack, { back() { routerBacks++; } }, () => { saves++; }, disabled));
  };
  assert.match(render(true), /data-testid="account-save"[^>]*data-disabled="true"[^>]*data-height="43"[^>]*data-background="rgba\(249,249,249,0.4\)"/);
  callbacks.get("account-save")!();
  assert.equal(saves, 0);
  assert.match(render(false), /data-icon="x"/);
  callbacks.get("account-save")!();
  callbacks.get("account-close")!();
  assert.equal(saves, 1);
  assert.equal(backs, 1);
  pressed = true;
  assert.match(render(false), /data-testid="account-save"[^>]*data-background="#F9F9F9"[^>]*data-opacity="0.86"/);
  pressed = false;
  render(false, undefined);
  // Omit the optional handler explicitly, rather than using the default above.
  factory(React, Native, Native, Native, Native, styles, undefined, { back() { routerBacks++; } }, () => {}, false);
  renderToStaticMarkup(factory(React, Native, Native, Native, Native, styles, undefined, { back() { routerBacks++; } }, () => {}, false));
  callbacks.get("account-close")!();
  assert.equal(routerBacks, 1);
});
