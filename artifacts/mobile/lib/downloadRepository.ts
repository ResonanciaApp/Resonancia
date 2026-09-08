import AsyncStorage from "@react-native-async-storage/async-storage";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { AUDIO_MAP } from "@/config/audio-map";
import type { Session } from "@/data/sessions";

const MANIFEST_PREFIX = "@resonance_offline_downloads_v2";
const ROOT_DIRECTORY = FileSystem.documentDirectory;

export type DownloadStatus = "downloading" | "complete" | "failed";
export type OfflineDownload = {
  sessionId: string;
  audioIdentity: string;
  localUri?: string;
  status: DownloadStatus;
  progress: number;
  bytesDownloaded: number;
  totalBytes?: number;
  downloadedAt: string;
  error?: string;
};
type Manifest = Record<string, OfflineDownload>;

const memoryByOwner: Record<string, Manifest | undefined> = {};
const loadPromises: Record<string, Promise<Manifest> | undefined> = {};
const ownerQueues: Record<string, Promise<void> | undefined> = {};
const active: Record<string, FileSystem.DownloadResumable> = {};
const generations: Record<string, number> = {};
const inFlight = new Set<string>();
let nextGeneration = 1;

function safeOwnerScope(userId: string | null | undefined) {
  return encodeURIComponent(userId || "anonymous");
}

function manifestKey(owner: string) {
  return `${MANIFEST_PREFIX}:${owner}`;
}

function directory(owner: string) {
  if (!ROOT_DIRECTORY) {
    throw new Error("Las descargas offline están disponibles en la app instalada.");
  }
  return `${ROOT_DIRECTORY}resonance-downloads/${owner}/`;
}

export function offlineDownloadsSupported() {
  return !!ROOT_DIRECTORY;
}

export function downloadOwnerScope(userId: string | null | undefined) {
  return safeOwnerScope(userId);
}

export async function cancelOwnerTransfers(owner: string) {
  const keys = [...inFlight].filter((key) => key.startsWith(`${owner}:`));
  keys.forEach((key) => {
    generations[key] = nextGeneration++;
    inFlight.delete(key);
  });
  await Promise.all(
    keys.map((key) => active[key]?.pauseAsync().catch(() => undefined)),
  );
  keys.forEach((key) => delete active[key]);
}

async function load(owner: string): Promise<Manifest> {
  if (memoryByOwner[owner]) return memoryByOwner[owner]!;
  if (!loadPromises[owner]) {
    loadPromises[owner] = (async () => {
      try {
        const parsed = JSON.parse((await AsyncStorage.getItem(manifestKey(owner))) || "{}");
        memoryByOwner[owner] = parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? parsed as Manifest
          : {};
      } catch {
        memoryByOwner[owner] = {};
        await AsyncStorage.removeItem(manifestKey(owner)).catch(() => undefined);
      }
      return memoryByOwner[owner]!;
    })().finally(() => {
      delete loadPromises[owner];
    });
  }
  return loadPromises[owner]!;
}

async function save(owner: string, next: Manifest) {
  memoryByOwner[owner] = next;
  await AsyncStorage.setItem(manifestKey(owner), JSON.stringify(next));
}

