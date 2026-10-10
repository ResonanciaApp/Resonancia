import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { getThemeStyleId } from "../config/scene-themes.ts";
import {
  CLOUDY_GROWTH_DAY_PILL_BACKGROUND,
  CLOUDY_GROWTH_STAGE_LABEL_COLOR,
  MEMBERSHIP_AURORA,
  POSITIONED_DAY_GRADIENT,
} from "../constants/colors.ts";

const source = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("growth.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declarations: string[] = [];
let imageDeclaration = "";
let stylesExpression = "";
let colorsExpression = "";
function visit(node: ts.Node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === "GrowthLevelImage") {
    imageDeclaration = node.getText(ast).replace(/^export /, "");
  }
  if (ts.isFunctionDeclaration(node) && ["GrowthRow", "GrowthTimeline", "GrowthStageHeading", "GrowthCurrentStagePill"].includes(node.name?.text ?? "")) {
    declarations.push(node.getText(ast).replace(/^export /, ""));
  }
  if (ts.isVariableDeclaration(node) && node.initializer) {
    if (node.name.getText(ast) === "styles" && ts.isCallExpression(node.initializer)) stylesExpression = node.initializer.arguments[0].getText(ast);
    if (node.name.getText(ast) === "GROWTH_COLORS") colorsExpression = node.initializer.getText(ast);
  }
  ts.forEachChild(node, visit);
}
visit(ast);
const compile = (code: string) => ts.transpileModule(code, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
}).outputText;
const growthColors = new Function("POSITIONED_DAY_GRADIENT", "MEMBERSHIP_AURORA", compile(`return ${colorsExpression};`))(POSITIONED_DAY_GRADIENT, MEMBERSHIP_AURORA);
const styles = new Function("GROWTH_COLORS", "GROWTH_ROW_HEIGHT", "GROWTH_STAGE_ICON_SIZE", "GROWTH_BLOOM_ART_SIZE", `return ${stylesExpression};`)(growthColors, 205, 133, 137);
const flat = (value: any): any => Array.isArray(value) ? Object.assign({}, ...value.map(flat)) : value ?? {};
let themeId = "natural";
let nodes: any[] = [];
const Native = (props: any) => {
  nodes.push({ ...props, style: flat(props.style) });
  return React.createElement("div", null, props.children);
};
const env = {
  React, View: Native, Text: Native, Pressable: Native, MaterialCommunityIcons: Native,
  styles, GROWTH_COLORS: growthColors, GROWTH_ROW_HEIGHT: 205,
  CLOUDY_GROWTH_DAY_PILL_BACKGROUND, CLOUDY_GROWTH_STAGE_LABEL_COLOR, getThemeStyleId,
  useColors: () => ({ foreground: "#F9F9F9", mutedForeground: "#C4C4C4" }),
  useSceneTheme: () => ({ theme: { id: themeId, gradient: ["#123456", "#654321"] } }),
  useGrowth: () => ({ currentStage: { name: "Crecimiento" }, progress: { grantedRewards: [] } }),
  getPositionedDayGradient: (gradient: string[]) => gradient,
  GrowthLevelImage: Native, RewardLock: Native,
};
const components = new Function(...Object.keys(env), compile(`${declarations.join("\n")}; return { GrowthRow, GrowthTimeline, GrowthStageHeading, GrowthCurrentStagePill };`))(...Object.values(env));
const render = (component: any, props: any = {}) => {
  nodes = [];
  renderToStaticMarkup(React.createElement(component, props));
};
const level = {
  id: "crecimiento", name: "Crecimiento", story: "Una etapa", startDay: 16, endDay: 30,
  rewards: [1, 2, 3].map(id => ({ id: `reward-${id}`, enabled: true, amount: 5, text: "Desbloquea {cantidad} avatares" })),
};

