import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

type SessionFixture = {
  id: string; title: string; image: string; durationLabel: string; categoryLabel: string;
  skipMiniPlayer?: boolean; skipDetail?: boolean;
};
type DownloadFixture = { sessionId: string; status: string; localUri?: string };
type NativeProps = {
  children?: React.ReactNode; testID?: string; accessibilityLabel?: string; onPress?: () => void;
};
let downloads: DownloadFixture[] = [];
let loading = false;
let supported = true;
const sessions = new Map<string, SessionFixture>();
const buttons: NativeProps[] = [];
const routes: string[] = [];
const played: string[] = [];
const Native = ({ children, testID }: NativeProps) => React.createElement("div", { "data-testid": testID }, children);
const source = readFileSync(new URL("../components/ProfileDownloadsSection.tsx", import.meta.url), "utf8");
const mocks: Record<string, unknown> = {
  react: React,
  "@/components/CardCaptionText": { CardCaptionText: Native },
  "react-native": {
    View: Native, Text: Native,
    Pressable: (props: NativeProps) => { buttons.push(props); return React.createElement(Native, props); },
    StyleSheet: { create: (styles: unknown) => styles },
  },
  "expo-image": { Image: Native },
  "expo-router": { router: { push: (route: string) => routes.push(route) } },
  "@/constants/colors": { CARD_TEXT_ABOVE: "#FBFBFB", CARD_TEXT_BELOW: "#EBF2FF" },
  "@/context/CatalogContext": { useCatalog: () => ({ version: 1 }) },
  "@/context/DownloadContext": { useDownloads: () => ({ downloads, loading, supported }) },
  "@/context/PlayerContext": { usePlayerBrowse: () => ({ playSession: (session: SessionFixture) => played.push(session.id) }) },
  "@/data/sessions": { getSessionById: (id: string) => sessions.get(id) },
  "@/hooks/useColors": { useColors: () => ({ foreground: "#FFF" }) },
};
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;
const module = { exports: {} as { ProfileDownloadsSection: React.ComponentType<Record<string, unknown>> } };
new Function("require", "module", "exports", compiled)((name: string) => {
  if (!(name in mocks)) throw new Error(`Missing downloads test mock: ${name}`);
  return mocks[name];
}, module, module.exports);
const render = () => {
  buttons.length = 0;
  routes.length = 0;
  played.length = 0;
  return renderToStaticMarkup(React.createElement(module.exports.ProfileDownloadsSection, {
    linkColor: "#BE9650", descriptionColor: "#F0F0F0",
  }));
};
const fixture = (id: string): SessionFixture => ({
  id, title: `Sesión ${id}`, image: "cover.png", durationLabel: "5 min", categoryLabel: "Meditación",
});

test("Descargas is no longer inserted into Perfil; its standalone content remains available", () => {
  const profile = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(profile, /<ProfileDownloadsSection|>Historial<\/Text>/);
  assert.match(profile, /<ProfileReflectionWallSection/);
});

test("empty, loading, and unsupported states reserve the section without fake cards", () => {
  downloads = [];
  assert.match(render(), /Descargas/);
  assert.match(render(), /Aquí aparecerán las sesiones que descargues/);
  loading = true;
  assert.match(render(), /Cargando descargas/);
  loading = false;
  supported = false;
  assert.match(render(), /app instalada/);
  supported = true;
});

test("all completed local copies become cards; pending, failed, missing-file and unknown sessions do not", () => {
  sessions.clear();
  downloads = Array.from({ length: 5 }, (_, index) => {
    const id = `guardada-${index}`;
    sessions.set(id, fixture(id));
    return { sessionId: id, status: "complete", localUri: `file:///downloads/${id}.mp3` };
  });
  for (const [id, status, localUri] of [
    ["pendiente", "downloading", "file:///partial.mp3"],
    ["fallida", "failed", "file:///failed.mp3"],
    ["sin-archivo", "complete", undefined],
  ] as const) {
    sessions.set(id, fixture(id));
    downloads.push({ sessionId: id, status, localUri });
  }
  downloads.push({ sessionId: "fuera-del-catalogo", status: "complete", localUri: "file:///old.mp3" });
  const html = render();
  for (let index = 0; index < 5; index++) assert.match(html, new RegExp(`Sesión guardada-${index}`));
  assert.doesNotMatch(html, /Sesión pendiente|Sesión fallida|Sesión sin-archivo|fuera-del-catalogo/);
  assert.match(source, /\[downloads, catalogVersion\]/);
});

test("Ver todo opens Downloads and cards respect normal/detail-free/miniplayer behavior", () => {
  const session = fixture("activa");
  sessions.set(session.id, session);
  downloads = [{ sessionId: session.id, status: "complete", localUri: "file:///active.mp3" }];
  render();
  buttons.find((button) => button.accessibilityLabel === "Ver todas las descargas")?.onPress?.();
  assert.deepEqual(routes, ["/descargas"]);
  const pressSession = () => buttons.find((button) => button.accessibilityLabel === "Abrir Sesión activa")?.onPress?.();
  render();
  pressSession();
  assert.deepEqual(routes, ["/session/activa"]);
  assert.deepEqual(played, []);
  session.skipDetail = true;
  render();
  pressSession();
  assert.deepEqual(routes, ["/player"]);
  assert.deepEqual(played, ["activa"]);
  session.skipMiniPlayer = true;
  render();
  pressSession();
  assert.deepEqual(routes, []);
  assert.deepEqual(played, ["activa"]);
});