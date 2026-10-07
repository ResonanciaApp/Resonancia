import test from "node:test";
import assert from "node:assert/strict";

import { routeForPushData } from "../lib/push-routing.ts";

test("routes published-session pushes using the backend type and sessionId", () => {
  assert.equal(
    routeForPushData({ type: "session_published", sessionId: "calma/01" }),
    "/session/calma%2F01",
  );
});

test("routes published-session pushes using entityKey as a fallback", () => {
  assert.equal(
    routeForPushData({ kind: "session_published", entityKey: "sesion-42" }),
    "/session/sesion-42",
  );
});

test("vibration pushes open the sender's public profile", () => {
  assert.equal(routeForPushData({ kind: "vibration", fromUserId: 42 }), "/usuario/42");
  assert.equal(routeForPushData({ type: "vibration", fromUserId: 17 }), "/usuario/17");
  for (const fromUserId of [undefined, "42", 0, -1, 2.5, NaN]) {
    assert.equal(routeForPushData({ kind: "vibration", fromUserId }), undefined);
  }
});