test("Florecimiento keeps its larger title and one-line description, with the first world up another 5px and description up another 4px", () => {
  const description = "Cultiva tu calma cada día.";
  render(components.GrowthStageHeading, {
    eyebrow: "PRIMER MUNDO", title: "Florecimiento", description,
  });
  const heading = nodes.find(node => node.testID === "growth-first-world-heading");
  const copy = nodes.find(node => node.testID === "growth-world-description");
  assert.equal(heading.style.marginTop, 0);
  assert.equal(heading.style.position, undefined);
  assert.equal(copy.children, description);
  assert.equal(copy.children.split("\n").length, 1);
  assert.equal(copy.style.width, "70%");
  assert.equal(copy.style.alignSelf, "center");
  assert.equal(copy.style.textAlign, "center");
  assert.equal(copy.numberOfLines, 1);
  assert.equal(copy.style.fontSize, 12);
  assert.equal(copy.style.marginTop, 5);
  assert.equal(nodes.find(node => node.children === "Florecimiento").style.fontSize, 27);
  assert.equal(nodes.find(node => node.children === "Florecimiento").style.lineHeight, 30);
  assert.ok(nodes.findIndex(node => node.children === "Florecimiento") < nodes.indexOf(copy));
  assert.match(source, /title=\{world\.name\}\s+description=\{world\.description\}/);
  render(components.GrowthStageHeading, { eyebrow: "SEGUNDO MUNDO", title: "El ascenso", second: true });
  assert.equal(nodes.find(node => node.testID === "growth-second-world-heading").style.marginTop, undefined);
  assert.equal(nodes.find(node => node.children === "El ascenso").style.fontSize, 23);
  assert.equal(nodes.some(node => node.testID === "growth-world-description"), false);
});

test("Natural replaces only the Cloudy blue accents, preserving pill and line transparency", () => {
  for (const id of ["natural", "cloudy", "indigo2", "pleyades"]) {
    themeId = id;
    const cloudyFamily = ["natural", "cloudy"].includes(id);
    const expectedPill = id === "natural" ? "rgba(229,255,219,0.20)" : id === "cloudy" ? CLOUDY_GROWTH_DAY_PILL_BACKGROUND : styles.dayPill.backgroundColor;
    for (const eyebrow of ["PRIMER MUNDO", "SEGUNDO MUNDO"]) {
      render(components.GrowthStageHeading, { eyebrow, title: "Etapa" });
      assert.equal(nodes.find(node => node.children === eyebrow).style.color, id === "natural" ? "#E5FFDB" : id === "cloudy" ? CLOUDY_GROWTH_STAGE_LABEL_COLOR : styles.sectionEyebrow.color);
    }
    render(components.GrowthCurrentStagePill);
    assert.equal(nodes.find(node => node.testID === "profile-growth-stage-pill").style.backgroundColor, expectedPill);
    for (const status of ["current", "reached", "locked"]) {
      render(components.GrowthRow, { level, status, florecimiento: true });
      const node = nodes.find(node => node.testID === "crecimiento-stage-node").style;
      assert.equal(node.borderColor, id === "natural" ? "#E5FFDB" : id === "cloudy" ? "#B5EFFF" : growthColors.activeNode);
      assert.equal(node.backgroundColor, status === "locked" ? (id === "natural" ? "rgba(229,255,219,0.28)" : id === "cloudy" ? "rgba(181,239,255,0.28)" : growthColors.inactiveLine) : node.borderColor);
      assert.ok(nodes.some(node => node.style.borderRadius === 12 && node.style.backgroundColor === expectedPill));
    }
    render(components.GrowthTimeline, { children: [React.createElement("div", { key: "one" }), React.createElement("div", { key: "two" })] });
    assert.equal(nodes.find(node => node.testID === "growth-timeline-line").style.backgroundColor, cloudyFamily ? (id === "natural" ? "rgba(229,255,219,0.28)" : "rgba(181,239,255,0.28)") : styles.lineBase.backgroundColor);
  }
});

