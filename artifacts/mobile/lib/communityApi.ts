/**
 * Community activity API helpers.
 *
 * Token getter is registered once from _layout ApiAuthBridge so that
 * PlayerContext and MixerContext can call sendHeartbeat() without
 * importing Clerk hooks directly.
 */

let _getToken: (() => Promise<string | null>) | null = null;

export function setCommunityTokenGetter(fn: () => Promise<string | null>): void {
  _getToken = fn;
}

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "";

// ── Types ──────────────────────────────────────────────────────────────────

export type CommunityEventType =
  | "session_play"
  | "mixer_active"
  | "geometrix_active"
  | "mix_shared"
  | "glyph_shared"
  | "user_joined";

export interface CommunityPayload {
  sessionId?: string;
  sessionName?: string;
  category?: string;
  mixId?: number;
  mixName?: string;
  glyphId?: number;
  glyphName?: string;
}

export interface CommunityFeedEvent {
  id: number;
  eventType: CommunityEventType;
  payload: CommunityPayload;
  lastHeartbeatAt: string | null;
  createdAt: string;
  isLive: boolean;
  user: {
    id: number;
    displayName: string;
    avatarUrl: string;
    location: string | null;
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function authHeader(): Promise<Record<string, string>> {
  if (!_getToken) return {};
  try {
    const token = await _getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/**
 * Fire-and-forget live heartbeat. Never throws.
 * Call on mount + every 60 s while the activity is active.
 */
export async function sendHeartbeat(
  eventType: "session_play" | "mixer_active" | "geometrix_active",
  payload: CommunityPayload = {},
): Promise<void> {
  if (!BASE) return;
  try {
    const headers = await authHeader();
    await fetch(`${BASE}/api/community/activity/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ eventType, payload }),
    });
  } catch {
    // Best-effort — never surface to the user.
  }
}

/** Fetch the community feed (public endpoint, no auth required). */
export async function fetchCommunityFeed(): Promise<CommunityFeedEvent[]> {
  const res = await fetch(`${BASE}/api/community/feed`);
  if (!res.ok) throw new Error(`feed fetch failed: ${res.status}`);
  return res.json() as Promise<CommunityFeedEvent[]>;
}
