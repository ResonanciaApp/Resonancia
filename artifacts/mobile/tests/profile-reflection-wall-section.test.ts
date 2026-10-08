import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import * as JSXRuntime from "react/jsx-runtime";
import ts from "typescript";
import {
  MOOD_HISTORY_GRADIENT,
  MOOD_HISTORY_GRADIENT_START,
  MOOD_HISTORY_GRADIENT_END,
} from "../constants/moodHistoryGradient.ts";
import {
  REFLECTION_WALL_BORDER_BASE_GRADIENT,
  REFLECTION_WALL_BORDER_GRADIENT,
  REFLECTION_WALL_BORDER_LOCATIONS,
  REFLECTION_WALL_BORDER_START,
  REFLECTION_WALL_BORDER_END,
  REFLECTION_WALL_BORDER_BRIGHTNESS,
} from "../constants/reflectionWallBorder.ts";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("Perfil puts Mi muro's heading outside the card with Mi rutina's gap and matching add-card typography", () => {
  const profile = source("../components/ProfileReflectionWallSection.tsx");
  assert.ok(profile.indexOf('testID="profile-wall-title"') < profile.indexOf("<HomeReflectionWallSection"));
  assert.doesNotMatch(profile, /sectionTitle="Mi muro expansivo"/);
  assert.match(profile, /profileVariant/);
  assert.equal(style("ProfileReflectionWallSection", "title").marginBottom, style("MiRutinaSection", "headerRow").marginBottom);
  assert.equal(style("InnerSpaceCard", "profileWall").borderWidth, 1);
  assert.equal(style("InnerSpaceCard", "profileWallDescription").fontSize, style("MiRutinaSection", "addButtonText").fontSize);
  assert.equal(style("InnerSpaceCard", "profileWallDescription").fontWeight, style("MiRutinaSection", "addButtonText").fontWeight);
  assert.deepEqual(style("InnerSpaceCard", "profileWallDescription").transform, [{ translateY: -2 }]);
  assert.equal(style("ProfileReflectionWallSection", "title").fontSize, 19);
  const card = source("../components/InnerSpaceCard.tsx");
  assert.match(card, /borderWidth=\{profileVariant \? 1 : 2\}/);
  assert.match(card, /profileVariant && styles.profileWallDescription/);
  assert.match(source("../components/HomeReflectionWallSection.tsx"), /profileVariant=\{profileVariant\}/);
});

test("both Perfil section titles use Dormir's carousel size, while Inicio keeps its routine defaults", () => {
  const size = Number(source("../app/(tabs)/descanzo.tsx").match(/titleSize=\{(\d+)\}/)![1]);
  assert.equal(style("ProfileReflectionWallSection", "title").fontSize, size);
  assert.match(source("../components/ProfileScreenBase.tsx"), new RegExp(`<MiRutinaSection titleSize=\\{${size}\\}`));
  assert.match(source("../components/MiRutinaSection.tsx"), /titleSize = 17/);
});

test("calendar keeps only the requested today-empty message, with past-day wording intact", () => {
  const calendar = source("../components/HistorialCalendar.tsx");
  assert.match(calendar, /isSameDay\(selectedDate, today\)\s*\? "Aún no has completado nada hoy"\s*: "No hay actividad"/);
  assert.doesNotMatch(calendar, /Tómate un momento para pausar y comenzar tu práctica/);
});

