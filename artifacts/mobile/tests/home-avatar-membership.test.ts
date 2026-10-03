import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Inicio keeps its interactive avatar without a Premium star", () => {
  const source = readFileSync(new URL("../app/(tabs)/inicio8.tsx", import.meta.url), "utf8");
  const start = source.indexOf('testID="inicio2-avatar-open-drawer"');
  assert.ok(start > 0);
  const avatar = source.slice(start, source.indexOf("</Pressable>", start));
  assert.match(avatar, /avatarSource/);
  assert.match(avatar, /styles\.inicio2HeroAvatarInitial/);
  assert.match(avatar, /styles\.inicio3HeroAvatarBorder/);
  assert.doesNotMatch(avatar, /isPremium|SessionBadgeGlass|name="star"/);
  assert.doesNotMatch(source, /inicio2HeroPremiumBadge/);
});

test("Perfil retains its independent Premium avatar badge", () => {
  const profile = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(profile, /testID="profile-avatar-premium-badge"/);
});