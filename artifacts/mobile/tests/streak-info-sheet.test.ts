import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { SCENE_THEMES } from "../config/scene-themes.ts";
import { MEMBERSHIP_AURORA, STREAK_INFO_COLORS } from "../constants/colors.ts";

type Props = {
  children?: React.ReactNode;
  style?: unknown;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  onPress?: () => void;
  accessibilityState?: { expanded?: boolean };
  colors?: string[];
  locations?: number[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  name?: string;
  color?: string;
  size?: number;
  replayKey?: string;
  source?: unknown;
  contentContainerStyle?: unknown;
  bounces?: boolean;
  alwaysBounceVertical?: boolean;
  overScrollMode?: string;
};
const flatten = (style: unknown): Record<string, any> => Array.isArray(style)
  ? Object.assign({}, ...style.map(flatten))
  : style && typeof style === "object" ? style as Record<string, any> : {};
const source = readFileSync(new URL("../components/StreakInfoSheet.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;

function harness({
  theme = SCENE_THEMES.indigo2,
  platform = "ios",
  width = 375,
  fontScale = 1,
} = {}) {
  const states: unknown[] = [], refs: unknown[] = [], scrolls: unknown[] = [];
  let stateIndex = 0, refIndex = 0, previousDeps: unknown[] | undefined;
  let modal: { animationType: string; onRequestClose: () => void; statusBarTranslucent: boolean; navigationBarTranslucent: boolean } | undefined;
  let closeButton: (() => void) | undefined;
  let closes = 0;
  const nodes = new Map<string, Props>();
  const toggles = new Map<string, () => void>();
  const toggleState = new Map<string, any>();
  const Native = ({ children, style, testID, accessibilityLabel, accessibilityRole, onPress, accessibilityState, name, color, size, replayKey, contentContainerStyle, bounces, alwaysBounceVertical, overScrollMode }: Props) => {
    if (testID) nodes.set(testID, { children, style, contentContainerStyle, bounces, alwaysBounceVertical, overScrollMode });
    if (testID === "streak-info-close") closeButton = onPress;
    if (testID?.startsWith("streak-info-toggle-")) toggles.set(testID, onPress!);
    if (testID?.startsWith("streak-info-toggle-")) toggleState.set(testID, accessibilityState);
    const resolved = flatten(style);
    return React.createElement("div", {
      "data-testid": testID,
      "data-label": accessibilityLabel,
      "data-role": accessibilityRole,
      "data-icon": name,
      "data-color": color,
      "data-size": size,
      "data-background": resolved.backgroundColor,
      "data-height": resolved.height,
      "data-padding-top": resolved.paddingTop,
      "data-padding-bottom": flatten(contentContainerStyle).paddingBottom,
      "data-margin-top": resolved.marginTop,
      "data-border-width": resolved.borderWidth,
      "data-replay": replayKey,
    }, children);
  };
  const Gradient = ({ colors, locations, start, end, ...props }: Props) =>
    React.createElement("div", {
      "data-gradient": colors?.join("|"),
      "data-gradient-locations": locations?.join("|"),
      "data-gradient-start": JSON.stringify(start),
      "data-gradient-end": JSON.stringify(end),
    }, React.createElement(Native, props));
  const imports: Record<string, unknown> = {
    react: {
      ...React,
      useState(initial: unknown) {
        const index = stateIndex++;
        if (!(index in states)) states[index] = initial;
        return [states[index], (next: any) => { states[index] = typeof next === "function" ? next(states[index]) : next; }];
      },
      useRef() {
        return refs[refIndex++] ??= { current: { scrollTo: (position: unknown) => scrolls.push(position) } };
      },
      useEffect(effect: () => void, deps: unknown[]) {
        if (!previousDeps || deps.some((value, index) => !Object.is(value, previousDeps![index]))) {
          previousDeps = deps;
          effect();
        }
      },
    },
    "react-native": {
      Modal: (props: typeof modal & Props) => { modal = props; return React.createElement(Native, props); },
      Platform: { OS: platform },
      Pressable: Native, ScrollView: Native, Text: Native, View: Native,
      useWindowDimensions: () => ({ width, fontScale }),
      StyleSheet: { create: (value: unknown) => value, absoluteFill: {} },
    },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 24, bottom: 20 }) },
    "expo-image": { Image: (props: Props) => { assert.ok(props.source); return React.createElement("img", { alt: "Cielo y montañas sobre el lago" }); } },
    "expo-linear-gradient": { LinearGradient: Gradient },
    "@expo/vector-icons": { Feather: Native, MaterialCommunityIcons: Native },
    "@react-native-masked-view/masked-view": Native,
    "@/components/CinematicFadeSlide": { CinematicFadeSlide: Native },
    "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme }) },
    "@/constants/colors": { MEMBERSHIP_AURORA, STREAK_INFO_COLORS },
    "../assets/images/streak-practice-landscape.jpg": 1,
  };
  const module: any = { exports: {} };
  new Function("require", "module", "exports", compiled)((name: string) => {
    assert.ok(name in imports, `Missing sheet mock: ${name}`);
    return imports[name];
  }, module, module.exports);
  return {
    scrolls,
    nodes,
    toggles,
    toggleState,
    render(visible: boolean) {
      stateIndex = 0; refIndex = 0;
      const tree = module.exports.StreakInfoSheet({ visible, onClose: () => closes++ });
      return tree ? renderToStaticMarkup(tree) : "";
    },
    get modal() { return modal; },
    get closeButton() { return closeButton; },
    get closes() { return closes; },
  };
}

