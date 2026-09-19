import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  listCoverPresets,
  type CoverPreset,
  type CoverPresetScope,
} from "@workspace/api-client-react";
import { useEffect, useMemo, useState } from "react";

import {
  PLAYLIST_COVER_PRESETS,
} from "@/data/default-playlist-covers";
import { resolveAvatarUrl } from "@/lib/avatar";
import {
  resolveCatalogRecord,
} from "@/lib/cover-preset-catalog-logic";

export type CoverCatalogScope = CoverPresetScope;
export type CoverCatalogItem = {
  id: string;
  key: string;
  label: string;
  source: number | { uri: string };
  builtinKey?: string | null;
  objectPath?: string | null;
};

const CACHE_PREFIX = "@resonance_cover_catalog:";
const bundledByKey = new Map(PLAYLIST_COVER_PRESETS.map((preset) => [preset.id, preset]));
const memoryCatalog = new Map<CoverCatalogScope, CoverPreset[]>();
const loading = new Map<CoverCatalogScope, Promise<void>>();

export function bundledCoverCatalog(scope: CoverCatalogScope): CoverCatalogItem[] {
  return resolveCoverCatalog(bundledRawCatalog(scope));
}

function bundledRawCatalog(scope: CoverCatalogScope): CoverPreset[] {
  return PLAYLIST_COVER_PRESETS.map((preset) => ({
    id: `${scope}:${preset.id}`,
    scope,
    key: preset.id,
    label: preset.label,
    sortOrder: PLAYLIST_COVER_PRESETS.indexOf(preset),
    source: "builtin",
    builtinKey: preset.id,
    objectPath: null,
  }));
}

function resolveItem(item: CoverPreset): CoverCatalogItem | null {
  const builtin = item.builtinKey ? bundledByKey.get(item.builtinKey) : undefined;
  const remote = item.objectPath ? resolveAvatarUrl(item.objectPath) : null;
  return resolveCatalogRecord<number | { uri: string }>(
    item,
    builtin?.source,
    remote ? { uri: remote } : undefined,
  );
}

export function resolveCoverCatalog(items: CoverPreset[]): CoverCatalogItem[] {
  return items.map(resolveItem).filter((item): item is CoverCatalogItem => item !== null);
}

export function catalogImage(
  scope: CoverCatalogScope,
  key: string | undefined,
): number | { uri: string } | undefined {
  if (!key) return undefined;
  const item = memoryCatalog.get(scope)?.find((candidate) => candidate.key === key || candidate.id === key);
  return item ? resolveItem(item)?.source : bundledByKey.get(key)?.source;
}

async function hydrate(scope: CoverCatalogScope): Promise<void> {
  const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${scope}`);
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as CoverPreset[];
      if (Array.isArray(parsed)) memoryCatalog.set(scope, parsed);
    } catch {
      // Ignore corrupt cache and use bundled defaults.
    }
  }
  if (!memoryCatalog.has(scope)) memoryCatalog.set(scope, bundledRawCatalog(scope));
}

async function refresh(scope: CoverCatalogScope): Promise<void> {
  try {
    const response = await listCoverPresets({ scope });
    const next = response.presets;
    // A successful response is authoritative, including deletions.
    memoryCatalog.set(scope, next);
    await AsyncStorage.setItem(`${CACHE_PREFIX}${scope}`, JSON.stringify(next));
  } catch {
    // Keep the complete last-valid snapshot. Never re-add deleted entries.
  }
}

export function useCoverPresetCatalog(scope: CoverCatalogScope): CoverCatalogItem[] {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    const existing = loading.get(scope);
    const task = existing ?? (async () => {
      await hydrate(scope);
      await refresh(scope);
    })();
    loading.set(scope, task);
    task.then(() => {
      if (active) setVersion((value) => value + 1);
    }).finally(() => {
      if (loading.get(scope) === task) loading.delete(scope);
    });
    return () => {
      active = false;
    };
  }, [scope]);
  return useMemo(() => {
    void version;
    return resolveCoverCatalog(memoryCatalog.get(scope) ?? bundledRawCatalog(scope));
  }, [scope, version]);
}

export function resetCoverPresetCatalogForTests(): void {
  memoryCatalog.clear();
  loading.clear();
}