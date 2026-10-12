import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("profile.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
test("avatar hero is immediately visible without fading or remounting, leaving playlist cover transitions unchanged", () => {
  const heroes: ts.JsxSelfClosingElement[] = [];
  function visit(node: ts.Node) {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === "Image"
      && node.attributes.getText(ast).includes("styles.accountCoverPreview")) heroes.push(node);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.equal(heroes.length, 2); // Editorial avatar and uploaded photo.
  for (const hero of heroes) {
    assert.match(hero.attributes.getText(ast), /transition=\{0\}/);
    assert.equal(hero.attributes.properties.some((attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText(ast) === "key"), false);
  }
  assert.match(source, /import \{ IMAGE_TRANSITION \} from "@\/constants\/imagePlaceholder"/);
  const playlist = readFileSync(new URL("../app/playlist/[id].tsx", import.meta.url), "utf8");
  assert.match(playlist, /style=\{modalStyles.selectedPreview\}[\s\S]*?transition=\{IMAGE_TRANSITION\}/);
});

function findStyle(name: string) {
  let expression: ts.Expression | undefined;
  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(ast) === name) expression = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(expression);
  const js = ts.transpileModule(`return (${expression.getText(ast)});`, {}).outputText;
  return new Function(js)();
}

test("a large avatar catalog cannot enlarge the sheet beyond the screen", () => {
  const sheet = findStyle("accountCoverSheet");
  assert.equal(sheet.height, "85%");
  assert.equal(sheet.bottom, 0);
  const hero = findStyle("accountCoverPreviewSlot");
  assert.equal(hero.height, 170);
  assert.equal(hero.marginTop, 10);
  assert.equal(hero.flexShrink, 0);
  assert.equal(hero.flex, undefined);
  assert.equal(findStyle("accountCoverPresetGrid").flex, 1);
  const handle = findStyle("accountCoverHandle");
  const headerHeight = handle.marginTop + handle.height + handle.marginBottom + findStyle("accountCoverHeader").minHeight;
  for (const viewportHeight of [568, 640, 874, 1024]) {
    const sheetHeight = viewportHeight * 0.85;
    const listHeight = sheetHeight - headerHeight - hero.marginTop - hero.height;
    assert.ok(listHeight > 63, `a usable scroll area remains at ${viewportHeight}px`);
    for (const avatars of [26, 86, 200]) {
      const contentHeight = Math.ceil(avatars / 5) * 75 + 46;
      assert.ok(contentHeight > listHeight || viewportHeight >= 874);
      assert.ok(sheetHeight < viewportHeight);
    }
  }
});

test("avatar grid reaches the bottom without a fixed footer, retaining scrollable safe-area spacing", () => {
  assert.match(source, /style=\{\[styles.accountCoverSheet, \{ transform:/);
  assert.doesNotMatch(source, /styles.accountCoverSheet, \{ paddingBottom:/);
  assert.match(source, /contentContainerStyle=\{\[styles.accountCoverPresetGridContent, styles.accountCoverPresetGridContentFiltered, \{ paddingBottom: bottomPad \+ 20 \}\]\}/);
});

test("photo upload replaces X at the left margin, with celebration at the right and no balance message", () => {
  const header = source.slice(source.indexOf("<View style={styles.accountCoverHeader}>"), source.indexOf("<View style={styles.accountCoverPreviewSlot}>"));
  assert.match(header, /<Text style=\{styles.accountCoverTitle\}[\s\S]*?>Portada<\/Text>[\s\S]*?accountCoverUploadButton[\s\S]*?<Feather name="image" size=\{18\} color="#F9F9F9" \/>[\s\S]*?accountCoverCelebrationButton/);
  assert.doesNotMatch(header, /accountCoverCloseButton|name="x"/);
  assert.equal((source.match(/styles\.accountCoverUploadButton,/g) ?? []).length, 1);
  assert.doesNotMatch(source, /accountCoverUploadText/);
  assert.match(header, /accessibilityRole="button"\s+accessibilityLabel="Elegir una foto"/);
  const button = findStyle("accountCoverUploadButton");
  assert.equal(button.width, 43);
  assert.equal(button.height, 43);
  assert.equal(button.borderRadius, 21.5);
  assert.equal(button.position, "absolute");
  assert.equal(button.right, undefined);
  assert.equal(button.left, 0);
  assert.equal(button.zIndex, 1, "the photo action stays above the full-width title so its taps reach the Pressable");
  assert.equal(button.borderWidth, 0);
  assert.equal(button.backgroundColor, "rgba(0,0,0,0.16)");
  const celebration = findStyle("accountCoverCelebrationButton");
  assert.equal(celebration.right, 0);
  assert.equal(celebration.width, 43);
  assert.equal(celebration.height, 43);
  assert.match(header, /setGoldenAvatarVisible\(true\)/);
  assert.match(header, /name="party-popper"/);
  assert.equal(findStyle("accountCoverHeader").minHeight, 63);
  assert.equal(findStyle("accountCoverHeader").paddingTop, 20);
  for (const name of ["accountCoverUploadButton", "accountCoverCelebrationButton"]) {
    assert.equal(findStyle(name).top, 20);
  }
  const hero = source.slice(source.indexOf("<View style={styles.accountCoverPreviewSlot}>"), source.indexOf("<View style={styles.accountCoverPresetGrid}>"));
  assert.equal((hero.match(/transition=\{0\}/g) ?? []).length, 2);
  assert.doesNotMatch(hero, /IMAGE_TRANSITION/);
  assert.equal(findStyle("accountCoverTitle").textAlign, "center");
  assert.doesNotMatch(header, /desbloqueos disponibles|ganar desbloqueos/);
});

test("hero moves down ten pixels in normal flow and pushes the avatar grid equally", () => {
  const hero = findStyle("accountCoverPreviewSlot");
  const preview = findStyle("accountCoverPreview");
  assert.equal(hero.marginTop, 10);
  assert.equal(hero.transform, undefined);
  assert.equal(hero.height, 170);
  assert.equal(preview.width, 115.5);
  assert.equal(preview.height, 115.5);
  assert.equal(preview.transform, undefined);
  assert.equal(hero.marginTop + hero.height - 170, 10);
  assert.match(source, /<\/View>\s*<View\s+style=\{styles.accountCoverPresetGrid\}[\s\S]*?<Reanimated\.FlatList\s+ref=\{accountAvatarGridRef\}/);
});

test("avatar filter is transparent, 11pt, right-aligned and raised seven pixels with the grid", () => {
  const dropdown = readFileSync(new URL("../components/AvatarCategoryDropdown.tsx", import.meta.url), "utf8");
  assert.match(dropdown, /fontSize:\s*11/);
  assert.match(dropdown, /lineHeight:\s*14/);
  assert.match(dropdown, /name=\{open \? "chevron-up" : "chevron-down"\} size=\{13\}/);
  assert.match(dropdown, /alignSelf:\s*"flex-end"/);
  const triggerStyles = dropdown.slice(dropdown.indexOf("trigger: {"), dropdown.indexOf("triggerText: {"));
  assert.doesNotMatch(triggerStyles, /borderRadius|borderWidth/);
  assert.match(triggerStyles, /backgroundColor:\s*"transparent"/);
  assert.match(dropdown, /hitSlop=\{\{\s*top:\s*25,\s*bottom:\s*21/);
  const handle = findStyle("accountCoverHandle");
  const headerEnd = handle.marginTop + handle.height + handle.marginBottom + findStyle("accountCoverHeader").minHeight;
  assert.equal(headerEnd, 81);
  assert.equal(findStyle("accountAvatarCategoryRow").justifyContent, "flex-end");
  assert.equal(findStyle("accountAvatarCategoryAnchor").justifyContent, "flex-end");
  assert.equal(findStyle("accountAvatarCategoryAnchor").position, undefined);
  assert.equal(findStyle("accountCoverPresetGridContentFiltered").paddingTop, 20);
  assert.equal(findStyle("accountAvatarCategoryRow").height, 39);
  assert.match(source, /<View style=\{styles.accountAvatarCategoryRow\}>[\s\S]*?<AvatarCategoryTrigger[\s\S]*?<\/View>\s*<\/View>\s*<Reanimated.FlatList/);
  assert.match(source, /<AvatarCategoryMenu[\s\S]*?top=\{avatarGridTop \+ 39 \+ 6\}[\s\S]*?right=\{20\}/);
  assert.match(dropdown, /menu:\s*\{[\s\S]*?zIndex:\s*22/);
  assert.match(source, /accountAvatarCategoryAnchor:\s*\{[\s\S]*?minHeight:\s*44,[\s\S]*?minWidth:\s*44,[\s\S]*?zIndex:\s*21/);
  assert.doesNotMatch(source, /onPress=\{closeAvatarPicker\}/);
  assert.doesNotMatch(source, /onPress=\{avatarDismiss\.onBlankPress\}/);
});

test("category selection only changes the filter and scroll, never the staged identity", () => {
  let selector: ts.Expression | undefined;
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "selectAvatarFilter") selector = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(selector);
  const calls: unknown[] = [];
  const output = ts.transpileModule(`return (${selector.getText(ast)});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const select = new Function("setAvatarFilterOpen", "setAvatarFilter", "avatarFilter", "accountAvatarGridRef", output)(
    (value: boolean) => calls.push(["menu", value]),
    (value: string) => calls.push(["filter", value]),
    "all",
    { current: { scrollToOffset: (value: unknown) => calls.push(["scroll", value]) } },
  );
  select("category-a");
  assert.deepEqual(calls, [["menu", false], ["filter", "category-a"], ["scroll", { offset: 0, animated: false }]]);
  assert.match(source, /data=\{filteredProfileCatalog\}/);
  assert.match(source, /<AvatarCategoryMenu[\s\S]*?onSelect=\{selectAvatarFilter\}[\s\S]*?<\/Modal>/);
});

test("upload action waits for the selector dismissal before requesting the photo library", () => {
  let button: ts.JsxElement | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(ast) === "Pressable"
      && node.openingElement.attributes.getText(ast).includes("styles.accountCoverUploadButton")) button = node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(button);
  const press = button.openingElement.attributes.properties.find(node => ts.isJsxAttribute(node) && node.name.getText(ast) === "onPress");
  assert.ok(press && ts.isJsxAttribute(press) && press.initializer && ts.isJsxExpression(press.initializer) && press.initializer.expression);
  const js = ts.transpileModule(`return (${press.initializer.expression.getText(ast)});`, {}).outputText;
  const calls: unknown[] = [];
  new Function("setAccountPhotoLibraryPending", "setAccountPhotoPickerVisible", js)(
    (pending: boolean) => calls.push(["pending", pending]),
    (visible: boolean) => calls.push(["visible", visible]),
  )();
  assert.deepEqual(calls, [["pending", true], ["visible", false]]);
  assert.doesNotMatch(press.initializer.expression.getText(ast), /pickPhoto/);
  assert.match(source, /onDismiss=\{\(\) => \{[\s\S]*?if \(!accountPhotoLibraryPending\) return;[\s\S]*?requestAnimationFrame[\s\S]*?void pickPhoto\(\)/);
});

test("the photo action opens the native image library and persists the selected photo, respecting denial and cancellation", async () => {
  let picker: ts.Expression | undefined;
  let apply: ts.Expression | undefined;
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "pickPhoto") picker = node.initializer;
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "applySelectedPhoto") apply = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(picker);
  assert.ok(apply);
  const js = ts.transpileModule(`return (${picker.getText(ast)});`, {}).outputText;
  const applyJs = ts.transpileModule(`return (${apply.getText(ast)});`, {}).outputText;
  for (const accountMode of [false, true]) {
  for (const platform of ["ios", "android"]) {
    for (const scenario of ["selected", "denied", "canceled"]) {
      const calls: unknown[] = [];
      const imagePicker = {
        requestMediaLibraryPermissionsAsync: async () => ({ status: scenario === "denied" ? "denied" : "granted" }),
        launchImageLibraryAsync: async (options: unknown) => {
          calls.push(["library", options]);
          return { canceled: scenario === "canceled", assets: [{ uri: "file:///selected.jpg" }] };
        },
      };
      class File {
        uri: string;
        constructor(directory: string, name?: string) { this.uri = name ? `${directory}/${name}` : directory; }
        copy(destination: File) { calls.push(["copy", this.uri, destination.uri]); }
      }
      const closedRef = { current: false };
      const savingRef = { current: false };
      const applySelectedPhoto = new Function("accountMode", "accountClosedRef", "accountSavingRef",
        "setAccountPhotoUri", "setAccountAvatarPresetId", "setPhotoUri", applyJs)(
        accountMode, closedRef, savingRef,
        (uri: string) => calls.push(["draft-photo", uri]), (id: unknown) => calls.push(["avatar-preset", id]),
        (uri: string) => calls.push(["photo", uri]),
      );
      const pickPhoto = new Function("ImagePicker", "Alert", "Platform", "FSFile", "Paths",
        "buildLocalAvatarFilename", "randomUUID", "accountMode", "accountClosedRef", "accountSavingRef", "applySelectedPhoto", js)(
        imagePicker, { alert: () => calls.push(["permission-alert"]) }, { OS: platform }, File,
        { document: "file:///documents" }, () => "avatar-new.jpg", () => "unique",
        accountMode, closedRef, savingRef, applySelectedPhoto,
      );
      await pickPhoto();
      if (scenario === "denied") {
        assert.deepEqual(calls, [["permission-alert"]]);
      } else {
        assert.deepEqual(calls[0], ["library", {
          mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8,
        }]);
        if (scenario === "selected") {
          assert.deepEqual(calls.slice(1), [
            ["copy", "file:///selected.jpg", "file:///documents/avatar-new.jpg"],
            [accountMode ? "draft-photo" : "photo", "file:///documents/avatar-new.jpg"],
            ...(accountMode ? [["avatar-preset", null]] : []),
          ]);
        } else {
          assert.equal(calls.length, 1);
        }
      }
    }
  }
  }
});

test("opening and reopening the actual picker resets its own avatar list to the first row", () => {
  let picker: ts.JsxOpeningElement | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(ast) === "Modal"
      && node.attributes.getText(ast).includes("accountPhotoPickerVisible")) picker = node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(picker);
  const attribute = picker.attributes.properties.find((node) => ts.isJsxAttribute(node) && node.name.getText(ast) === "onShow");
  assert.ok(attribute && ts.isJsxAttribute(attribute));
  assert.ok(attribute.initializer && ts.isJsxExpression(attribute.initializer));
  const js = ts.transpileModule(`return (${attribute.initializer.expression!.getText(ast)});`, {}).outputText;
  const calls: unknown[] = [];
  const ref: { current: null | { scrollToOffset: (args: unknown) => void } } = {
    current: { scrollToOffset: (args) => calls.push(args) },
  };
  const onShow = new Function("accountAvatarGridRef", js)(ref);
  onShow();
  onShow();
  assert.deepEqual(calls, [{ offset: 0, animated: false }, { offset: 0, animated: false }]);
  ref.current = null;
  assert.doesNotThrow(onShow);
  assert.match(source, /<Reanimated\.FlatList\s+ref=\{accountAvatarGridRef\}/);
});
