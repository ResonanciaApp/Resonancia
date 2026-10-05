import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

import { dailyQuoteMessage, isQuoteShareCancellation, performDailyQuoteShare } from "../utils/dailyQuoteShare.ts";
import { MEMBERSHIP_AURORA, STREAK_INFO_COLORS, SLEEP_REMINDER_NIGHT_GRADIENT } from "../constants/colors.ts";

const quote = { text: "El poder de la imaginación nos hace infinitos.", author: "John Muir" };
function dependencies(platform = "ios") {
  const events: any[] = [];
  return {
    events, platform,
    copy: async (message: string) => { events.push(["copy", message]); },
    capture: async () => { events.push(["capture"]); return "file:///cache/quote.png"; },
    system: async (payload: unknown) => { events.push(["system", payload]); },
    app: async (action: string, payload: unknown) => { events.push(["app", action, payload]); },
  };
}

test("copy includes the exact quote, author and Resonancia, never an invented link", async () => {
  const deps = dependencies();
  assert.equal(await performDailyQuoteShare("copy", quote, deps), "Frase copiada.");
  assert.deepEqual(deps.events, [["copy", dailyQuoteMessage(quote)]]);
  assert.ok(dailyQuoteMessage(quote).includes(quote.text));
  assert.ok(dailyQuoteMessage(quote).includes(quote.author));
  assert.ok(dailyQuoteMessage(quote).includes("RESONANCIA"));
  assert.doesNotMatch(dailyQuoteMessage(quote), /https?:\/\//);
});

test("Mensaje sends text without depending on the image capture", async () => {
  const deps = dependencies();
  await performDailyQuoteShare("sms", quote, deps);
  assert.deepEqual(deps.events, [["app", "sms", {
    message: dailyQuoteMessage(quote), title: "Frase del día · RESONANCIA",
  }]]);
});

test("Instagram and WhatsApp share the rendered branded quote as PNG", async () => {
  for (const platform of ["ios", "android"]) {
    for (const action of ["instagram", "whatsapp"] as const) {
      const deps = dependencies(platform);
      await performDailyQuoteShare(action, quote, deps);
      assert.deepEqual(deps.events, [
        ["capture"],
        ["app", action, { message: dailyQuoteMessage(quote), title: "Frase del día · RESONANCIA", url: "file:///cache/quote.png", type: "image/png" }],
      ]);
    }
  }
});

test("Messenger uses the actual image extension in iOS instead of passing a local path as a public URL", async () => {
  const deps = dependencies("ios");
  assert.match(await performDailyQuoteShare("messenger", quote, deps), /Elige Messenger/);
  assert.equal(deps.events[1][0], "system");
  assert.equal(deps.events[1][1].type, "image/png");
  const android = dependencies("android");
  await performDailyQuoteShare("messenger", quote, android);
  assert.equal(android.events[1][0], "app");
  assert.equal(android.events[1][1], "messenger");
});

test("Más shares the PNG via the native sheet and text through browser sharing", async () => {
  const native = dependencies();
  await performDailyQuoteShare("more", quote, native);
  assert.equal(native.events[1][0], "system");
  assert.equal(native.events[1][1].url, "file:///cache/quote.png");
  const web = dependencies("web");
  await performDailyQuoteShare("more", quote, web);
  assert.equal(web.events.length, 1);
  assert.equal(web.events[0][0], "system");
  assert.equal(web.events[0][1].url, undefined);
  await assert.rejects(performDailyQuoteShare("instagram", quote, web), /app móvil/);
});

test("copy/capture/share failures remain errors, while a cancelled native share is recognizable", async () => {
  const deps = dependencies();
  deps.capture = async () => { throw new Error("Capture failed"); };
  await assert.rejects(performDailyQuoteShare("instagram", quote, deps), /Capture failed/);
  assert.equal(deps.events.length, 0);
  assert.equal(isQuoteShareCancellation(new Error("User did not share")), true);
  assert.equal(isQuoteShareCancellation(new Error("Not installed")), false);
});

function sheetHarness() {
  let logoState = "loading";
  const nodes = new Map<string, any>();
  const images: any[] = [];
  const artwork = { nativeView: true };
  const flatten = (style: any): any => Array.isArray(style) ? Object.assign({}, ...style.map(flatten)) : style ?? {};
  const Native = (props: any) => {
    if (props.testID) nodes.set(props.testID, props);
    const style = flatten(props.style);
    return React.createElement("div", {
      "data-testid": props.testID,
      "data-colors": props.colors?.join("|"),
      "data-height": style.maxHeight,
      "data-horizontal": props.horizontal ? "true" : undefined,
      "data-lines": props.numberOfLines,
    }, props.children);
  };
  const imports: Record<string, any> = {
    react: { ...React, useRef: () => ({ current: artwork }), useState: () => [logoState, (next: string) => { logoState = next; }] },
    "react-native": {
      View: Native, Text: Native, Pressable: Native, ScrollView: Native, Modal: Native, ActivityIndicator: Native,
      Image: (props: any) => { images.push(props); return React.createElement("img", { alt: props.accessibilityLabel }); },
      Platform: { OS: "ios" }, useWindowDimensions: () => ({ width: 375, height: 812 }),
      StyleSheet: { create: (styles: any) => styles, absoluteFill: {}, absoluteFillObject: {} },
    },
    "@expo/vector-icons": { Feather: Native, FontAwesome5: Native, Ionicons: Native, MaterialCommunityIcons: Native },
    "expo-linear-gradient": { LinearGradient: Native },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 40, bottom: 34 }) },
    "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: { gradient: ["#060A0F", "#111122"], gradientLocations: [0, 1] } }) },
    "@/hooks/useColors": { useColors: () => ({ foreground: "#F9F9F9" }) },
    "@/constants/colors": { MEMBERSHIP_AURORA, STREAK_INFO_COLORS, SLEEP_REMINDER_NIGHT_GRADIENT },
    "@/assets/images/logo-resonancia-new.png": 123,
  };
  const module = { exports: {} as { DailyQuoteShareSheet: (props: any) => any } };
  const source = readFileSync(new URL("../components/DailyQuoteShareSheet.tsx", import.meta.url), "utf8");
  new Function("require", "module", "exports", ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText)((name: string) => {
    assert.ok(name in imports, `Missing share sheet mock ${name}`);
    return imports[name];
  }, module, module.exports);
  return { nodes, images, artwork, source, render: (props: any) => {
    nodes.clear(); images.length = 0;
    return renderToStaticMarkup(module.exports.DailyQuoteShareSheet(props));
  } };
}