function withOwnerQueue<T>(owner: string, operation: () => Promise<T>): Promise<T> {
  const previous = ownerQueues[owner] ?? Promise.resolve();
  const result = previous.catch(() => undefined).then(operation);
  ownerQueues[owner] = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function mutateManifest(
  owner: string,
  updater: (current: Manifest) => Manifest,
): Promise<Manifest> {
  return withOwnerQueue(owner, async () => {
    const next = updater({ ...(await load(owner)) });
    await save(owner, next);
    return next;
  });
}

function audioIdentity(session: Pick<Session, "id" | "audioUri">) {
  return session.audioUri ? `remote:${session.audioUri}` : `bundle:${session.id}`;
}

function audioExtension(session: Session) {
  const match = session.audioUri?.split("?")[0].match(/\.(mp3|m4a|aac|wav)$/i);
  return match?.[1]?.toLowerCase() ?? "mp3";
}

const filePrefix = (id: string) => encodeURIComponent(id);
const transferKey = (owner: string, sessionId: string) => `${owner}:${sessionId}`;
const target = (owner: string, session: Session) => `${directory(owner)}${filePrefix(session.id)}.${audioExtension(session)}`;
const temporaryTarget = (owner: string, session: Session) => `${target(owner, session)}.part`;

async function removeSessionFiles(owner: string, sessionId: string) {
  const prefix = filePrefix(sessionId);
  const ownerDirectory = directory(owner);
  const directoryInfo = await FileSystem.getInfoAsync(ownerDirectory);
  if (!directoryInfo.exists) return;
  const names = await FileSystem.readDirectoryAsync(ownerDirectory);
  await Promise.all(
    names
      .filter((name) => name === prefix || name.startsWith(`${prefix}.`))
      .map((name) =>
        FileSystem.deleteAsync(`${ownerDirectory}${name}`, { idempotent: true }).catch(() => undefined),
      ),
  );
}

function ownsTransfer(key: string, generation: number) {
  return generations[key] === generation;
}

async function reconcileDownloadsUnlocked(owner: string): Promise<OfflineDownload[]> {
  if (!offlineDownloadsSupported()) return [];
  const entries = { ...(await load(owner)) };
  const ownerDirectory = directory(owner);
  let dirty = false;
  for (const [id, item] of Object.entries(entries)) {
    if (
      !item
      || typeof item !== "object"
      || item.sessionId !== id
      || typeof item.audioIdentity !== "string"
      || !["downloading", "complete", "failed"].includes(item.status)
      || typeof item.progress !== "number"
      || !Number.isFinite(item.progress)
      || typeof item.bytesDownloaded !== "number"
      || !Number.isFinite(item.bytesDownloaded)
      || typeof item.downloadedAt !== "string"
      || !Number.isFinite(Date.parse(item.downloadedAt))
      || (item.localUri !== undefined && typeof item.localUri !== "string")
      || (typeof item.localUri === "string" && !item.localUri.startsWith(ownerDirectory))
      || (item.totalBytes !== undefined && typeof item.totalBytes !== "number")
      || (typeof item.totalBytes === "number" && !Number.isFinite(item.totalBytes))
    ) {
      delete entries[id];
      dirty = true;
      continue;
    }
    if (item.status === "downloading") {
      entries[id] = {
        ...item,
        status: "failed",
        progress: 0,
        error: "La descarga se interrumpió. Toca reintentar.",
      };
      dirty = true;
      continue;
    }
    const localInfo = item.localUri
      ? await FileSystem.getInfoAsync(item.localUri)
      : null;
    if (
      item.status === "complete"
      && (!localInfo?.exists || (localInfo.size ?? 0) < 1)
    ) {
      entries[id] = { ...item, status: "failed", progress: 0, localUri: undefined, error: "El archivo local ya no está disponible." };
      dirty = true;
    }
  }

  const directoryInfo = await FileSystem.getInfoAsync(ownerDirectory);
  if (directoryInfo.exists) {
    const referenced = new Set(
      Object.values(entries)
        .map((entry) => entry.localUri?.replace(ownerDirectory, ""))
        .filter((name): name is string => !!name),
    );
    const names = await FileSystem.readDirectoryAsync(ownerDirectory);
    await Promise.all(
      names
        .filter((name) => name.endsWith(".part") || !referenced.has(name))
        .map((name) =>
          FileSystem.deleteAsync(`${ownerDirectory}${name}`, { idempotent: true }).catch(() => undefined),
        ),
    );
  }

  if (dirty) await save(owner, entries);
  return Object.values(entries).sort((a, b) => +new Date(b.downloadedAt) - +new Date(a.downloadedAt));
}

export function reconcileDownloads(owner: string): Promise<OfflineDownload[]> {
  return withOwnerQueue(owner, () => reconcileDownloadsUnlocked(owner));
}

export async function getValidLocalUri(
  owner: string,
  session: Pick<Session, "id" | "audioUri">,
): Promise<string | null> {
  if (!offlineDownloadsSupported()) return null;
  const item = (await load(owner))[session.id];
  if (!item || item.status !== "complete" || !item.localUri) return null;
  if (item.audioIdentity !== audioIdentity(session)) return null;
  const info = await FileSystem.getInfoAsync(item.localUri);
  if (info.exists && (info.size ?? 0) > 0) return item.localUri;
  await reconcileDownloads(owner);
  return null;
}

export async function removeDownload(owner: string, sessionId: string) {
  const key = transferKey(owner, sessionId);
  generations[key] = nextGeneration++;
  await active[key]?.pauseAsync().catch(() => undefined);
  delete active[key];
  inFlight.delete(key);
  await removeSessionFiles(owner, sessionId);
  await mutateManifest(owner, (current) => {
    delete current[sessionId];
    return current;
  });
}

export async function clearDownloads(owner: string) {
  const ids = Object.keys(await load(owner));
  const scopedKeys = new Set([
    ...ids.map((id) => transferKey(owner, id)),
    ...[...inFlight].filter((key) => key.startsWith(`${owner}:`)),
  ]);
  scopedKeys.forEach((key) => {
    generations[key] = nextGeneration++;
    inFlight.delete(key);
  });
  await Promise.all(
    Object.entries(active)
      .filter(([key]) => key.startsWith(`${owner}:`))
      .map(([, download]) => download.pauseAsync().catch(() => undefined)),
  );
  Object.keys(active)
    .filter((key) => key.startsWith(`${owner}:`))
    .forEach((key) => delete active[key]);
  await FileSystem.deleteAsync(directory(owner), { idempotent: true }).catch(() => undefined);
  await mutateManifest(owner, () => ({}));
}

export async function downloadSession(
  owner: string,
  session: Session, token: string | null, onUpdate: (item: OfflineDownload) => void,
): Promise<OfflineDownload | null> {
  if (!offlineDownloadsSupported()) return null;
  const key = transferKey(owner, session.id);
  if (inFlight.has(key)) return null;
  inFlight.add(key);
  const generation = nextGeneration++;
  generations[key] = generation;
  const identity = audioIdentity(session);
  const base: OfflineDownload = {
    sessionId: session.id,
    audioIdentity: identity,
    status: "downloading", progress: 0, bytesDownloaded: 0, downloadedAt: new Date().toISOString(),
  };
  const destination = target(owner, session);
  const temporary = temporaryTarget(owner, session);
  try {
    const existing = (await load(owner))[session.id];
    if (!ownsTransfer(key, generation)) return null;
    if (
      existing?.status === "complete"
      && existing.audioIdentity === identity
      && await getValidLocalUri(owner, session)
    ) {
      return existing;
    }

    if (existing) await removeSessionFiles(owner, session.id);
    if (!ownsTransfer(key, generation)) return null;
    await FileSystem.makeDirectoryAsync(directory(owner), { intermediates: true });
    if (!ownsTransfer(key, generation)) return null;
    await mutateManifest(owner, (current) => ({ ...current, [session.id]: base }));
    if (!ownsTransfer(key, generation)) return null;
    onUpdate(base);

    await FileSystem.deleteAsync(temporary, { idempotent: true });
    if (!session.audioUri) {
      const assetModule = AUDIO_MAP[session.id];
      if (!assetModule) throw new Error("Esta sesión no tiene un audio descargable.");
      const asset = Asset.fromModule(assetModule as number);
      await asset.downloadAsync();
      if (!asset.localUri) throw new Error("No se pudo preparar el audio incluido.");
      await FileSystem.copyAsync({ from: asset.localUri, to: temporary });
      if (!ownsTransfer(key, generation)) {
        await FileSystem.deleteAsync(temporary, { idempotent: true }).catch(() => undefined);
        return null;
      }
      await FileSystem.moveAsync({ from: temporary, to: destination });
      if (!ownsTransfer(key, generation)) {
        await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => undefined);
        return null;
      }
      const info = await FileSystem.getInfoAsync(destination);
      const bytes = info.exists && "size" in info ? info.size : 0;
      const done = { ...base, status: "complete" as const, progress: 1, bytesDownloaded: bytes, totalBytes: bytes, localUri: destination };
      await mutateManifest(owner, (current) =>
        ownsTransfer(key, generation) ? { ...current, [session.id]: done } : current,
      );
      if (!ownsTransfer(key, generation)) {
        await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => undefined);
        return null;
      }
      if (ownsTransfer(key, generation)) onUpdate(done);
      return done;
    }
    const resumable = FileSystem.createDownloadResumable(session.audioUri, temporary,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        const progress = totalBytesExpectedToWrite > 0 ? totalBytesWritten / totalBytesExpectedToWrite : 0;
        const update = { ...base, progress, bytesDownloaded: totalBytesWritten, totalBytes: totalBytesExpectedToWrite };
        if (!ownsTransfer(key, generation)) return;
        onUpdate(update);
      });
    active[key] = resumable;
    const result = await resumable.downloadAsync();
    delete active[key];
    if (!ownsTransfer(key, generation)) {
      await FileSystem.deleteAsync(temporary, { idempotent: true }).catch(() => undefined);
      return null;
    }
    const info = result?.uri ? await FileSystem.getInfoAsync(result.uri) : null;
    if (!result?.uri || !info?.exists || (info.size ?? 0) < 1) throw new Error("La descarga quedó incompleta.");
    await FileSystem.moveAsync({ from: result.uri, to: destination });
    if (!ownsTransfer(key, generation)) {
      await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => undefined);
      return null;
    }
    const done = { ...base, status: "complete" as const, progress: 1, localUri: destination, bytesDownloaded: info.size ?? 0, totalBytes: info.size };
    if (!ownsTransfer(key, generation)) return null;
    await mutateManifest(owner, (current) =>
      ownsTransfer(key, generation) ? { ...current, [session.id]: done } : current,
    );
    if (!ownsTransfer(key, generation)) {
      await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => undefined);
      return null;
    }
    if (ownsTransfer(key, generation)) onUpdate(done);
    return done;
  } catch (cause) {
    delete active[key];
    await FileSystem.deleteAsync(temporary, { idempotent: true }).catch(() => undefined);
    if (!ownsTransfer(key, generation)) return null;
    const failed = { ...base, status: "failed" as const, error: cause instanceof Error ? cause.message : "No se pudo descargar." };
    await mutateManifest(owner, (current) => ({ ...current, [session.id]: failed })).catch(() => undefined);
    if (ownsTransfer(key, generation)) onUpdate(failed);
    return failed;
  } finally {
    if (ownsTransfer(key, generation)) inFlight.delete(key);
  }
}