/**
 * cloudSync — sincroniza la actividad del usuario (eventos de reproducción,
 * favoritos y progreso por sesión) entre el dispositivo y la nube.
 * ─────────────────────────────────────────────────────────────────
 * Modelo híbrido / offline-first:
 *   - Los datos siguen viviendo en AsyncStorage (funciona sin cuenta y offline).
 *   - Cuando hay sesión de Clerk, sincronizamos con el server.
 *
 * Reglas de merge (clave para que los borrados converjan):
 *   - EVENTOS de reproducción: siempre unión (es un log append-only; el server
 *     deduplica por (userId, clientEventId), así que empujar todo es seguro).
 *   - FAVORITOS y PROGRESO:
 *       · Primera sincronización del dispositivo (firstSync=true): unión
 *         local ∪ server, para RECUPERAR lo que haya en la nube tras reinstalar
 *         la app o estrenar dispositivo, sin perder lo local.
 *       · Sincronizaciones siguientes (firstSync=false): lo LOCAL es autoritativo
 *         y reemplaza el set del server. Así un "desfavorito" hecho en este
 *         dispositivo persiste en la nube (con unión, reaparecería).
 *
 * Limitación conocida (Phase 1): no hay tombstones/LWW por ítem, así que la
 * convergencia de borrados entre VARIOS dispositivos en paralelo no está
 * garantizada (un borrado en A puede reaparecer si B lo tenía y sincroniza
 * después). El caso de un solo dispositivo + reinstalar/cambiar de equipo sí
 * funciona. Mejora futura: timestamps por ítem (`updatedAt` ya existe en la
 * tabla session_progress) o tombstones.
 *
 * Si falla la red, cada bloque cae en su catch y se reintenta en el próximo
 * arranque. Nunca lanza: devuelve al menos los datos locales.
 * ─────────────────────────────────────────────────────────────────
 */
import {
  getMyPlays,
  pushMyPlays,
  getMyFavorites,
  setMyFavorites,
  getMyProgress,
  setMyProgress,
} from "@workspace/api-client-react";

export interface SyncStatEvent {
  sessionId: string;
  categoryId: string;
  categoryLabel: string;
  minutes: number;
  /** Whether the session reached its natural/scheduled end. Optional for
   *  backward-compat with events stored before this field existed. */
  completed?: boolean;
  playedAt: string;
}

export interface ActivitySnapshot {
  statEvents: SyncStatEvent[];
  favorites: string[];
  progress: Record<string, number>;
}

const EVENTS_LIMIT = 600;

/** Clave estable para deduplicar un evento entre dispositivos y el server. */
function eventKey(e: SyncStatEvent): string {
  return `${e.sessionId}__${e.playedAt}`;
}

function sortByPlayedAtDesc(a: SyncStatEvent, b: SyncStatEvent): number {
  return new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime();
}

export interface SyncOptions {
  /**
   * True solo en la primera sincronización de este dispositivo (sin marca
   * persistida). Activa el modo "recuperar de la nube" (unión) para favoritos
   * y progreso. En las siguientes, lo local es autoritativo (los borrados
   * persisten). Ver doc del módulo.
   */
  firstSync: boolean;
}

export interface SyncResult extends ActivitySnapshot {
  /**
   * True si es seguro marcar este dispositivo como "ya sincronizado":
   * o bien NO era una primera sincronización, o bien las lecturas de
   * recuperación (plays + favoritos + progreso) tuvieron éxito.
   *
   * Si es false (p. ej. primer arranque offline), el llamador NO debe persistir
   * la marca de sincronizado: el próximo arranque debe reintentar en modo
   * firstSync. De lo contrario entraríamos en modo autoritativo-local y un local
   * vacío (tras reinstalar) sobrescribiría los favoritos/progreso de la nube.
   */
  recovered: boolean;
}

/**
 * Sincroniza la actividad con la nube y devuelve el snapshot fusionado
 * listo para reflejar en el estado de la app.
 */
export async function syncActivity(
  local: ActivitySnapshot,
  opts: SyncOptions,
): Promise<SyncResult> {
  const { firstSync } = opts;
  const merged: ActivitySnapshot = {
    statEvents: local.statEvents,
    favorites: local.favorites,
    progress: local.progress,
  };
  // En firstSync, cada lectura de recuperación debe confirmarse antes de
  // declarar el dispositivo como recuperado (ver SyncResult.recovered).
  let playsReadOk = false;
  let favsReadOk = false;
  let progressReadOk = false;

  // ── Eventos de reproducción (alimentan las estadísticas) ──────────────────
  try {
    const server = await getMyPlays();
    playsReadOk = true;
    const serverEvents: SyncStatEvent[] = server.events.map((ev) => ({
      sessionId: ev.sessionId,
      categoryId: ev.categoryId,
      categoryLabel: ev.categoryLabel,
      minutes: ev.minutes,
      completed: ev.completed,
      playedAt: ev.playedAt,
    }));

    const byKey = new Map<string, SyncStatEvent>();
    for (const e of serverEvents) byKey.set(eventKey(e), e);
    for (const e of local.statEvents) byKey.set(eventKey(e), e);
    merged.statEvents = Array.from(byKey.values())
      .sort(sortByPlayedAtDesc)
      .slice(0, EVENTS_LIMIT);

    if (local.statEvents.length > 0) {
      await pushMyPlays({
        events: local.statEvents.slice(0, EVENTS_LIMIT).map((e) => ({
          clientEventId: eventKey(e),
          sessionId: e.sessionId,
          categoryId: e.categoryId,
          categoryLabel: e.categoryLabel,
          minutes: e.minutes,
          completed: e.completed ?? false,
          contentType: null,
          source: null,
          playedAt: e.playedAt,
        })),
      });
    }
  } catch {
    // offline / error → conservamos lo local, reintentamos luego
  }

  // ── Favoritos ─────────────────────────────────────────────────────────────
  // firstSync: unión (recupera de la nube). Después: lo local manda y reemplaza
  // el set del server (el PUT hace delete+insert), así los borrados persisten.
  try {
    let next: string[];
    if (firstSync) {
      const server = await getMyFavorites();
      favsReadOk = true;
      next = Array.from(new Set([...server.sessionIds, ...local.favorites]));
    } else {
      next = Array.from(new Set(local.favorites));
    }
    merged.favorites = next;
    await setMyFavorites({ sessionIds: next });
  } catch {
    // offline / error → conservamos lo local
  }

  // ── Progreso por sesión ────────────────────────────────────────────────────
  // firstSync: unión server+local (local gana en conflicto, es la posición de
  // reanudación de este dispositivo). Después: lo local manda.
  try {
    let map: Record<string, number>;
    if (firstSync) {
      const server = await getMyProgress();
      progressReadOk = true;
      map = {};
      for (const it of server.items) map[it.sessionId] = it.progress;
      for (const [id, p] of Object.entries(local.progress)) map[id] = p;
    } else {
      map = { ...local.progress };
    }
    merged.progress = map;
    if (Object.keys(map).length > 0) {
      await setMyProgress({
        items: Object.entries(map).map(([sessionId, progress]) => ({ sessionId, progress })),
      });
    }
  } catch {
    // offline / error → conservamos lo local
  }

  const recovered = !firstSync || (playsReadOk && favsReadOk && progressReadOk);
  return { ...merged, recovered };
}
