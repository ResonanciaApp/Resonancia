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
  assert.doesNotMatch(avatar, /styles\.inicio3HeroAvatarBorder/);
  assert.doesNotMatch(avatar, /isPremium|SessionBadgeGlass|name="star"/);
  assert.doesNotMatch(source, /inicio2HeroPremiumBadge/);
});

test("Perfil shows its independent Premium avatar badge, not on its titles", () => {
  const profile = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(profile, /testID="profile-avatar-premium-badge"/);
  assert.doesNotMatch(profile, /profile-(?:sticky-)?title-premium-badge/);
});

test("Inicio and drawer avatars have no border, preserving their dimensions and fallbacks", () => {
  const home = readFileSync(new URL("../app/(tabs)/inicio8.tsx", import.meta.url), "utf8");
  const profile = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  const drawer = readFileSync(new URL("../components/DrawerMenu.tsx", import.meta.url), "utf8");
  for (const name of ["inicio2HeroAvatar", "inicio2HeroAvatarFallback"]) {
    const style = home.match(new RegExp(`${name}:\\s*\\{([^}]+)\\}`))?.[1];
    assert.ok(style);
    assert.match(style, /width:\s*42,\s*height:\s*42,\s*borderRadius:\s*21/);
    assert.doesNotMatch(style, /borderWidth|borderColor/);
  }
  assert.doesNotMatch(home, /inicio3HeroAvatarBorder/);
  assert.doesNotMatch(profile, /avatarOuterBorder/);
  const drawerAvatar = drawer.match(/inicio3ProfilePhoto:\s*\{([^}]+)\}/)?.[1];
  assert.ok(drawerAvatar);
  assert.match(drawerAvatar, /width:\s*75,\s*height:\s*75,\s*borderRadius:\s*37\.5/);
  assert.doesNotMatch(drawerAvatar, /borderWidth|borderColor/);
  for (const name of ["profilePhoto", "profilePhotoFallback"]) {
    const style = drawer.match(new RegExp(`${name}:\\s*\\{([^}]+)\\}`))?.[1];
    assert.ok(style);
    assert.match(style, /borderWidth:\s*0\b/);
  }
  assert.match(drawer, /loggedIn && initial/);
  assert.match(drawer, /styles\.profilePhotoGuest/);
});