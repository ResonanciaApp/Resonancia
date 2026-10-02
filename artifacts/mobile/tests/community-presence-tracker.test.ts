import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../components/CommunityPresenceTracker.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

test("presence runs outside Inicio, stops on background/logout and resumes with a new lease", async () => {
  const ticks = new Map<number, () => void>();
  const originalSet = global.setInterval, originalClear = global.clearInterval;
  let sequence = 0, cleanup: (() => void) | undefined, change: (state: string) => void;
  let retire: () => Promise<void>;
  const heartbeats: any[] = [], leaves: any[] = [];
  const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
  global.setInterval = ((fn: () => void, ms: number) => {
    assert.equal(ms, 30_000); ticks.set(++sequence, fn); return sequence;
  }) as any;
  global.clearInterval = ((id: number) => { ticks.delete(id); }) as any;
  try {
    const mocks: Record<string, any> = {
      "@clerk/expo": { useAuth: () => ({ isSignedIn: true, userId: "fixture", getToken: async () => "fixture" }) },
      "@workspace/api-client-react": {
        heartbeatCommunityPresence: async (body: any, options: any) => { heartbeats.push({ body, options }); },
        leaveCommunityPresence: async (body: any, options: any) => { leaves.push({ body, options }); },
      },
      "expo-crypto": { randomUUID: () => `00000000-0000-4000-8000-${String(sequence + 1).padStart(12, "0")}` },
      react: { useEffect: (effect: () => () => void) => { cleanup = effect(); } },
      "react-native": { AppState: { currentState: "active", addEventListener: (_: string, fn: any) => { change = fn; return { remove() {} }; } } },
      "@/lib/community-presence-lifecycle": { registerCommunityPresenceRetirer: (fn: any) => { retire = fn; return () => {}; } },
    };
    const module = { exports: {} as any };
    new Function("require", "module", "exports", compiled)((name: string) => mocks[name], module, module.exports);
    module.exports.CommunityPresenceTracker();
    await flush();
    assert.equal(heartbeats.length, 1);
    assert.equal(ticks.size, 1);
    change!("background");
    await flush();
    assert.equal(ticks.size, 0);
    assert.equal(leaves.length, 1);
    assert.deepEqual(leaves[0].body, heartbeats[0].body);
    change!("active");
    await flush();
    assert.equal(heartbeats.length, 2);
    assert.notEqual(heartbeats[0].body.sessionId, heartbeats[1].body.sessionId);
    await retire!();
    assert.equal(leaves.length, 2);
    assert.equal(ticks.size, 0);
    change!("active");
    await flush();
    assert.equal(heartbeats.length, 2, "logout cannot restart its disposed tracker");
  } finally {
    cleanup?.();
    global.setInterval = originalSet;
    global.clearInterval = originalClear;
  }
});

test("integration appends the block only to Inicio 3 and retires presence before removing Clerk authentication", () => {
  const home = readFileSync(new URL("../app/(tabs)/inicio8.tsx", import.meta.url), "utf8");
  assert.match(home, /variant === "inicio3" && \(\s*<ConnectedCommunitySection/);
  assert.ok(home.indexOf("<ConnectedCommunitySection") > home.lastIndexOf("<AlmaCommunitySection"));
  assert.ok(home.indexOf("<ConnectedCommunitySection") < home.indexOf("</RAnimated.ScrollView>"));
  const auth = readFileSync(new URL("../context/AuthContext.tsx", import.meta.url), "utf8");
  const logout = auth.slice(auth.indexOf("const logout ="));
  assert.ok(logout.indexOf("await retireCommunityPresence()") < logout.indexOf("await signOut()"));
  const section = readFileSync(new URL("../components/ConnectedCommunitySection.tsx", import.meta.url), "utf8");
  assert.match(section, /const active = visible && focused && foreground/);
  assert.match(section, /refetchInterval: active \? 15_000 : false/);
  assert.match(section, /query\.isError/);
  assert.match(section, /count=\{data\?\.count \?\? null\}/);
});