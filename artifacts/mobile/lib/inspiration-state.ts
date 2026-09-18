import type { InspirationDay } from "@workspace/api-client-react";

/** Pure, deterministic offline state. No session/audio favorite identifiers enter this store. */
export interface InspirationNote {
  id: string;
  inspirationId: string;
  text: string;
  revision: number;
  updatedAt: string;
  deletedAt: string | null;
  date?: string | null;
  /** Recovery copies are never uploaded until the reader explicitly edits/saves them. */
  conflictOf?: string;
  localOnly?: boolean;
}

export interface InspirationFavorite {
  inspirationId: string;
  revision: number;
  updatedAt: string;
  deletedAt: string | null;
  day?: InspirationDay | null;
  date?: string | null;
  timeZone?: string;
}

export interface InspirationOperation {
  kind: "note" | "favorite";
  id: string;
  sequence: number;
  baseRevision: number;
}

export interface InspirationPrivateState {
  version: 1;
  notes: Record<string, InspirationNote>;
  favorites: Record<string, InspirationFavorite>;
  pending: Record<string, InspirationOperation>;
  sequence: number;
  importedGuestIds: string[];
  importDismissed: boolean;
}

export const inspirationEmptyState = (): InspirationPrivateState => ({
  version: 1, notes: {}, favorites: {}, pending: {}, sequence: 0,
  importedGuestIds: [], importDismissed: false,
});

export function inspirationStorageKey(owner: string | null): string {
  return `@resonancia:inspiration:v1:${owner ? `user:${encodeURIComponent(owner)}` : "guest"}`;
}

export function inspirationOperationKey(kind: InspirationOperation["kind"], id: string) {
  return `${kind}:${id}`;
}

function queue(
  state: InspirationPrivateState, kind: InspirationOperation["kind"], id: string,
  baseRevision: number, sync: boolean,
): InspirationPrivateState {
  if (!sync) return state;
  const key = inspirationOperationKey(kind, id);
  const sequence = state.sequence + 1;
  return {
    ...state, sequence,
    pending: { ...state.pending, [key]: { kind, id, sequence, baseRevision } },
  };
}

export function inspirationPutNote(
  state: InspirationPrivateState, note: InspirationNote, sync: boolean,
): InspirationPrivateState {
  const existing = state.notes[note.id];
  if (existing?.deletedAt && !note.deletedAt) throw new Error("Una nota eliminada no se puede reactivar.");
  return queue(
    { ...state, notes: { ...state.notes, [note.id]: note } },
    "note", note.id, existing?.revision ?? 0, sync && !note.localOnly,
  );
}

export function inspirationPutFavorite(
  state: InspirationPrivateState, favorite: InspirationFavorite, sync: boolean,
): InspirationPrivateState {
  return queue(
    { ...state, favorites: { ...state.favorites, [favorite.inspirationId]: favorite } },
    "favorite", favorite.inspirationId, state.favorites[favorite.inspirationId]?.revision ?? 0, sync,
  );
}

function recoverText(
  state: InspirationPrivateState, note: InspirationNote, makeId: () => string,
): InspirationPrivateState {
  if (!note.text.trim() || note.deletedAt) return state;
  if (Object.values(state.notes).some((n) => n.conflictOf === note.id && n.text === note.text)) return state;
  const id = makeId();
  return {
    ...state,
    notes: {
      ...state.notes,
      [id]: { ...note, id, revision: 0, conflictOf: note.id, localOnly: true, deletedAt: null },
    },
  };
}

/**
 * Merge a full private snapshot or one acknowledged mutation.
 * A response may only acknowledge the precise sequence sent, never a newer local edit.
 * Stale edits cannot overwrite a concurrent remote edit or revive a tombstone.
 */
export function inspirationMergeNote(
  input: InspirationPrivateState, remote: InspirationNote, makeId: () => string,
  acknowledged?: InspirationOperation,
): InspirationPrivateState {
  let state = input;
  const local = state.notes[remote.id];
  const key = inspirationOperationKey("note", remote.id);
  const pending = state.pending[key];
  if (local && remote.revision < local.revision) return state;
  const removePending = () => {
    const { [key]: _removed, ...rest } = state.pending;
    return rest;
  };
  const acknowledgedSame = acknowledged && pending?.sequence === acknowledged.sequence;
  const acknowledgedOlder = acknowledged && pending && pending.sequence !== acknowledged.sequence;

  if (remote.deletedAt) {
    if (pending && local && !local.deletedAt) state = recoverText(state, local, makeId);
    return { ...state, notes: { ...state.notes, [remote.id]: remote }, pending: removePending() };
  }
  if (pending && local) {
    if (acknowledgedSame) {
      return { ...state, notes: { ...state.notes, [remote.id]: remote }, pending: removePending() };
    }
    // An edit/delete made while an older write was in-flight must remain queued.
    if (acknowledgedOlder || local.deletedAt) {
      return {
        ...state,
        notes: { ...state.notes, [remote.id]: { ...local, revision: remote.revision } },
        pending: { ...state.pending, [key]: { ...pending, baseRevision: remote.revision } },
      };
    }
    if (remote.revision > pending.baseRevision) {
      // Includes retry after a successful write whose response was lost.
      if (local.text !== remote.text) state = recoverText(state, local, makeId);
      return { ...state, notes: { ...state.notes, [remote.id]: remote }, pending: removePending() };
    }
    return state;
  }
  // Tombstones in durable local state cannot be replaced by a stale nondeleted snapshot.
  if (local?.deletedAt) return state;
  return { ...state, notes: { ...state.notes, [remote.id]: remote } };
}

