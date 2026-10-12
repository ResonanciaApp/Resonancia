import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("own and public profile names wrap without ellipsis and preserve matching sizes", () => {
  for (const path of ["components/ProfileScreenBase.tsx", "app/usuario/[id].tsx"]) {
    const source = readFileSync(path, "utf8");
    const name = source.match(/<Text\b[^>]*style=\{\[styles\.userName,[\s\S]*?<\/Text>/)?.[0];
    assert.ok(name, path);
    assert.doesNotMatch(name, /numberOfLines|ellipsizeMode|adjustsFontSizeToFit/);
    assert.match(source, /userName: \{ fontFamily: "Manrope", fontSize: 25,/);
    assert.match(source, /avatarImage:\s*\{\s*width: 118,\s*height: 118,\s*borderRadius: 59/);
  }
});