test("streak sheet is hidden when closed and has exactly four ordered explanatory cards when open", () => {
  const h = harness();
  assert.equal(h.render(false), "");
  const html = h.render(true);
  assert.equal((html.match(/data-testid="streak-info-card-/g) ?? []).length, 4);
  const ids = ["current", "accumulated", "longest", "completed"].map(id => html.indexOf(`streak-info-card-${id}`));
  assert.ok(ids.every((position, index) => position >= 0 && (index === 0 || position > ids[index - 1])));
  assert.doesNotMatch(html, /Tipos de rachas|Tu camino de práctica/);
  assert.match(html, /data-role="header">Sistema de rachas/);
  assert.match(html, /data-label="Cerrar sistema de rachas"/);
  assert.match(html, /data-icon="x" data-color="#F9F9F9" data-size="23"/);
  assert.doesNotMatch(html, /data-icon="arrow-left"/);
  assert.match(html, /Existen diferentes tipos de rachas que te muestran tu compromiso/);
  for (const description of []) void description;
  for (const description of [
    "Días activos de esta semana, no necesariamente consecutivos.",
    "Total de días que has sumado de racha desde que comenzaste",
    "Tu mejor secuencia de dias de racha consecutiva en la App",
    "Semanas de lunes a domingo en las que completaste los 7 días activos",
  ]) assert.ok(!html.includes(description), "collapsed by default");
  assert.match(html, /al escuchar al menos 3 minutos o completar una sesión/);
  assert.doesNotMatch(html, /<img|streak-info-artwork/);
  assert.doesNotMatch(source, /HERO_IMAGE|expo-image|styles\.artwork/);
});

test("UI close and Android back return to the parent; reopening resets scroll and entrance keys", () => {
  const h = harness({ platform: "android" });
  h.render(true);
  const first = h.render(true);
  assert.equal(h.modal?.animationType, "slide");
  h.closeButton!();
  assert.equal(h.closes, 1);
  assert.equal(h.render(false), "");
  h.render(true);
  const reopened = h.render(true);
  assert.notEqual(first.match(/data-replay="hero:\d+"/)?.[0], reopened.match(/data-replay="hero:\d+"/)?.[0]);
  assert.deepEqual(h.scrolls, [{ y: 0, animated: false }, { y: 0, animated: false }]);
  h.modal!.onRequestClose();
  assert.equal(h.closes, 2);
  assert.equal(h.render(false), "");
});

test("sheet uses all gradient colors, locations and direction from every theme and preserves the four profile icon meanings", () => {
  for (const theme of Object.values(SCENE_THEMES)) {
    const html = harness({ theme }).render(true);
    assert.ok(html.includes(`data-gradient="${theme.gradient.join("|")}"`));
    if (theme.gradientLocations) assert.ok(html.includes(`data-gradient-locations="${theme.gradientLocations.join("|")}"`));
    if (theme.gradientStart) assert.ok(html.includes(`data-gradient-start="${JSON.stringify(theme.gradientStart).replace(/"/g, "&quot;")}"`));
    if (theme.gradientEnd) assert.ok(html.includes(`data-gradient-end="${JSON.stringify(theme.gradientEnd).replace(/"/g, "&quot;")}"`));
    assert.match(html, /data-icon="spa" data-color="#F9F9F9" data-size="26"/);
    assert.ok(html.includes(`data-icon="spa" data-color="${MEMBERSHIP_AURORA.premium.accent}" data-size="26"`));
    assert.match(html, /data-icon="image-filter-hdr" data-color="#F9F9F9" data-size="26"/);
    assert.match(html, /data-icon="check-circle" data-color="#F9F9F9" data-size="24"/);
  }
});

test("cards are exactly 50px after the description in normal flow, with black 16-percent backgrounds and no borders", () => {
  const h = harness();
  h.render(true);
  assert.equal(flatten(h.nodes.get("streak-info-description")!.style).paddingTop, 56);
  assert.equal(flatten(h.nodes.get("streak-info-cards")!.style).marginTop, 50);
  for (const id of ["current", "accumulated", "longest", "completed"]) {
    const style = flatten(h.nodes.get(`streak-info-card-${id}`)!.style);
    assert.equal(style.backgroundColor, "rgba(0,0,0,0.16)");
    assert.equal(style.borderWidth ?? 0, 0);
    assert.equal(style.borderColor, undefined);
  }
  const heroStyle = flatten(h.nodes.get("streak-info-hero")!.style);
  assert.equal(heroStyle.height, undefined);
  assert.equal(heroStyle.minHeight, undefined);
});

const IDS = ["current", "accumulated", "longest", "completed"];
const DESCS = [
  "Días activos de esta semana, no necesariamente consecutivos.",
  "Total de días que has sumado de racha desde que comenzaste",
  "Tu mejor secuencia de dias de racha consecutiva en la App",
  "Semanas de lunes a domingo en las que completaste los 7 días activos",
];

test("four horizontal cards separated by 15px with icon left, title, chevron right and no icon background", () => {
  const h = harness();
  h.render(true);
  assert.equal(flatten(h.nodes.get("streak-info-cards")!.style).gap, 15);
  assert.equal([...h.nodes.keys()].filter(id => id.startsWith("streak-info-row-")).length, 0);
  for (const id of IDS) {
    const card = h.nodes.get(`streak-info-card-${id}`)!;
    const [header] = React.Children.toArray(card.children) as React.ReactElement<Props>[];
    assert.equal(flatten(header.props.style).flexDirection, "row");
    const [icon, title, toggle] = React.Children.toArray(header.props.children) as React.ReactElement<Props>[];
    assert.equal(icon.props.testID, `streak-info-icon-${id}`);
    assert.equal(flatten(icon.props.style).backgroundColor, undefined);
    assert.equal(flatten(title.props.style).flex, 1);
    assert.equal(flatten(title.props.style).fontSize, 14);
    assert.equal(toggle.props.testID, `streak-info-toggle-${id}`);
    assert.equal(toggle.props.accessibilityRole, "button");
  }
  assert.match(h.render(true), /data-icon="chevron-down"/);
});

test("each chevron toggles only its own description and expanded state; close/reopen resets", () => {
  const h = harness();
  h.render(true);
  for (const [i, id] of IDS.entries()) {
    assert.equal(h.toggleState.get(`streak-info-toggle-${id}`).expanded, false);
    assert.ok(!h.render(true).includes(`data-testid="streak-info-divider-${id}"`));
    h.toggles.get(`streak-info-toggle-${id}`)!();
    const html = h.render(true);
    assert.ok(html.includes(DESCS[i]));
    const divider = flatten(h.nodes.get(`streak-info-divider-${id}`)!.style);
    const description = flatten(h.nodes.get(`streak-info-desc-${id}`)!.style);
    assert.equal(divider.marginTop, 10);
    assert.equal(divider.height, 1);
    assert.equal(divider.backgroundColor, "rgba(255,255,255,0.1)");
    assert.equal(description.textAlign, "left");
    assert.equal(description.marginTop, 16);
    assert.equal(divider.marginTop + divider.height + description.marginTop, 12 + 15);
    assert.equal(h.toggleState.get(`streak-info-toggle-${id}`).expanded, true);
    assert.match(html, /data-icon="chevron-up"/);
    h.toggles.get(`streak-info-toggle-${id}`)!();
    assert.ok(!h.render(true).includes(DESCS[i]));
    assert.ok(!h.render(true).includes(`data-testid="streak-info-divider-${id}"`));
  }
  h.toggles.get("streak-info-toggle-longest")!();
  assert.ok(h.render(true).includes(DESCS[2]));
  h.render(false);
  const reopened = h.render(true);
  for (const d of DESCS) assert.ok(!reopened.includes(d));
});

test("intro description matches Tu camino screen intro typography (GrowthJourneySheet introText)", () => {
  const h = harness();
  const html = h.render(true);
  assert.ok(html);
  const growth = readFileSync(new URL("../components/GrowthJourneySheet.tsx", import.meta.url), "utf8");
  const m = growth.match(/introText:\s*(\{[^}]*\})/)!;
  const exp = new Function(`return (${m[1]});`)();
  const m2 = source.match(/subtitle:\s*(\{[\s\S]*?\n  \})/)!;
  const act = new Function("STREAK_INFO_COLORS", `return (${m2[1]});`)(STREAK_INFO_COLORS);
  for (const k of ["fontFamily", "fontSize", "fontWeight", "lineHeight"]) assert.equal(act[k], exp[k], k);
  assert.equal(act.textAlign, "left");
  const footnote = source.match(/footnote:\s*(\{[\s\S]*?\n  \})/)!;
  assert.equal(new Function("STREAK_INFO_COLORS", `return (${footnote[1]});`)(STREAK_INFO_COLORS).textAlign, "left");
  assert.equal(flatten(h.nodes.get("streak-info-description")!.style).alignItems, "stretch");
});

test("sheet scrolls edge to edge without fixed headers or footers, retaining content-only safe insets and natural text scaling", () => {
  const h = harness({ width: 320 });
  const native = h.render(true);
  for (const id of ["streak-info-background", "streak-info-hero"]) {
    const style = flatten(h.nodes.get(id)!.style);
    assert.equal(style.paddingTop ?? 0, 0);
    assert.equal(style.paddingBottom ?? 0, 0);
  }
  assert.equal(h.modal?.statusBarTranslucent, true);
  assert.equal(h.modal?.navigationBarTranslucent, true);
  assert.match(native, /data-padding-top="48"/);
  assert.match(native, /data-padding-bottom="48"/);
  const web = harness({ platform: "web" }).render(true);
  assert.match(web, /data-padding-top="75"/);
  assert.match(web, /data-padding-bottom="62"/);
  assert.doesNotMatch(source, /styles\.title|styles\.headerLabel|styles\.footer|numberOfLines=/);
  assert.match(source, /contentInsetAdjustmentBehavior="never"/);
  assert.doesNotMatch(source, /withRepeat|setInterval/);
});

test("Perfil connects the information locally while preserving its weekly navigation", () => {
  const profile = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(profile, /onStreakHistoryPress=\{\(\) => setStreakInfoOpen\(true\)\}/);
  assert.match(profile, /onStreakTitlePress=\{\(\) => router\.push\("\/progreso" as never\)\}/);
  assert.match(profile, /StreakInfoSheet visible=\{streakInfoOpen\} onClose=\{\(\) => setStreakInfoOpen\(false\)\}/);
  assert.match(profile, /useFocusEffect\(useCallback\(\(\) => \(\) => setStreakInfoOpen\(false\), \[\]\)\)/);
  assert.doesNotMatch(profile, /router\.push\("\/tipos-de-rachas/);
});

test("vertical overscroll remains enabled at both ends after removing the hero image without shifting content", () => {
  const h = harness();
  h.render(true);
  const scroll = h.nodes.get("streak-info-scroll")!;
  assert.equal(scroll.bounces, true);
  assert.equal(scroll.alwaysBounceVertical, true);
  assert.equal(scroll.overScrollMode, "always");
  assert.equal(h.nodes.has("streak-info-artwork"), false);
  assert.equal(flatten(h.nodes.get("streak-info-cards")!.style).marginTop, 50);
  assert.equal(flatten(h.nodes.get("streak-info-hero")!.style).top, undefined);
});

test("Sistema de rachas title matches Historial typography", () => {
  const h = harness();
  h.render(true);
  const actual = flatten(h.nodes.get("streak-info-title")!.style);
  const historySource = readFileSync(new URL("../app/historial.tsx", import.meta.url), "utf8");
  const historyTitle = historySource.match(/stickyTitleLibraryTab:\s*(\{[^}]*\})/);
  assert.ok(historyTitle);
  const expected = new Function(`return (${historyTitle[1]});`)();
  for (const key of ["fontFamily", "fontSize", "lineHeight", "fontWeight", "letterSpacing", "color", "textAlign"]) {
    assert.equal(actual[key], expected[key], key);
  }
});