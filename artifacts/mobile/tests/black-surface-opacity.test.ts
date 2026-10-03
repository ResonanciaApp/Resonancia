import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = (path: string) => readFileSync(join(root, path), "utf8");

function sourceFiles(dir: string): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.tsx?$/.test(path) ? [path] : [];
  });
}

test("former 22% and 28% black backgrounds stay removed except the explicit Resonadores banner, preserving the calendar border", () => {
  const remaining: string[] = [];
  for (const file of ["app", "components", "constants"].flatMap(sourceFiles)) {
    source(file).split("\n").forEach((line, index) => {
      if (!/rgba\(0,\s*0,\s*0,\s*0?\.(22|28)\)|#000000(38|47)\b/i.test(line)) return;
      if (file === "components/MoodCalendar.tsx" && /borderColor: "rgba\(0,0,0,0\.28\)"/.test(line)) return;
      if (file === "components/ResonadoresBanner.tsx" && line.trim() === 'backgroundColor: "rgba(0,0,0,0.28)",') return;
      remaining.push(`${file}:${index + 1}: ${line.trim()}`);
    });
  }
  assert.deepEqual(remaining, []);
  assert.match(source("components/MoodCalendar.tsx"), /borderColor: "rgba\(0,0,0,0\.28\)"/);
});

test("Descubrir's Resonadores banner uses 28% black without fading its text, artwork or changing its action", () => {
  const banner = source("components/ResonadoresBanner.tsx");
  assert.match(banner, /backgroundColor: "rgba\(0,0,0,0\.28\)"/);
  assert.match(banner, /opacity: pressed \? 0\.82 : 1/);
  assert.match(banner, /borderColor: "rgba\(255,255,255,0\.2\)"/);
  assert.match(banner, /onPress=\{onPress\}/);
  assert.match(source("app/(tabs)/explore.tsx"), /<ResonadoresBanner onPress=\{\(\) => router\.push\("\/equipo" as never\)\} \/>/);
});

test("Dormir, Sonidos and general category tabs use 16% black without changing selected colors", () => {
  const sleep = source("app/(tabs)/descanzo.tsx");
  assert.match(sleep, /sleepPill: \{[\s\S]*?backgroundColor: "rgba\(0,0,0,0\.16\)"/);
  assert.match(sleep, /colors=\{\["#784576", "#50326E"\]\}/);
  assert.match(source("app/(tabs)/sonidos.tsx"), /inactiveTabSurface = "rgba\(0,0,0,0\.16\)"/);
  assert.match(source("app/(tabs)/sonidos.tsx"), /pill: \{[^}]*borderWidth: 1\.2,[^}]*borderColor: "rgba\(241,224,255,0\.25\)"/);
  for (const file of ["components/SupercategoryFilterTabs.tsx", "app/category/[id].tsx"]) {
    assert.match(source(file), /chip: \{[\s\S]*?backgroundColor: "rgba\(0,0,0,0\.16\)"/);
    assert.match(source(file), /chipSelected: \{[\s\S]*?backgroundColor: "#F9F9F9"/);
  }
  for (const file of ["meditaciones-guiadas", "musica-sonidos", "noches", "sonidos-ancestrales"]) {
    assert.match(source(`app/category/${file}.tsx`), /chip: \{[^}]*backgroundColor: "rgba\(0,0,0,0\.21\)"/);
  }
});

test("Sonidos Ambiental cards and shared navigation/card constants all use 16% black", () => {
  assert.match(source("app/(tabs)/sonidos.tsx"), /ambientalCardBackground="rgba\(0,0,0,0\.16\)"/);
  assert.match(source("components/SessionCard.tsx"), /ambientalCardBackground = "rgba\(0,0,0,0\.16\)"/);
  assert.match(source("components/SessionCarousel.tsx"), /ambientalCardBackgroundOverride \?\? "rgba\(0,0,0,0\.16\)"/);
  const constants = source("constants/colors.ts");
  assert.match(constants, /SLEEP_REMINDER_CARD_BACKGROUND = "rgba\(0,0,0,0\.16\)"/);
  assert.match(constants, /navigationBackground: "rgba\(0,0,0,0\.16\)"/);
  assert.match(constants, /cardBackground: "rgba\(0,0,0,0\.16\)"/);
});