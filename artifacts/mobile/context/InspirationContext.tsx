import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import { useAuth as useClerkAuth } from "@clerk/expo";
import * as Crypto from "expo-crypto";
import {
  getInspirationFavorites, getInspirationNotes, putInspirationFavorite, putInspirationNote,
  type InspirationFavorite as RemoteFavorite, type InspirationNote as RemoteNote,
  type InspirationWeek, type InspirationDay,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import {
  inspirationEmptyState, inspirationImportGuest, inspirationMergeFavorite,
  inspirationMergeNote, inspirationParseState, inspirationPutFavorite, inspirationPutNote,
  inspirationStorageKey, inspirationDateInZone,
  type InspirationPrivateState, type InspirationNote, type InspirationFavorite,
} from "@/lib/inspiration-state";
import {
  INSPIRATION_CATALOG_KEY, inspirationAcceptWeek, inspirationParseCatalog, inspirationGateWeek,
  inspirationWithdrawSavedDays,
  inspirationWeekRequestedAt,
  createInspirationCatalogPersistence,
  type InspirationCatalogCache,
} from "@/lib/inspiration-cache";
import { inspirationAccountLifecycle } from "@/lib/inspiration-lifecycle";

export type InspirationSyncStatus = "loading" | "guest" | "idle" | "syncing" | "pending" | "error";
type Session = {
  owner: string | null;
  state: InspirationPrivateState;
  ready: boolean;
  writes: Promise<unknown>;
  abort: AbortController;
  syncing: boolean;
};
type Transform = (state: InspirationPrivateState) => InspirationPrivateState;
const message = (error: unknown) => error instanceof Error ? error.message : "No se pudo sincronizar Inspiración. Vuelve a intentarlo.";
const fromNote = (note: RemoteNote): InspirationNote => ({
  id: note.id, inspirationId: note.inspirationId, text: note.text, revision: note.revision,
  updatedAt: note.updatedAt, deletedAt: note.deleted ? note.updatedAt : null, date: note.date,
});
const fromFavorite = (favorite: RemoteFavorite, timeZone: string): InspirationFavorite => ({
  inspirationId: favorite.inspirationId, revision: favorite.revision,
  updatedAt: favorite.updatedAt, deletedAt: favorite.deleted ? favorite.updatedAt : null,
  day: favorite.day, date: favorite.day?.date, timeZone,
});
const timezoneNow = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const validateText = (text: string) => {
  if (!text.trim()) throw new Error("Escribe una nota antes de guardar.");
  if (text.length > 20_000) throw new Error("La nota admite hasta 20.000 caracteres.");
};

interface InspirationContextValue {
  ready: boolean;
  owner: string | null;
  state: InspirationPrivateState;
  catalog: InspirationCatalogCache;
  catalogError: string | null;
  acceptWeek: (week: InspirationWeek, receivedAt: number) => Promise<void>;
  syncStatus: InspirationSyncStatus;
  pendingCount: number;
  syncError: string | null;
  retrySync: () => Promise<void>;
  favorites: InspirationFavorite[];
  notes: InspirationNote[];
  isFavorite: (id: string) => boolean;
  setFavorite: (id: string, saved: boolean) => Promise<void>;
  listNotes: (id?: string) => InspirationNote[];
  createNote: (inspirationId: string, text: string) => Promise<InspirationNote>;
  updateNote: (id: string, text: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  guestImportAvailable: boolean;
  importGuestData: (consent: { confirmed: true }) => Promise<void>;
  dismissGuestImport: () => Promise<void>;
}
export const InspirationContext = createContext<InspirationContextValue | null>(null);
const EMPTY = inspirationEmptyState();

/** Parent must mount inside existing AuthProvider and QueryClientProvider. */
export function InspirationProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { getToken, userId: clerkOwner, isLoaded: clerkLoaded } = useClerkAuth();
  const owner = auth.isSignedIn ? auth.clerkUserId : null;
  const ownerRef = useRef(owner);
  ownerRef.current = owner;
  const authReady = useRef(false);
  authReady.current = !auth.authLoading && !!clerkLoaded && owner === (clerkOwner ?? null);
  const tokenGetter = useRef(getToken);
  tokenGetter.current = getToken;
  const active = useRef<Session | null>(null);
  const privateWrites = useRef(new Map<string, Promise<unknown>>());
  const [snapshot, setSnapshot] = useState<{ session: Session; state: InspirationPrivateState } | null>(null);
  const [failure, setFailure] = useState<{ session: Session; error: string } | null>(null);
  const [syncing, setSyncing] = useState<Session | null>(null);
  const [guest, setGuest] = useState<InspirationPrivateState>(EMPTY);
  const [catalog, setCatalog] = useState<InspirationCatalogCache>({});
  const catalogRef = useRef<InspirationCatalogCache>({});
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const catalogPersistence = useMemo(() => createInspirationCatalogPersistence(
    (error) => setCatalogError(error === null ? null : message(error)),
  ), []);

  const isCurrent = useCallback((session: Session) => (
    active.current === session && ownerRef.current === session.owner &&
    authReady.current && !session.abort.signal.aborted &&
    !inspirationAccountLifecycle.isRevoked(session.owner)
  ), []);

  const transact = useCallback((session: Session, transform: Transform): Promise<void> => {
    const work = session.writes.catch(() => undefined).then(async () => {
      if (!isCurrent(session) || !session.ready) throw new Error("La cuenta cambió. Vuelve a abrir Inspiración.");
      const next = transform(session.state);
      if (next === session.state) return;
      // Persist before reporting success. A rejected disk write never erases the previous state.
      await AsyncStorage.setItem(inspirationStorageKey(session.owner), JSON.stringify(next));
      session.state = next;
      if (isCurrent(session)) setSnapshot({ session, state: next });
    });
    session.writes = work;
    inspirationAccountLifecycle.trackWrite(session.owner, work);
    privateWrites.current.set(inspirationStorageKey(session.owner), work);
    return work.catch((error) => {
      if (isCurrent(session)) setFailure({ session, error: message(error) });
      throw error;
    });
  }, [isCurrent]);

  useEffect(() => {
    if (!authReady.current) return;
    const session: Session = {
      owner, state: inspirationEmptyState(), ready: false, writes: Promise.resolve(),
      abort: new AbortController(), syncing: false,
    };
    active.current = session;
    setFailure(null);
    setSnapshot(null);
    setGuest(EMPTY);
    const unregister = owner ? inspirationAccountLifecycle.register(owner, () => {
      session.abort.abort();
      session.ready = false;
      if (active.current === session) {
        active.current = null;
        setSnapshot(null);
        setSyncing(null);
        setGuest(EMPTY);
      }
    }) : () => undefined;
    if (session.abort.signal.aborted) return unregister;
    const key = inspirationStorageKey(owner);
    Promise.all([
      // A rapid logout/login of the same account must wait for its last disk write.
      (privateWrites.current.get(key) ?? Promise.resolve()).catch(() => undefined)
        .then(() => AsyncStorage.getItem(key)),
      owner ? AsyncStorage.getItem(inspirationStorageKey(null)) : Promise.resolve(null),
    ]).then(([raw, guestRaw]) => {
      if (!isCurrent(session)) return;
      session.state = inspirationParseState(raw);
      session.ready = true;
      setGuest(inspirationParseState(guestRaw));
      setSnapshot({ session, state: session.state });
    }).catch((error) => {
      if (isCurrent(session)) setFailure({ session, error: message(error) });
    });
    return () => { session.abort.abort(); unregister(); };
  }, [owner, auth.authLoading, clerkOwner, clerkLoaded, isCurrent]);

  useEffect(() => {
    let cancelled = false;
    void catalogPersistence.load(async () => inspirationParseCatalog(
      await AsyncStorage.getItem(INSPIRATION_CATALOG_KEY),
    ), (disk) => {
      const next = { ...catalogRef.current };
      for (const [key, entry] of Object.entries(disk)) {
        if (!next[key] || next[key].receivedAt < entry.receivedAt) next[key] = entry;
      }
      catalogRef.current = next;
      setCatalog(next);
    }, () => !cancelled);
    return () => { cancelled = true; };
  }, [catalogPersistence]);

  const persistCatalog = useCallback(async () => {
    // Serialize cache writes; a slow older write must not resurrect a withdrawn snapshot.
    await catalogPersistence.save(() =>
      AsyncStorage.setItem(INSPIRATION_CATALOG_KEY, JSON.stringify(catalogRef.current)),
    );
  }, [catalogPersistence]);

  const acceptWeek = useCallback(async (week: InspirationWeek, receivedAt: number) => {
    const next = inspirationAcceptWeek(catalogRef.current, week, receivedAt, inspirationWeekRequestedAt(week));
    if (next === catalogRef.current) return;
    catalogRef.current = next;
    setCatalog(next);
    await persistCatalog();
  }, [persistCatalog]);

  const retrySync = useCallback(async () => {
    const session = active.current;
    if (!session || !isCurrent(session) || session.syncing) return;
    if (!session.ready) {
      try {
        session.state = inspirationParseState(await AsyncStorage.getItem(inspirationStorageKey(session.owner)));
        if (!isCurrent(session)) return;
        session.ready = true;
        setSnapshot({ session, state: session.state });
        setFailure(null);
      } catch (error) {
        if (isCurrent(session)) setFailure({ session, error: message(error) });
      }
      return;
    }
    if (!session.owner) { setFailure(null); return; }
    session.syncing = true;
    setSyncing(session);
    setFailure(null);
    try {
      const token = await tokenGetter.current();
      if (!isCurrent(session)) return;
      if (!token) throw new Error("Tu sesión expiró. Inicia sesión para sincronizar tus notas.");
      // Pin the token to this owner. Never use the mutable global auth getter for queued writes.
      const options: RequestInit = { headers: { Authorization: `Bearer ${token}` }, signal: session.abort.signal };
      const timeZone = timezoneNow();
      const pull = async () => {
        if (!isCurrent(session)) return;
        const [remoteNotes, remoteFavorites] = await Promise.all([
          getInspirationNotes(undefined, options),
          getInspirationFavorites({ timeZone }, options),
        ]);
        if (!isCurrent(session)) return;
        await transact(session, (state) => {
          let next = state;
          for (const note of remoteNotes.items) next = inspirationMergeNote(next, fromNote(note), Crypto.randomUUID);
          for (const favorite of remoteFavorites.items) next = inspirationMergeFavorite(next, fromFavorite(favorite, timeZone));
          return next;
        });
        const nextCatalog = inspirationWithdrawSavedDays(catalogRef.current, remoteFavorites.items, timeZone, Date.now());
        if (nextCatalog !== catalogRef.current) {
          catalogRef.current = nextCatalog;
          setCatalog(nextCatalog);
          await persistCatalog();
        }
      };
      // Read tombstones BEFORE sending offline operations; never push an authoritative whole set.
      await pull();
      if (!isCurrent(session)) return;
      // Bound one pass; edits arriving during a request remain queued for the following pass.
      const queued = Object.values(session.state.pending);
      let conflict = false;
      let itemError: string | null = null;
      for (const operation of queued) {
        if (!isCurrent(session)) return;
        const key = `${operation.kind}:${operation.id}`;
        const latest = session.state.pending[key];
        if (!latest || latest.sequence !== operation.sequence) continue;
        try {
          if (operation.kind === "note") {
            const note = session.state.notes[operation.id];
            const remote = await putInspirationNote(note.id, {
              revision: operation.baseRevision, inspirationId: note.inspirationId,
              text: note.text, deleted: !!note.deletedAt,
            }, { timeZone }, options);
            if (!isCurrent(session)) return;
            await transact(session, (state) => inspirationMergeNote(state, fromNote(remote), Crypto.randomUUID, operation));
          } else {
            const favorite = session.state.favorites[operation.id];
            const remote = await putInspirationFavorite(favorite.inspirationId, {
              revision: operation.baseRevision, deleted: !!favorite.deletedAt,
            }, { timeZone }, options);
            if (!isCurrent(session)) return;
            await transact(session, (state) => inspirationMergeFavorite(state, fromFavorite(remote, timeZone), operation));
          }
        } catch (error) {
          if ((error as { status?: number })?.status === 409) {
            // Pull, preserve losing text, and leave rebased deletions pending. No blind overwrite.
            await pull();
            conflict = true;
            continue;
          }
          if ([400, 404, 422].includes((error as { status?: number })?.status ?? 0)) {
            // A withdrawn inspiration must not prevent unrelated notes/removals syncing.
            itemError = message(error);
            continue;
          }
          throw error;
        }
      }
      if ((itemError || conflict) && isCurrent(session)) {
        setFailure({ session, error: itemError ?? "Se detectaron cambios en otro dispositivo. Revisa las copias recuperadas de tus notas." });
      }
    } catch (error) {
      if (isCurrent(session)) setFailure({ session, error: message(error) });
    } finally {
      session.syncing = false;
      if (isCurrent(session)) setSyncing(null);
    }
  }, [isCurrent, transact, persistCatalog]);

  const visible = snapshot && snapshot.session.owner === owner && authReady.current &&
    active.current === snapshot.session && !snapshot.session.abort.signal.aborted &&
    !inspirationAccountLifecycle.isRevoked(owner) ? snapshot : null;
  const state = visible?.state ?? EMPTY;
  const pendingCount = Object.keys(state.pending).length;
  const ready = !!visible;
  useEffect(() => {
    if (!ready || !owner) return;
    const timer = setTimeout(() => { void retrySync(); }, 600);
    return () => clearTimeout(timer);
  }, [ready, owner, state.sequence, retrySync]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (value) => {
      if (value === "active") void retrySync();
    });
    // Retry pending operations without depending on a native connectivity package.
    const timer = setInterval(() => {
      if (AppState.currentState === "active" && Object.keys(active.current?.state.pending ?? {}).length) void retrySync();
    }, 30_000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, [retrySync]);

  const requireSession = useCallback(() => {
    const session = active.current;
    if (!session || !session.ready || !isCurrent(session)) {
      throw new Error("Espera a que se carguen tus notas antes de guardar.");
    }
    return session;
  }, [isCurrent]);
  const availableDay = useCallback((id: string): InspirationDay | undefined => {
    const zone = timezoneNow();
    const today = inspirationDateInZone(zone);
    for (const { week } of Object.values(catalogRef.current)) {
      if (week.timeZone !== zone) continue;
      const day = inspirationGateWeek(week, today).days.find((d) => d.id === id && d.status === "available");
      if (day) return day;
    }
    return undefined;
  }, []);
  const setFavorite = useCallback(async (id: string, saved: boolean) => {
    const session = requireSession();
    const day = availableDay(id);
    if (saved && !day) throw new Error("Esta inspiración no está disponible para guardar.");
    await transact(session, (current) => {
      const previous = current.favorites[id];
      if (previous && !previous.deletedAt === saved) return current;
      const now = new Date().toISOString();
      return inspirationPutFavorite(current, {
        inspirationId: id, revision: previous?.revision ?? 0, updatedAt: now,
        deletedAt: saved ? null : now, day: day ?? previous?.day, date: day?.date ?? previous?.date,
        timeZone: timezoneNow(),
      }, !!session.owner);
    });
  }, [requireSession, availableDay, transact]);
  const createNote = useCallback(async (inspirationId: string, text: string) => {
    validateText(text);
    const session = requireSession();
    const day = availableDay(inspirationId);
    if (!day) throw new Error("Esta inspiración no está disponible para crear una nota.");
    const note: InspirationNote = {
      id: Crypto.randomUUID(), inspirationId, text, revision: 0, updatedAt: new Date().toISOString(),
      deletedAt: null, date: day.date,
    };
    await transact(session, (current) => inspirationPutNote(current, note, !!session.owner));
    return note;
  }, [requireSession, availableDay, transact]);
  const updateNote = useCallback(async (id: string, text: string) => {
    validateText(text);
    const session = requireSession();
    await transact(session, (current) => {
      const note = current.notes[id];
      if (!note || note.deletedAt) throw new Error("La nota ya no está disponible.");
      return inspirationPutNote(current, {
        ...note, text, localOnly: false, updatedAt: new Date().toISOString(),
      }, !!session.owner);
    });
  }, [requireSession, transact]);
  const deleteNote = useCallback(async (id: string) => {
    const session = requireSession();
    await transact(session, (current) => {
      const note = current.notes[id];
      if (!note || note.deletedAt) return current;
      const now = new Date().toISOString();
      return inspirationPutNote(current, { ...note, deletedAt: now, updatedAt: now }, !!session.owner);
    });
  }, [requireSession, transact]);
  const importGuestData = useCallback(async ({ confirmed }: { confirmed: true }) => {
    const session = requireSession();
    if (!session.owner) throw new Error("Inicia sesión antes de importar notas.");
    const source = inspirationParseState(await AsyncStorage.getItem(inspirationStorageKey(null)));
    await transact(session, (current) => inspirationImportGuest(current, source, confirmed === true));
  }, [requireSession, transact]);
  const dismissGuestImport = useCallback(async () => {
    const session = requireSession();
    await transact(session, (current) => ({ ...current, importDismissed: true }));
  }, [requireSession, transact]);

  const notes = useMemo(() => Object.values(state.notes).filter((note) => !note.deletedAt)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [state.notes]);
  const favorites = useMemo(() => Object.values(state.favorites).filter((favorite) => !favorite.deletedAt)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [state.favorites]);
  const syncError = failure && failure.session.owner === owner && active.current === failure.session
    ? failure.error : null;
  const syncStatus: InspirationSyncStatus = syncError ? "error" : !ready ? "loading" : !owner ? "guest" :
    syncing === active.current ? "syncing" : pendingCount ? "pending" : "idle";
  const guestImportAvailable = !!owner && ready && !state.importDismissed && (
    Object.values(guest.notes).some((note) => !note.deletedAt && !state.importedGuestIds.includes(`note:${note.id}`)) ||
    Object.values(guest.favorites).some((favorite) => !favorite.deletedAt &&
      !state.importedGuestIds.includes(`favorite:${favorite.inspirationId}`))
  );
  const value = useMemo<InspirationContextValue>(() => ({
    ready, owner, state, catalog, catalogError, acceptWeek, syncStatus, pendingCount, syncError, retrySync,
    notes, favorites, isFavorite: (id) => !!state.favorites[id] && !state.favorites[id].deletedAt,
    listNotes: (id) => id ? notes.filter((note) => note.inspirationId === id) : notes,
    setFavorite, createNote, updateNote, deleteNote, guestImportAvailable, importGuestData, dismissGuestImport,
  }), [ready, owner, state, catalog, catalogError, acceptWeek, syncStatus, pendingCount, syncError, retrySync,
    notes, favorites, setFavorite, createNote, updateNote, deleteNote, guestImportAvailable, importGuestData, dismissGuestImport]);
  return <InspirationContext.Provider value={value}>{children}</InspirationContext.Provider>;
}

export function useInspirationContext() {
  const value = useContext(InspirationContext);
  if (!value) throw new Error("useInspiration requiere InspirationProvider dentro de AuthProvider.");
  return value;
}

/**
 * Call immediately after confirmed SERVER deletion, BEFORE removeLocalAccountData
 * and logout. Stops active owners, drains even unmounted providers' disk writes,
 * then removes the key. Ordinary logout must retain offline pending work.
 */
export async function clearInspirationAccountData(owner: string) {
  await inspirationAccountLifecycle.clear(owner, () => AsyncStorage.removeItem(inspirationStorageKey(owner)));
}