test("sheet previews logo, complete quote and author above its heading and six working options", () => {
  const h = sheetHarness();
  let closed = 0;
  const actions: any[] = [];
  const props = {
    visible: true, quote, busy: false, feedback: null,
    onClose: () => closed++, onAction: (...args: any[]) => actions.push(args),
  };
  const html = h.render(props);
  assert.match(html, /alt="Resonancia"/);
  assert.ok(html.includes(quote.text));
  assert.ok(html.includes(quote.author));
  assert.ok(html.indexOf(quote.text) < html.indexOf(quote.author));
  assert.ok(html.indexOf(quote.author) < html.indexOf("Comparte esta frase"));
  assert.doesNotMatch(html, /data-lines=/);
  assert.equal(h.nodes.get("daily-quote-share-artwork").collapsable, false);
  assert.equal(h.nodes.get("daily-quote-share-modal").transparent, true);
  for (const action of ["copy", "sms"]) assert.equal(h.nodes.get(`daily-quote-share-${action}`).disabled, false);
  assert.equal(h.nodes.get("daily-quote-share-instagram").disabled, true);
  h.images[0].onLoad();
  h.render(props);
  for (const action of ["copy", "sms", "instagram", "whatsapp", "messenger", "more"]) {
    const button = h.nodes.get(`daily-quote-share-${action}`);
    assert.equal(button.disabled, false);
    button.onPress();
    assert.deepEqual(actions.at(-1), [action, h.artwork]);
  }
  h.nodes.get("daily-quote-share-close").onPress();
  h.nodes.get("daily-quote-share-backdrop").onPress();
  h.nodes.get("daily-quote-share-modal").onRequestClose();
  assert.equal(closed, 3);
  assert.equal(h.render({ ...props, visible: false }), "");
  assert.doesNotMatch(h.source, /numberOfLines/);
});

test("busy prevents duplicate share taps; missing logo leaves text actions usable with an explicit error", () => {
  const h = sheetHarness();
  let actions = 0;
  const props = { visible: true, quote, busy: false, feedback: null, onClose: () => {}, onAction: () => actions++ };
  h.render(props);
  h.images[0].onError();
  assert.match(h.render(props), /No se pudo cargar el logo/);
  assert.equal(h.nodes.get("daily-quote-share-instagram").disabled, true);
  assert.equal(h.nodes.get("daily-quote-share-copy").disabled, false);
  h.render({ ...props, busy: true });
  for (const action of ["copy", "sms", "instagram", "whatsapp", "messenger", "more"]) {
    assert.equal(h.nodes.get(`daily-quote-share-${action}`).disabled, true);
    h.nodes.get(`daily-quote-share-${action}`).onPress();
  }
  assert.equal(actions, 0);
});

