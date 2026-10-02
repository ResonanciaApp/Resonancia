import { useAuth } from "@clerk/expo";
import { heartbeatCommunityPresence, leaveCommunityPresence } from "@workspace/api-client-react";
import * as Crypto from "expo-crypto";
import { useEffect } from "react";
import { AppState } from "react-native";

import { registerCommunityPresenceRetirer } from "@/lib/community-presence-lifecycle";

/** Foreground-only leases. Never tie presence to visiting Inicio or playing audio. */
export function CommunityPresenceTracker() {
  const { isSignedIn, userId, getToken } = useAuth();
  useEffect(() => {
    if (!isSignedIn || !userId) return;
    type Lease = { id: string; closed: boolean; token: string | null; controller: AbortController | null; busy: boolean };
    let lease: Lease | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let disposed = false;

    const tick = async (current: Lease) => {
      if (current.closed || current.busy || disposed) return;
      current.busy = true;
      const controller = new AbortController();
      current.controller = controller;
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const token = await getToken();
        if (!token || current.closed || disposed || controller.signal.aborted) return;
        current.token = token;
        await heartbeatCommunityPresence({ sessionId: current.id }, {
          headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
        });
      } catch {
        // Presence is a lease, not a durable offline write. Do not queue it.
        // The next foreground tick retries; the server expires old leases.
      } finally {
        clearTimeout(timeout);
        current.controller = null;
        current.busy = false;
      }
    };
    const stop = async () => {
      if (timer) clearInterval(timer);
      timer = null;
      const current = lease;
      lease = null;
      if (!current || current.closed) return;
      current.closed = true;
      current.controller?.abort();
      if (!current.token) return;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        await leaveCommunityPresence({ sessionId: current.id }, {
          headers: { Authorization: `Bearer ${current.token}` }, signal: controller.signal,
        });
      } catch {
        // Offline logout/backgrounding still works; the 90s server TTL is final.
      } finally { clearTimeout(timeout); }
    };
    const start = () => {
      if (lease || disposed) return;
      const current: Lease = { id: Crypto.randomUUID(), closed: false, token: null, controller: null, busy: false };
      lease = current;
      void tick(current);
      timer = setInterval(() => void tick(current), 30_000);
    };
    const unregister = registerCommunityPresenceRetirer(async () => {
      disposed = true; await stop();
    });
    if (AppState.currentState === "active") start();
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") start(); else void stop();
    });
    return () => {
      disposed = true;
      listener.remove();
      unregister();
      void stop();
    };
  }, [isSignedIn, userId, getToken]);
  return null;
}