test("Mi muro reports only its actual closed-card height and Perfil forwards it to Añadir una actividad", () => {
  const contents = source("../components/InnerSpaceCard.tsx");
  const ast = ts.createSourceFile("wall.tsx", contents, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let layout: ts.Expression | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxAttribute(node) && node.name.getText(ast) === "onLayout"
      && node.initializer && ts.isJsxExpression(node.initializer)
      && node.initializer.expression?.getText(ast).includes("onCollapsedHeightChange")) layout = node.initializer.expression;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(layout);
  const compiled = ts.transpileModule(`return (${layout.getText(ast)});`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const factory = new Function("onCollapsedHeightChange", "expandedRef", "animatingRef", compiled);
  const measured: number[] = [];
  for (const [expanded, animating] of [[false, false], [true, false], [false, true]]) {
    const onLayout = factory((height: number) => measured.push(height), { current: expanded }, { current: animating });
    onLayout({ nativeEvent: { layout: { height: 84.5 } } });
    onLayout({ nativeEvent: { layout: { height: 0 } } });
  }
  assert.deepEqual(measured, [84.5], "expanded/transitional layouts must not resize the routine card");
  assert.equal(factory(undefined, { current: false }, { current: false }), undefined, "Inicio has no extra measurement listener");
  const profile = source("../components/ProfileScreenBase.tsx");
  assert.match(profile, /onCollapsedHeightChange=\{setProfileWallCardHeight\}/);
  assert.match(profile, /addCardHeight=\{profileWallCardHeight\}/);
  assert.match(source("../components/ProfileReflectionWallSection.tsx"), /onCollapsedHeightChange=\{onCollapsedHeightChange\}/);
  assert.match(source("../components/HomeReflectionWallSection.tsx"), /onCollapsedHeightChange=\{onCollapsedHeightChange\}/);
});

test("routine add card uses the measured wall height only when supplied and leaves the complete-state pill intact", () => {
  const contents = source("../components/MiRutinaSection.tsx");
  const ast = ts.createSourceFile("routine.tsx", contents, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let styling: ts.Expression | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) && node.openingElement.getText(ast).includes('testID="mi-rutina-add-button"')) {
      const attr = node.openingElement.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.getText(ast) === "style");
      if (attr && ts.isJsxAttribute(attr) && attr.initializer && ts.isJsxExpression(attr.initializer)) styling = attr.initializer.expression;
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(styling);
  const compiled = ts.transpileModule(`return (${styling.getText(ast)});`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  for (const height of [undefined, 82, 103.5]) {
    const fn = new Function("styles", "addCardHeight", "alignCardGapToWall", "todayActivities", compiled)({ addButton: style("MiRutinaSection", "addButton") }, height, false, []);
    const merged = Object.assign({}, ...fn({ pressed: false }).filter(Boolean));
    assert.equal(merged.height, height);
    assert.equal(merged.minHeight, height ?? 68);
    assert.equal(merged.borderStyle, "dashed");
  }
  const evaluate = new Function("styles", "addCardHeight", "alignCardGapToWall", "todayActivities", compiled);
  for (const [align, activities, margin] of [[true, [], 0], [true, [{ id: "pending" }], 10], [false, [], 10]] as const) {
    const fn = evaluate({ addButton: style("MiRutinaSection", "addButton") }, 82, align, activities);
    const merged = Object.assign({}, ...fn({ pressed: false }).filter(Boolean));
    assert.equal(merged.marginTop, margin, "only the empty aligned state removes the extra ten pixels");
    assert.equal(merged.borderRadius, align ? style("MiRutinaSection", "completeState").borderRadius : 21);
  }
  const wallGap = Number(style("ProfileReflectionWallSection", "title").marginBottom);
  const routineGap = Number(style("MiRutinaSection", "headerRow").marginBottom);
  assert.equal(wallGap, routineGap);
  assert.equal(Number(style("MiRutinaSection", "alignedHeaderRow").marginBottom), routineGap + 2);
  assert.match(source("../components/MiRutinaSection.tsx"), /styles\.headerRow, alignCardGapToWall && styles\.alignedHeaderRow/);
  assert.equal(style("MiRutinaSection", "completeState").marginTop ?? 0, 0);
  assert.deepEqual(style("RoutineCompletionTransition", "completeLayer"), { position: "absolute", top: 0, left: 0, right: 0 });
  assert.equal(style("ProfileReflectionWallSection", "title").lineHeight, style("MiRutinaSection", "alignedSectionTitle").lineHeight);
  assert.match(source("../components/ProfileScreenBase.tsx"), /<MiRutinaSection[^>]*alignCardGapToWall/);
  assert.equal(style("InnerSpaceCard", "profileWall").borderRadius, style("MiRutinaSection", "completeState").borderRadius);
  assert.match(source("../components/InnerSpaceCard.tsx"), /borderRadius=\{profileVariant \? 16 : 24\}/);
  const baseHeight = Number(style("InnerSpaceCard", "canonicalHeaderCopy").minHeight)
    + Number(style("InnerSpaceCard", "profileWall").paddingTop)
    + Number(style("InnerSpaceCard", "profileWall").paddingBottom)
    + 2 * Number(style("InnerSpaceCard", "profileWall").borderWidth);
  assert.equal(baseHeight, 82);
});

test("Tu camino lifts only its content row four pixels and trims eight pixels off the bottom", () => {
  const card = style("GrowthJourney", "titledPreviewCard");
  assert.equal(card.paddingTop, 18);
  assert.equal(card.paddingBottom, 12 - 8);
  assert.deepEqual(style("GrowthJourney", "previewContentRow").transform, [{ translateY: -4 }, { translateX: -8 }]);
  assert.equal(style("GrowthJourney", "previewSectionHeader").transform, undefined);
  assert.match(source("../components/GrowthJourney.tsx"), /<View style=\{styles\.previewContentRow\}>\{previewContent\}<\/View>/);
});

test("Tu camino uses the smaller caption and stage title with a gold lotus on a translucent circular background", () => {
  assert.equal(style("GrowthJourney", "previewViewAll").fontSize, 13 - 2);
  assert.match(source("../components/ProfileScreenBase.tsx"), /sectionTitle="Tu camino" titleFontSize=\{17\}/);
  const circle = style("GrowthJourney", "profileIntentionLotusBackground");
  assert.equal(circle.width, circle.height);
  assert.equal(Number(circle.borderRadius), Number(circle.width) / 2);
  assert.equal(circle.backgroundColor, "rgba(255,255,255,0.1)");
  assert.equal(circle.opacity, undefined, "the gold lotus remains opaque");
  assert.equal(circle.alignItems, "center");
  assert.equal(circle.justifyContent, "center");
  assert.match(source("../components/GrowthJourney.tsx"), /testID="profile-intention-lotus-background" pointerEvents="none"[\s\S]*?name="spa"\s*size=\{16\}\s*color=\{GROWTH_COLORS\.current\}/);
});

test("Tu camino shifts the lotus, its background, stage name and description four pixels left without moving the image", () => {
  assert.deepEqual(style("GrowthJourney", "profilePreviewCopyOffset").transform, [{ translateX: -4 }]);
  const growth = source("../components/GrowthJourney.tsx");
  assert.match(growth, /styles\.previewCopy,\s*canonicalVerticalInsets && styles\.canonicalPreviewCopy,\s*sectionTitle && styles\.profilePreviewCopyOffset/);
  assert.match(growth, /style=\{\[styles\.previewArt, sectionTitle && styles\.profilePreviewArt\]\}/);
  assert.deepEqual(style("GrowthJourney", "previewContentRow").transform, [{ translateY: -4 }, { translateX: -8 }]);
});

test("Perfil supplies its themed description gray to Tu camino, streak labels and all selected-day content without changing other surfaces", () => {
  const growth = source("../components/GrowthJourney.tsx");
  assert.match(growth, /color: sectionTitle \? getProfileSecondaryTextColor\(theme\.id\) : colors\.mutedForeground/);
  const profile = source("../components/ProfileScreenBase.tsx");
  assert.match(profile, /profileSecondaryTextColor = getProfileSecondaryTextColor\(activeSceneId\)/);
  assert.match(profile, /secondaryTextColor=\{profileSecondaryTextColor\}/);
  assert.match(profile, /styles\.profileDescription, \{ color: profileSecondaryTextColor \}/);
  const mirror = source("../components/ProgressMirrorSections.tsx");
  assert.equal((mirror.match(/labelColor=\{secondaryTextColor\}/g) ?? []).length, 4);
  assert.match(mirror, /dayContentTextColor=\{secondaryTextColor\}/);
  assert.match(mirror, /color: labelColor \?\? accent/);
  const calendar = source("../components/HistorialCalendar.tsx");
  assert.match(calendar, /styles\.embeddedEmptyText, \{ color: dayContentTextColor \?\? "#F9F9F9" \}/);
  assert.match(calendar, /styles\.embeddedEntryTitle, \{ color: dayContentTextColor \?\? calendarAccent \}/);
  assert.match(calendar, /styles\.embeddedEntryCategory, \{ color: dayContentTextColor \?\? colors\.foreground \}/);
  for (const styleName of ["embeddedCompletedCount", "embeddedEntryDurationText"]) {
    assert.ok(calendar.includes(`styles.${styleName}, dayContentTextColor !== undefined && { color: dayContentTextColor }`));
  }
});

test("Perfil header controls take touch priority over the lifted avatar without moving either", () => {
  const profile = source("../components/ProfileScreenBase.tsx");
  const ast = ts.createSourceFile("profile.tsx", profile, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const component = ast.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "ProfileHeaderActions");
  assert.ok(component);
  const compiled = ts.transpileModule(`${component.getText(ast)}; return ProfileHeaderActions;`, {
    compilerOptions: { jsx: ts.JsxEmit.React },
  }).outputText;
  const header = new Function("React", "View", "Pressable", "Feather", "styles", compiled)(
    React, "View", "Pressable", "Feather", {
      profileHeaderActions: style("ProfileScreenBase", "profileHeaderActions"),
      profileStickyHeaderActions: style("ProfileScreenBase", "profileStickyHeaderActions"),
      gearBtn: style("ProfileScreenBase", "gearBtn"),
    },
  );
  for (const sticky of [false, true]) {
    let edits = 0;
    let settings = 0;
    const root = header({
      sticky, foreground: "#F9F9F9", activeSceneId: "cloudy",
      onEdit: () => edits++, onSettings: () => settings++,
    });
    assert.equal(root.props.pointerEvents, "box-none");
    const buttons = React.Children.toArray(root.props.children) as React.ReactElement<any>[];
    buttons[0].props.onPress();
    buttons[1].props.onPress();
    assert.equal(edits, 1);
    assert.equal(settings, 1);
    assert.equal(buttons[0].props.testID, sticky ? "profile-sticky-edit-details" : "profile-edit-details");
    assert.equal(buttons[1].props.testID, sticky ? "profile-sticky-open-settings" : "profile-open-settings");
  }
  const row = style("ProfileScreenBase", "dedicatedTitleRow");
  const card = profile.match(/profileCard:\s*\{([\s\S]*?)\n  \},/)?.[1];
  assert.ok(card);
  assert.ok(Number(row.zIndex) > Number(card.match(/zIndex:\s*(\d+)/)?.[1] ?? 0));
  assert.ok(Number(row.elevation) > Number(card.match(/elevation:\s*(\d+)/)?.[1] ?? 0));
  assert.match(profile, /<View pointerEvents="box-none" style=\{styles\.dedicatedTitleRow\}>/);
  assert.match(profile, /onEdit=\{\(\) => router\.push\("\/mi-perfil"\)\}/);
  assert.match(profile, /onSettings=\{\(\) => router\.push\("\/configuracion-ajustes"\)\}/);
  assert.equal(style("ProfileScreenBase", "gearBtn").width, 43);
});

test("Mi muro keeps the same prompt before and after selecting any category tab", () => {
  const contents = source("../components/InnerSpaceCard.tsx");
  const ast = ts.createSourceFile("InnerSpaceCard.tsx", contents, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = new Map<string, ts.Expression>();
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      declarations.set(node.name.getText(ast), node.initializer);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  const defaultPrompt = declarations.get("DEFAULT_PLACEHOLDER");
  const desiredPrompt = declarations.get("desiredPlaceholder");
  assert.ok(defaultPrompt && desiredPrompt);
  const resolve = new Function("category", ts.transpileModule(
    `const DEFAULT_PLACEHOLDER = ${defaultPrompt.getText(ast)}; return ${desiredPrompt.getText(ast)};`,
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
  ).outputText);
  for (const category of [null, "gratitude", "clarity", "calm", "purpose", "acceptance", "new-category"]) {
    assert.equal(resolve(category), "¿Qué sientes compartir hoy?");
  }
  assert.doesNotMatch(contents, /CATEGORY_PLACEHOLDERS|Ej: /);
  assert.match(contents, /useState\(DEFAULT_PLACEHOLDER\)/);
  assert.match(contents, /settlePlaceholder\(DEFAULT_PLACEHOLDER\)/);
});

function style(file: string, name: string, values: Record<string, unknown> = {}): Record<string, unknown> {
  const contents = source(`../components/${file}.tsx`);
  const ast = ts.createSourceFile(file, contents, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let initializer: ts.Expression | undefined;
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "styles"
      && node.initializer && ts.isCallExpression(node.initializer)
      && ts.isObjectLiteralExpression(node.initializer.arguments[0])) {
      const property = node.initializer.arguments[0].properties.find((entry) =>
        ts.isPropertyAssignment(entry) && entry.name.getText(ast) === name);
      if (property && ts.isPropertyAssignment(property)) initializer = property.initializer;
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(initializer, `${file} defines ${name}`);
  const compiled = ts.transpileModule(`return (${initializer.getText(ast)});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function(...Object.keys(values), compiled)(...Object.values(values)) as Record<string, unknown>;
}

test("Cloudy wall removes the parent border inset while preserving its content coordinates", () => {
  const container = style("InnerSpaceCard", "container", { INNER_SPACE_CARD_BOTTOM_MARGIN: 32 });
  const canonical = style("InnerSpaceCard", "canonicalVerticalInsets");
  const flush = style("InnerSpaceCard", "cloudyFlushBorder");
  assert.equal(flush.borderWidth, 0);
  for (const padding of ["paddingHorizontal", "paddingTop", "paddingBottom"]) {
    const before = Number(canonical[padding] ?? container[padding]) + Number(container.borderWidth);
    assert.equal(flush[padding], before);
  }
  assert.match(source("../components/InnerSpaceCard.tsx"), /canonicalVerticalInsets && theme\.id === "cloudy" && styles\.cloudyFlushBorder/);
});

test("InnerSpaceCard keeps Home defaults and opts profile into a single 18px-inset card title", () => {
  const defaults = style("InnerSpaceCard", "container", { INNER_SPACE_CARD_BOTTOM_MARGIN: 32 });
  assert.equal(defaults.paddingHorizontal, 20);
  assert.equal(defaults.paddingTop, 12);
  assert.equal(defaults.paddingBottom, 16);
  assert.equal(defaults.marginBottom, 32);

  const profileInsets = style("InnerSpaceCard", "canonicalVerticalInsets");
  assert.deepEqual(profileInsets, { paddingTop: 18, paddingBottom: 18, marginBottom: 0, borderColor: "transparent" });

  const card = source("../components/InnerSpaceCard.tsx");
  const titleAt = card.indexOf("{sectionTitle ? (");
  const headerAt = card.indexOf("<View style={styles.header}>");
  assert.ok(titleAt > headerAt && titleAt < card.indexOf('style={styles.infoButton}'), "heading and description share the same header row with the plus");
  assert.match(card, /style=\{\[styles\.container,\s*canonicalVerticalInsets && styles\.canonicalVerticalInsets,\s*canonicalVerticalInsets && theme\.id === "cloudy" && styles\.cloudyFlushBorder,\s*profileVariant && styles\.profileWall,\s*sectionBackgroundColor !== undefined && \{ backgroundColor: sectionBackgroundColor \}\]\}/);
  assert.match(source("../components/ProfileReflectionWallSection.tsx"), /sectionBackgroundColor="rgba\(0,0,0,0.16\)"/);
  assert.match(card, /styles\.sectionTitle,\s*\{ color: colors\.foreground \}/);
});

test("the profile wall uses ten equally spaced supplied colors with 25% more brightness without changing the history background or direction", () => {
  const card = source("../components/InnerSpaceCard.tsx");
  const border = source("../components/DiscoverSearchBorder.tsx");
  assert.match(card, /canonicalVerticalInsets && \(\s*<DiscoverSearchBorder[\s\S]*?borderRadius=\{profileVariant \? 16 : 24\}[\s\S]*?brightness=\{REFLECTION_WALL_BORDER_BRIGHTNESS\}[\s\S]*?colors=\{theme.id === "cloudy" \? CLOUDY_REFLECTION_WALL_BORDER_GRADIENT : REFLECTION_WALL_BORDER_GRADIENT\}[\s\S]*?start=\{REFLECTION_WALL_BORDER_START\}[\s\S]*?end=\{REFLECTION_WALL_BORDER_END\}/);
  assert.match(border, /borderWidth = 2/);
  assert.match(border, /brightness = 1/);
  assert.match(border, /opacity: 0\.99 \* brightness/);
  assert.match(border, /colors = SEARCH_BORDER_GRADIENT/);
  assert.match(border, /pointerEvents="none"/);
  assert.equal(style("InnerSpaceCard", "container", { INNER_SPACE_CARD_BOTTOM_MARGIN: 32 }).borderColor, "rgba(255,255,255,0.1)");
  const history = source("../app/historial-emociones.tsx");
  assert.match(history, /colors=\{MOOD_HISTORY_GRADIENT\}/);
  assert.match(history, /start=\{MOOD_HISTORY_GRADIENT_START\}/);
  assert.match(history, /end=\{MOOD_HISTORY_GRADIENT_END\}/);
  assert.deepEqual(MOOD_HISTORY_GRADIENT, ["#074B4C", "#24414F", "#2E3955", "#363459", "#493453", "#57334F", "#5B3D25"]);
  assert.deepEqual(MOOD_HISTORY_GRADIENT_START, { x: 0.35, y: 0 });
  assert.deepEqual(MOOD_HISTORY_GRADIENT_END, { x: 0.65, y: 1 });
  assert.deepEqual(REFLECTION_WALL_BORDER_BASE_GRADIENT, ["#4D97A8", "#4D8EA8", "#4D70A8", "#566BB6", "#5D6EC0", "#756EC1", "#916BB5", "#AA7BA0", "#C18A82", "#D0A66F"]);
  assert.deepEqual(REFLECTION_WALL_BORDER_GRADIENT, ["#60BDD2", "#60B2D2", "#608CD2", "#6C86E4", "#748AF0", "#928AF1", "#B586E2", "#D59AC8", "#F1ADA3", "#FFD08B"]);
  assert.match(card, /locations=\{REFLECTION_WALL_BORDER_LOCATIONS\}/);
  assert.equal(REFLECTION_WALL_BORDER_LOCATIONS.length, 10);
  assert.equal(REFLECTION_WALL_BORDER_LOCATIONS[0], 0);
  assert.equal(REFLECTION_WALL_BORDER_LOCATIONS[9], 1);
  for (let i = 1; i < 10; i++) {
    assert.ok(Math.abs(REFLECTION_WALL_BORDER_LOCATIONS[i] - REFLECTION_WALL_BORDER_LOCATIONS[i - 1] - 1 / 9) < 1e-12);
  }
  assert.equal(REFLECTION_WALL_BORDER_START, MOOD_HISTORY_GRADIENT_START);
  assert.equal(REFLECTION_WALL_BORDER_END, MOOD_HISTORY_GRADIENT_END);
  assert.equal(REFLECTION_WALL_BORDER_BRIGHTNESS, 1);
});

test("the wall renders all ten brightened stops at equal intervals without changing Discover or increasing border opacity", () => {
  const compiled = ts.transpileModule(source("../components/DiscoverSearchBorder.tsx"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const mocks: Record<string, unknown> = {
    "react/jsx-runtime": JSXRuntime,
    "@react-native-masked-view/masked-view": () => null,
    "expo-linear-gradient": { LinearGradient: () => null },
    "react-native": {
      View: () => null,
      StyleSheet: { create: (styles: unknown) => styles, absoluteFill: {}, absoluteFillObject: {} },
    },
    "@/constants/colors": { POSITIONED_DAY_GRADIENT: ["#123456", "#654321"] },
  };
  const module = { exports: {} as { DiscoverSearchBorder: (props: Record<string, unknown>) => React.ReactElement<any> } };
  new Function("require", "module", "exports", compiled)((name: string) => {
    assert.ok(name in mocks, `missing border mock: ${name}`);
    return mocks[name];
  }, module, module.exports);
  const original = module.exports.DiscoverSearchBorder({});
  const wall = module.exports.DiscoverSearchBorder({
    borderRadius: 24,
    brightness: REFLECTION_WALL_BORDER_BRIGHTNESS,
    colors: REFLECTION_WALL_BORDER_GRADIENT,
    locations: REFLECTION_WALL_BORDER_LOCATIONS,
    start: REFLECTION_WALL_BORDER_START,
    end: REFLECTION_WALL_BORDER_END,
  });
  const resolve = (styles: Record<string, unknown>[]) => Object.assign({}, ...styles);
  assert.equal(resolve(original.props.style).opacity, 0.99);
  assert.equal(resolve(wall.props.style).opacity, 0.99);
  assert.equal(wall.props.pointerEvents, "none");
  assert.ok((resolve(wall.props.style).opacity as number) <= 1);
  assert.deepEqual(wall.props.children.props.colors, REFLECTION_WALL_BORDER_GRADIENT);
  assert.deepEqual(wall.props.children.props.locations, REFLECTION_WALL_BORDER_LOCATIONS);
  assert.equal(original.props.children.props.locations, undefined);
  assert.deepEqual(wall.props.children.props.start, REFLECTION_WALL_BORDER_START);
  assert.deepEqual(wall.props.children.props.end, REFLECTION_WALL_BORDER_END);
  assert.equal(original.props.children.props.colors.length, 2);
  assert.deepEqual(original.props.children.props.start, { x: 0, y: 0 });
  assert.deepEqual(original.props.children.props.end, { x: 1, y: 1 });
  assert.equal(resolve(wall.props.maskElement.props.style).borderWidth, 2);
  assert.equal(resolve(wall.props.maskElement.props.style).borderRadius, 24);
});

test("Registrar uses Natural white with original opacities and preserves other themes", () => {
  const contents = source("../components/InnerSpaceCard.tsx");
  const ast = ts.createSourceFile("InnerSpaceCard.tsx", contents, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let button: ts.JsxElement | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(ast) === "Pressable") {
      const testID = node.openingElement.attributes.properties.find((prop) =>
        ts.isJsxAttribute(prop) && prop.name.getText(ast) === "testID",
      );
      if (testID && ts.isJsxAttribute(testID) && testID.initializer
        && ts.isStringLiteral(testID.initializer) && testID.initializer.text === "save-reflection") button = node;
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(button);
  const compiled = ts.transpileModule(`return (${button.getText(ast)});`, {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const styles = {
    submitButton: style("InnerSpaceCard", "submitButton"),
    submitText: style("InnerSpaceCard", "submitText"),
  };
  const saveMessage = () => {};
  const scope = {
    React, Pressable: "button", Text: "span", styles, saveMessage,
    REGISTER_BUTTON_BACKGROUND: "rgba(184, 117, 240, 0.2)",
    REGISTER_BUTTON_ENABLED_BACKGROUND: "rgba(184, 117, 240, 0.45)",
    NATURAL_REGISTER_BUTTON_BACKGROUND: "rgba(249,249,249,0.2)",
    NATURAL_REGISTER_BUTTON_ENABLED_BACKGROUND: "rgba(249,249,249,0.45)",
  };
  const renderButton = new Function(...Object.keys(scope), "isSubmitDisabled", "createMutation", "theme", compiled);
  for (const themeId of ["natural", "cloudy", "indigo2", "pleyades"]) {
  for (const [disabled, pending] of [[false, false], [true, false], [true, true]]) {
    const element = renderButton(...Object.values(scope), disabled, { isPending: pending }, { id: themeId }) as React.ReactElement<any>;
    const background = element.props.style.find((entry: any) => entry?.backgroundColor)?.backgroundColor;
    assert.equal(background, themeId === "natural"
      ? (disabled ? scope.NATURAL_REGISTER_BUTTON_BACKGROUND : scope.NATURAL_REGISTER_BUTTON_ENABLED_BACKGROUND)
      : (disabled ? scope.REGISTER_BUTTON_BACKGROUND : scope.REGISTER_BUTTON_ENABLED_BACKGROUND));
    assert.equal(element.props.disabled, disabled);
    assert.equal(element.props.onPress, saveMessage);
    assert.equal(element.props.accessibilityLabel, "Registrar");
    const label = element.props.children as React.ReactElement<any>;
    assert.equal(label.type, "span");
    assert.equal(label.props.children, pending ? "Registrando..." : "REGISTRAR");
    assert.equal(label.props.style.find((entry: any) => entry?.color)?.color, disabled ? "#D4B8F4" : "#F9F9F9");
    assert.equal(element.props.style.find((entry: any) => entry?.opacity)?.opacity, disabled ? 0.5 : undefined);
  }
  }
  assert.doesNotMatch(button.getText(ast), /MaskedView|LinearGradient/);
});

test("Ver muro has an opaque white border in every theme", () => {
  const contents = source("../components/InnerSpaceCard.tsx");
  const button = contents.slice(contents.indexOf('testID="open-reflection-wall"'), contents.indexOf('testID="save-reflection"'));
  assert.match(button, /borderColor: REFLECTION_WALL_BUTTON_BORDER_COLOR/);
  assert.doesNotMatch(button, /opacity:|theme\.id/);
  assert.match(source("../constants/colors.ts"), /REFLECTION_WALL_BUTTON_BORDER_COLOR = "#F9F9F9"/);
  assert.match(source("../constants/colors.ts"), /NATURAL_REGISTER_BUTTON_BACKGROUND = "rgba\(249,249,249,0\.2\)"/);
  assert.match(source("../constants/colors.ts"), /NATURAL_REGISTER_BUTTON_ENABLED_BACKGROUND = "rgba\(249,249,249,0\.45\)"/);
  assert.equal(style("InnerSpaceCard", "wallButton").borderWidth, 1);
});

test("Perfil wall description matches Intención typography and centers the plus with both header lines", () => {
  const description = style("InnerSpaceCard", "canonicalHeaderDescription");
  const intention = style("GrowthJourney", "previewStory");
  assert.equal(description.fontSize, intention.fontSize);
  assert.equal(description.lineHeight, intention.lineHeight);
  assert.equal(description.fontWeight, "400");
  assert.equal(style("InnerSpaceCard", "header").alignItems, "center");
  assert.equal(style("InnerSpaceCard", "canonicalHeaderCopy").minHeight, 44);
  const card = source("../components/InnerSpaceCard.tsx");
  assert.match(card, /styles\.headerCopy, canonicalVerticalInsets && styles\.canonicalHeaderCopy/);
  assert.match(card, /styles\.headerTitle,\s+canonicalVerticalInsets && styles\.canonicalHeaderDescription/);
  assert.equal(style("InnerSpaceCard", "headerTitle").fontSize, 16, "Home keeps its existing text size");
});

test("Home forwards the opt-in title/insets and subtracts the selected card margin for both measurements", () => {
  const home = source("../components/HomeReflectionWallSection.tsx");
  assert.match(home, /sectionTitle\?: string/);
  assert.match(home, /canonicalVerticalInsets\?: boolean/);
  assert.match(home, /const bottomMargin = canonicalVerticalInsets \? 0 : INNER_SPACE_CARD_BOTTOM_MARGIN/);
  assert.equal((home.match(/- bottomMargin/g) ?? []).length, 2);
  assert.match(home, /sectionTitle=\{sectionTitle\}/);
  assert.match(home, /canonicalVerticalInsets=\{canonicalVerticalInsets\}/);
});

test("wall composer grows 40px and lowers the category row 15px in normal flow", () => {
  assert.equal(style("InnerSpaceCard", "input").minHeight, 53 + 40);
  assert.equal(style("InnerSpaceCard", "categoriesMask").marginTop, 15);
  assert.equal(style("InnerSpaceCard", "categoriesMask").marginBottom, 20);
  assert.equal(style("InnerSpaceCard", "inputContainer").paddingBottom, 34);
  const card = source("../components/InnerSpaceCard.tsx");
  assert.ok(card.indexOf("style={styles.categoriesMask}") < card.indexOf("styles.inputContainer"));
  assert.match(card, /updateContentHeight\(18 \+ y \+ height\)/);
});

test("wall character counter renders the current length at the lower-right without taking input space", () => {
  const card = source("../components/InnerSpaceCard.tsx");
  const ast = ts.createSourceFile("InnerSpaceCard.tsx", card, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let counter: ts.JsxElement | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(ast) === "Text"
      && node.getText(ast).includes('testID="reflection-character-count"')) counter = node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(counter);
  const counterStyle = style("InnerSpaceCard", "characterCounter");
  assert.equal(counterStyle.position, "absolute");
  assert.equal(counterStyle.right, 12);
  assert.equal(counterStyle.bottom, 10);
  const compiled = ts.transpileModule(`return (${counter.getText(ast)});`, {
    compilerOptions: { jsx: ts.JsxEmit.React },
  }).outputText;
  const render = new Function("React", "Text", "message", "styles", "colors", compiled);
  for (const length of [0, 17, 300]) {
    const element = render(React, () => null, "x".repeat(length),
      { characterCounter: counterStyle }, { mutedForeground: "#AAA" });
    assert.equal(element.props.children.join(""), `${length}/300`);
    assert.equal(element.props.pointerEvents, "none");
  }
  assert.match(card, /maxLength=\{300\}/);
});

test("selected wall categories use black at 28%, the wall border and the stable bold label", () => {
  const card = source("../components/InnerSpaceCard.tsx");
  const ast = ts.createSourceFile("InnerSpaceCard.tsx", card, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let chip: ts.JsxElement | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(ast) === "Pressable"
      && node.getText(ast).includes('testID={`category-${cat.id}`}')) chip = node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(chip);
  const selectedStyle = style("InnerSpaceCard", "selectedGridItem");
  assert.equal(selectedStyle.backgroundColor, "rgba(0,0,0,0.16)");
  assert.equal(selectedStyle.borderColor, "transparent");
  assert.equal(selectedStyle.opacity, undefined);
  assert.equal(selectedStyle.fontWeight, undefined);
  const compiled = ts.transpileModule(`return (${chip.getText(ast)});`, {
    compilerOptions: { jsx: ts.JsxEmit.React },
  }).outputText;
  const render = new Function("React", "Pressable", "ReflectionCategoryTabBorder", "ReflectionCategoryTabLabel",
    "cat", "category", "styles", "toggleCategory", compiled);
  const styles = {
    gridItem: style("InnerSpaceCard", "gridItem"),
    selectedGridItem: selectedStyle,
    gridLabel: style("InnerSpaceCard", "gridLabel"),
    pressedCategory: style("InnerSpaceCard", "pressedCategory"),
  };
  for (const cat of [{ id: "gratitude", label: "Gratitud", color: "#F075B3" },
    { id: "calm", label: "Calma", color: "#50AFB0" },
    { id: "custom", label: "Editorial", color: "#477FBD" }]) {
    const active = render(React, () => null, () => null, () => null, cat, cat.id, styles, () => {});
    assert.equal(Object.assign({}, ...active.props.style({ pressed: false })).backgroundColor, "rgba(0,0,0,0.16)");
    assert.ok(active.props.children[0], "selected tab has the shared wall border");
    assert.equal(active.props.children[0].props.color, cat.color);
    assert.equal(active.props.children[1].props.selected, true);
    assert.equal(active.props.accessibilityState.selected, true);
    const inactive = render(React, () => null, () => null, () => null, cat, null, styles, () => {});
    assert.equal(inactive.props.children[0], false, "inactive tab does not gain a gradient border");
    assert.equal(inactive.props.children[1].props.selected, false);
    assert.equal(active.props.children[1].props.textStyle, inactive.props.children[1].props.textStyle);
  }
});

test("Perfil replays the existing saved banner after every successful save and Ver opens the wall above the tab bar", () => {
  const profile = source("../components/ProfileScreenBase.tsx");
  const ast = ts.createSourceFile("ProfileScreenBase.tsx", profile, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let trigger: ts.VariableDeclaration | undefined;
  let handler: ts.VariableDeclaration | undefined;
  let bottom: ts.VariableDeclaration | undefined;
  let wall: ts.JsxSelfClosingElement | undefined;
  let banner: ts.JsxExpression | undefined;
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node)) {
      if (node.name.getText(ast) === "[profileReflectionSavedTrigger, setProfileReflectionSavedTrigger]") trigger = node;
      if (node.name.getText(ast) === "handleProfileReflectionSaved") handler = node;
      if (node.name.getText(ast) === "profileReflectionBannerBottom") bottom = node;
    }
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === "ProfileReflectionWallSection") wall = node;
    if (ts.isJsxExpression(node) && node.expression?.getText(ast).startsWith("dedicated &&")
      && node.expression.getText(ast).includes("<ReflectionSavedBanner")) banner = node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(trigger && handler && bottom && wall && banner);
  assert.ok(profile.indexOf(banner.getText(ast)) > profile.lastIndexOf("</KeyboardAwareScrollViewCompat>"));
  const compiled = ts.transpileModule(`
    function Surface(dedicated) {
      const ${trigger.getText(ast)};
      const ${handler.getText(ast)};
      const ${bottom.getText(ast)};
      const profileWallRef = { current: null }, profileScrollRef = { current: null };
      const setProfileWallCardHeight = () => {};
      const PROFILE_SECTION_GAP = 21;
      const getProfileScrollY = () => 0, setProfileWallComposing = () => {};
      return <>${wall.getText(ast)}${banner.getText(ast)}</>;
    }
  `, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;
  let count = 0;
  let route = "";
  const Surface = new Function("React", "useState", "useCallback", "Platform", "insets", "router",
    "ProfileReflectionWallSection", "ReflectionSavedBanner", `${compiled}; return Surface;`)(
      React,
      () => [count, (update: (current: number) => number) => { count = update(count); }],
      (callback: () => void) => callback,
      { OS: "ios" }, { bottom: 34 },
      { push: (next: string) => { route = next; } },
      () => null, () => null,
    );
  const first = Surface(true).props.children;
  assert.equal(first[1].props.trigger, 0);
  first[0].props.onMessageSaved();
  const second = Surface(true).props.children;
  assert.equal(second[1].props.trigger, 1);
  assert.equal(second[1].props.bottom, 58 + 34 + 15);
  second[0].props.onMessageSaved();
  assert.equal(Surface(true).props.children[1].props.trigger, 2);
  second[1].props.onPress();
  assert.equal(route, "/mi-espacio-interior");
  assert.equal(Surface(false).props.children[1], false);
});

test("saving failures cannot trigger the registered-message banner", () => {
  const card = source("../components/InnerSpaceCard.tsx");
  const ast = ts.createSourceFile("InnerSpaceCard.tsx", card, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let success = "", error = "";
  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(ast) === "onSuccess") success = node.initializer.getText(ast);
    if (ts.isPropertyAssignment(node) && node.name.getText(ast) === "onError") error = node.initializer.getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.match(success, /onMessageSaved\?\.\(\)/);
  assert.match(error, /setSaveError/);
  assert.doesNotMatch(error, /onMessageSaved/);
  assert.match(source("../components/HomeReflectionWallSection.tsx"), /onMessageSaved=\{onMessageSaved\}/);
});

test("Profile wrapper forwards composer inputs/ref, uses the profile heading and keeps its 21px outer gap", () => {
  const wrapperSource = source("../components/ProfileReflectionWallSection.tsx");
  const compiled = ts.transpileModule(wrapperSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  }).outputText;
  const mocks = {
    react: React,
    "react-native": { StyleSheet: { create: (styles: unknown) => styles }, View: "view", Text: "text" },
    "@/hooks/useColors": { useColors: () => ({ foreground: "#F9F9F9" }) },
    "@/components/HomeReflectionWallSection": { HomeReflectionWallSection: () => null },
  };
  const module = { exports: {} as Record<string, any> };
  new Function("require", "module", "exports", compiled)(
    (name: string) => {
      if (!(name in mocks)) throw new Error(`Missing test mock: ${name}`);
      return mocks[name as keyof typeof mocks];
    },
    module,
    module.exports,
  );

  const scrollRef = { current: null };
  const getScrollY = () => 47;
  const onComposingChange = (_composing: boolean) => {};
  let savedCount = 0;
  const onMessageSaved = () => { savedCount++; };
  const forwardedHandle = { current: null };
  const suppliedStyle = { marginTop: 9 };
  const wrapper = module.exports.ProfileReflectionWallSection.render({
    scrollRef,
    getScrollY,
    onComposingChange,
    onMessageSaved,
    style: suppliedStyle,
  }, forwardedHandle) as React.ReactElement<Record<string, any>>;
  const [heading, element] = wrapper.props.children as React.ReactElement<Record<string, any>>[];
  assert.equal(heading.props.children, "Mi muro expansivo");
  assert.equal(heading.props.style[0].marginBottom, 15);

  assert.deepEqual(wrapper.props.style, [{ marginTop: 0, marginBottom: 21 }, suppliedStyle]);
  const profileSource = source("../components/ProfileScreenBase.tsx");
  assert.match(profileSource, /const PROFILE_SECTION_GAP = 21;/);
  assert.match(profileSource, /profileProgressSection:\s*\{[^}]*marginBottom: PROFILE_SECTION_GAP/);
  assert.equal(element.props.scrollRef, scrollRef);
  assert.equal(element.props.getScrollY, getScrollY);
  assert.equal(element.props.onComposingChange, onComposingChange);
  assert.equal(element.props.sectionTitle, undefined);
  assert.equal(element.props.profileVariant, true);
  assert.equal(element.props.canonicalVerticalInsets, true);
  assert.equal(element.props.ref, forwardedHandle);
  assert.equal(element.props.style, undefined, "the gap sits outside the measured Home section");
  assert.equal(typeof element.props.onMessageSaved, "function");
  assert.equal(element.props.onMessageSaved, onMessageSaved);
  element.props.onMessageSaved();
  assert.equal(savedCount, 1);
});