test("each stage moves its image 10px right, pushes copy 10px and moves summary and rewards another 10px without vertical changes", () => {
  for (const id of ["natural", "cloudy", "indigo2", "pleyades"]) {
    themeId = id;
    for (const florecimiento of [true, false]) {
      for (const status of ["current", "reached", "locked"]) {
        render(components.GrowthRow, { level, status, florecimiento });
        const art = nodes.find(node => node.testID === "crecimiento-stage-art").style;
        const summary = nodes.find(node => node.testID === "crecimiento-stage-summary").style;
        assert.deepEqual(art.transform, [{ translateX: -5 }]);
        assert.deepEqual(summary.transform, [{ translateX: -20 }]);
        assert.equal(art.top, florecimiento ? 32 : 34);
        assert.equal(art.left, florecimiento ? 38 : 40);
        assert.equal(nodes.find(node => node.testID === "crecimiento-stage-node").style.left, 1);
        assert.equal(nodes.find(node => node.testID === "crecimiento-copy").style.marginLeft, 206);
        for (const lock of nodes.filter(node => node.levelId === level.id)) {
          assert.equal(lock.color, "#F9F9F9");
          assert.equal(lock.size, 14);
        }
        assert.equal(nodes.find(node => node.level === level).attenuated, status !== "locked");
        for (const reward of nodes.filter(node => /^crecimiento-reward(?:-reward-\d)?$/.test(node.testID ?? ""))) {
          assert.deepEqual(reward.style.transform, [{ translateY: -4 }, { translateX: -20 }]);
        }
      }
    }
  }
});

test("active-stage attenuation is a 10% black image overlay preserving transparency; locked images and other surfaces stay unchanged", () => {
  const GrowthLevelImage = new Function(
    "React", "useState", "useEffect", "Platform", "growthImageUris", "resolveAvatarUrl", "View", "Image", "styles",
    compile(`${imageDeclaration}; return GrowthLevelImage;`),
  )(
    React, (initial: any) => [typeof initial === "function" ? initial() : initial], () => {},
    { OS: "web" }, new Map(), (uri: string) => uri, Native, Native, styles,
  );
  const illustratedLevel = { ...level, group: "florecimiento", image: "https://example.com/stage.png" };
  render(GrowthLevelImage, { level: illustratedLevel, attenuated: true });
  const overlay = nodes.find(node => node.testID === "crecimiento-active-art-overlay");
  assert.ok(overlay);
  assert.deepEqual(overlay.source, { uri: illustratedLevel.image });
  assert.equal(overlay.style.tintColor, "#000000");
  assert.equal(overlay.style.opacity, 0.1);
  assert.equal(overlay.style.backgroundColor, undefined);
  assert.equal(overlay.style.position, "absolute");
  assert.deepEqual(overlay.style.transform, [{ scale: 0.9 }]);
  assert.equal(overlay.pointerEvents, "none");
  for (const props of [{}, { profilePreview: true }, { attenuated: true, dimmed: true }]) {
    render(GrowthLevelImage, { level: illustratedLevel, ...props });
    assert.equal(nodes.some(node => node.testID === "crecimiento-active-art-overlay"), false);
  }
});

test("two or three avatar lock rows have exactly 7px between contents in every theme and status", () => {
  for (const id of ["natural", "cloudy", "indigo2", "pleyades"]) {
    themeId = id;
    for (const status of ["current", "reached", "locked"]) {
      for (const count of [2, 3]) {
        render(components.GrowthRow, { level: { ...level, rewards: level.rewards.slice(0, count) }, status, florecimiento: true });
        const rows = nodes.filter(node => /^crecimiento-reward(?:-reward-\d)?$/.test(node.testID ?? ""));
        assert.equal(rows.length, count);
        assert.equal(rows[0].style.marginTop + rows[0].style.transform[0].translateY, 15, "preserves first lock position");
        for (const row of rows) {
          assert.equal(row.style.minHeight, 16);
          assert.equal(row.style.paddingVertical, 0);
        }
        for (const row of rows.slice(1)) assert.equal(row.style.marginTop, 7);
      }
    }
  }
});