export function inspirationMergeFavorite(
  state: InspirationPrivateState, remote: InspirationFavorite,
  acknowledged?: InspirationOperation,
): InspirationPrivateState {
  const id = remote.inspirationId;
  const key = inspirationOperationKey("favorite", id);
  const local = state.favorites[id];
  const pending = state.pending[key];
  // Withdrawn rows may no longer expose an editorial date; keep only the known
  // technical date, never substitute the old public content.
  remote = { ...remote, date: remote.date ?? local?.date };
  if (local && remote.revision < local.revision) return state;
  // Equal revisions cannot describe opposite authoritative states. This guard
  // is deliberately NOT applied to a genuinely newer server restore.
  if (!pending && local?.deletedAt && !remote.deletedAt && remote.revision === local.revision) return state;
  if (pending && local) {
    if (acknowledged && pending.sequence !== acknowledged.sequence) {
      return {
        ...state, favorites: { ...state.favorites, [id]: { ...local, revision: remote.revision } },
        pending: { ...state.pending, [key]: { ...pending, baseRevision: remote.revision } },
      };
    }
    if (!acknowledged && local.deletedAt && !remote.deletedAt) {
      return {
        ...state, favorites: { ...state.favorites, [id]: { ...local, revision: remote.revision } },
        pending: { ...state.pending, [key]: { ...pending, baseRevision: remote.revision } },
      };
    }
    if (!acknowledged && remote.revision <= pending.baseRevision) return state;
    const { [key]: _removed, ...rest } = state.pending;
    return { ...state, favorites: { ...state.favorites, [id]: remote }, pending: rest };
  }
  return { ...state, favorites: { ...state.favorites, [id]: remote } };
}

export function inspirationImportGuest(
  state: InspirationPrivateState, guest: InspirationPrivateState, confirmed: boolean,
): InspirationPrivateState {
  if (!confirmed) throw new Error("Confirma la importación antes de copiar tus notas.");
  let next = state;
  const imported = new Set(state.importedGuestIds);
  for (const note of Object.values(guest.notes)) {
    const marker = `note:${note.id}`;
    if (note.deletedAt || imported.has(marker)) continue;
    // Stable IDs make retry/reimport idempotent. Never replace an existing user's text/tombstone.
    if (!next.notes[note.id]) next = inspirationPutNote(next, { ...note, revision: 0 }, true);
    imported.add(marker);
  }
  for (const favorite of Object.values(guest.favorites)) {
    const marker = `favorite:${favorite.inspirationId}`;
    if (favorite.deletedAt || imported.has(marker)) continue;
    if (!next.favorites[favorite.inspirationId]) {
      next = inspirationPutFavorite(next, { ...favorite, revision: 0 }, true);
    }
    imported.add(marker);
  }
  return { ...next, importedGuestIds: [...imported], importDismissed: true };
}

export function inspirationParseState(raw: string | null): InspirationPrivateState {
  if (!raw) return inspirationEmptyState();
  const value = JSON.parse(raw) as InspirationPrivateState;
  if (value.version !== 1 || !value.notes || !value.favorites || !value.pending ||
      !Array.isArray(value.importedGuestIds) || !Number.isSafeInteger(value.sequence)) {
    throw new Error("No se pudieron leer los datos privados de Inspiración. No se han sobrescrito.");
  }
  return value;
}

export function inspirationDateInZone(timezone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function inspirationWeekStart(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Fecha de inspiración no válida.");
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error("Fecha de inspiración no válida.");
  }
  parsed.setUTCDate(parsed.getUTCDate() - (parsed.getUTCDay() + 6) % 7);
  return parsed.toISOString().slice(0, 10);
}

export function inspirationWeekDates(date: string): string[] {
  const start = new Date(`${inspirationWeekStart(date)}T12:00:00Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(day.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
}