test("the shared controller snapshots the quote and guards double taps without hiding the sheet on failure", async () => {
  const state: any[] = [];
  const refs: any[] = [];
  let stateIndex = 0;
  let refIndex = 0;
  let finish: ((value: string) => void) | undefined;
  let rejectShare: ((error: Error) => void) | undefined;
  const requests: any[] = [];
  const source = readFileSync(new URL("../hooks/useDailyQuoteShare.ts", import.meta.url), "utf8");
  const mocks: Record<string, any> = {
    react: {
      useState: (initial: any) => {
        const i = stateIndex++;
        if (!(i in state)) state[i] = initial;
        return [state[i], (value: any) => { state[i] = value; }];
      },
      useRef: (initial: any) => {
        const i = refIndex++;
        refs[i] ??= { current: initial };
        return refs[i];
      },
      useEffect: () => {},
    },
    "@/utils/dailyQuoteShare": {
      isQuoteShareCancellation,
      shareDailyQuote: (...args: any[]) => {
        requests.push(args);
        return new Promise<string>((resolve, reject) => { finish = resolve; rejectShare = reject; });
      },
    },
  };
  const module = { exports: {} as { useDailyQuoteShare: (value: typeof quote) => any } };
  new Function("require", "module", "exports", ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText)((name: string) => mocks[name], module, module.exports);
  const render = (currentQuote = quote) => {
    stateIndex = 0; refIndex = 0;
    return module.exports.useDailyQuoteShare(currentQuote);
  };
  render().open();
  const nextDay = { text: "Una frase diferente.", author: "Otro autor" };
  const current = render(nextDay);
  assert.equal(current.sheetProps.visible, true);
  assert.deepEqual(current.sheetProps.quote, quote);
  const pending = current.sheetProps.onAction("copy", null);
  await current.sheetProps.onAction("copy", null);
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0][1], quote);
  assert.equal(render(nextDay).sheetProps.busy, true);
  finish!("Frase copiada.");
  await pending;
  assert.equal(render(nextDay).sheetProps.feedback, "Frase copiada.");
  assert.equal(render(nextDay).sheetProps.busy, false);
  const failing = render(nextDay).sheetProps.onAction("instagram", null);
  rejectShare!(new Error("Not installed"));
  await failing;
  assert.match(render(nextDay).sheetProps.feedback, /usa Más/);
  assert.equal(render(nextDay).sheetProps.visible, true);
  render(nextDay).sheetProps.onClose();
  assert.equal(render(nextDay).sheetProps.visible, false);
});

test("native sharing configuration includes target apps without removing existing queries or duplicating them", () => {
  const module = { exports: undefined as unknown as (config: any) => any };
  const source = readFileSync(new URL("../plugins/with-instagram-sharing.js", import.meta.url), "utf8");
  const plugins = {
    withInfoPlist: (config: any, callback: any) => {
      config.info = callback({ modResults: config.info }).modResults;
      return config;
    },
    withAndroidManifest: (config: any, callback: any) => {
      config.android = callback({ modResults: config.android }).modResults;
      return config;
    },
  };
  new Function("require", "module", "exports", source)(() => plugins, module, module.exports);
  const config = {
    info: { LSApplicationQueriesSchemes: ["existing-app", "instagram-stories"] },
    android: { manifest: { queries: [{ package: [{ $: { "android:name": "com.existing.app" } }] }] } },
  };
  module.exports(config);
  module.exports(config);
  assert.deepEqual(config.info.LSApplicationQueriesSchemes, ["existing-app", "instagram-stories", "instagram", "whatsapp"]);
  assert.deepEqual(config.android.manifest.queries[0].package.map((item: any) => item.$["android:name"]),
    ["com.existing.app", "com.instagram.android", "com.whatsapp", "com.facebook.orca"]);
  const app = JSON.parse(readFileSync(new URL("../app.json", import.meta.url), "utf8"));
  assert.ok(app.expo.ios.infoPlist.LSApplicationQueriesSchemes.includes("instagram-stories"));
  assert.ok(app.expo.ios.infoPlist.LSApplicationQueriesSchemes.includes("instagram"));
  assert.ok(app.expo.ios.infoPlist.LSApplicationQueriesSchemes.includes("whatsapp"));
});
