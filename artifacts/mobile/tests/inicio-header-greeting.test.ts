import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("the mood register below Home username preserves the same F4F4F4 in every theme", () => {
  const source = readFileSync(new URL("../app/(tabs)/inicio8.tsx", import.meta.url), "utf8");
  const body = source.match(/inicio3HeroDecree: \{([\s\S]*?)\n  \}/)?.[1];
  assert.ok(body);
  const style = new Function(`return ({${body}});`)();
  assert.equal(style.color, "#F4F4F4");
  const greeting = source.match(/<Text style=\{styles\.inicio3HeroDecree\}[\s\S]*?<\/Text>/)?.[0];
  assert.ok(greeting);
  assert.match(greeting, /Registro de ánimo/);
  assert.equal(style.fontSize, 14);
  assert.equal(style.lineHeight, 19);
  const identityBody = source.match(/inicio3HeroGreeting: \{([\s\S]*?)\n  \}/)?.[1];
  assert.ok(identityBody);
  const identityStyle = new Function(`return ({${identityBody}});`)();
  assert.equal(identityStyle.marginLeft, 15);
  assert.equal(style.fontWeight, "600");
});

test("Home identity and emoji widget use the same stable mood-sheet action", () => {
  const source = readFileSync(new URL("../app/(tabs)/inicio8.tsx", import.meta.url), "utf8");
  const action = source.match(/const handleOpenMoodPicker = useCallback\((\(\) => setMoodSheetVisible\(true\)), \[\]\);/);
  assert.ok(action);
  const states: boolean[] = [];
  new Function("setMoodSheetVisible", `return (${action[1]});`)((value: boolean) => states.push(value))();
  assert.deepEqual(states, [true]);
  for (const name of ["Inicio2HeroStatic", "InicioEmotionWidget"]) {
    const instance = source.match(new RegExp(`<${name}\\s[\\s\\S]*?\\/>`));
    assert.ok(instance);
    assert.match(instance[0], /onOpenMoodPicker=\{handleOpenMoodPicker\}/);
  }
  const register = source.match(/<Pressable\s+onPress=\{onOpenMoodPicker\}[\s\S]*?testID="inicio3-open-mood-register"[\s\S]*?<\/Pressable>/);
  assert.ok(register);
  assert.match(register[0], /accessibilityRole="button"/);
  assert.match(register[0], /Registro de ánimo/);
  assert.match(register[0], /<Feather name="chevron-down" size=\{18\} color="#F4F4F4" style=\{\{ transform: \[\{ translateY: 2 \}\] \}\}/);
  assert.doesNotMatch(register[0], /onOpenDrawer/);
  assert.match(source, /<MoodPickerSheet[\s\S]*?visible=\{moodSheetVisible\}/);
});
