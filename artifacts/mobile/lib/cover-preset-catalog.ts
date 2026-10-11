import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  listCoverPresets,
  type CoverPreset,
  type CoverPresetScope,
} from "@workspace/api-client-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  PLAYLIST_COVER_PRESETS,
} from "@/data/default-playlist-covers";
import {
  REFLECTION_STORY_COVER_PRESETS,
} from "@/data/default-reflection-story-covers";
import { resolveAvatarUrl } from "@/lib/avatar";
import {
  resolveCatalogRecord,
  padWithBootstrap,
} from "@/lib/cover-preset-catalog-logic";
import { parseCatalogEnvelope, type AvatarCategory } from "@/lib/profile-avatar-categories";

export type { AvatarCategory } from "@/lib/profile-avatar-categories";

export type CoverCatalogScope = CoverPresetScope;
export type CoverCatalogItem = {
  id: string;
  key: string;
  label: string;
  isLocked?: boolean;
  source: number | { uri: string };
  fallbackSource?: number;
  builtinKey?: string | null;
  objectPath?: string | null;
  categoryIds?: string[];
};

const CACHE_PREFIX = "@resonance_cover_catalog:";
const bundledByKey = new Map([
  ...PLAYLIST_COVER_PRESETS.map((preset) => [preset.id, preset] as const),
]);
const memoryCatalog = new Map<CoverCatalogScope, CoverPreset[]>();
const memoryCategories = new Map<CoverCatalogScope, AvatarCategory[]>();
/** Incremented each time a fresh server response has been validated. */
const authoritativeRevision = new Map<CoverCatalogScope, number>();
const loading = new Map<CoverCatalogScope, Promise<void>>();

export function bundledCoverCatalog(scope: CoverCatalogScope): CoverCatalogItem[] {
  return resolveCoverCatalog(bundledRawCatalog(scope));
}

function bundledRawCatalog(scope: CoverCatalogScope): CoverPreset[] {
  let defaultPresets = PLAYLIST_COVER_PRESETS;
  if (scope === "reflection-story") {
    defaultPresets = REFLECTION_STORY_COVER_PRESETS;
  }
  return defaultPresets.map((preset, index) => ({
    id: scope === "reflection-story"
      ? `${scope}:${String(index + 1).padStart(2, "0")}`
      : `${scope}:${preset.id}`,
    scope,
    key: scope === "reflection-story"
      ? String(index + 1).padStart(2, "0")
      : preset.id,
    label: preset.label,
    isLocked: false,
    sortOrder: index,
    source: "builtin",
    builtinKey: scope === "reflection-story"
      ? (preset as (typeof REFLECTION_STORY_COVER_PRESETS)[number]).builtinKey
      : preset.id,
    objectPath: null,
  }));
}

function resolveItem(item: CoverPreset): CoverCatalogItem | null {
  const reflectionSlot = item.scope === "reflection-story"
    ? REFLECTION_STORY_COVER_PRESETS[Number.parseInt(item.key, 10) - 1]
    : undefined;
  const builtin = (item.builtinKey ? bundledByKey.get(item.builtinKey) : undefined) ?? reflectionSlot;
  const remote = item.objectPath ? resolveAvatarUrl(item.objectPath) : null;
  const resolved = resolveCatalogRecord<number | { uri: string }>(
    item,
    builtin?.source,
    remote ? { uri: remote } : undefined,
  );
  if (!resolved) return null;
  return {
    ...resolved,
    categoryIds: item.scope === "profile" ? [...new Set(item.categoryIds ?? [])] : undefined,
    source: item.scope === "reflection-story" && remote ? { uri: remote } : resolved.source,
    fallbackSource: remote ? builtin?.source : undefined,
  };
}

export function resolveCoverCatalog(items: CoverPreset[], scope?: CoverCatalogScope): CoverCatalogItem[] {
  let resolved = items.map(resolveItem).filter((item): item is CoverCatalogItem => item !== null);

  if (scope === "reflection-story") {
    const bootstrap = bundledCoverCatalog(scope);
    resolved = padWithBootstrap(resolved, bootstrap);
  }

  return resolved;
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
      // Accepts the legacy array cache and the new { categories, presets } envelope.
      const parsed = parseCatalogEnvelope<CoverPreset>(JSON.parse(cached), scope);
      if (parsed && !memoryCatalog.has(scope)) {
        memoryCatalog.set(scope, parsed.presets);
        memoryCategories.set(scope, scope === "profile" ? parsed.categories : []);
      }
    } catch {
      // Ignore corrupt cache and use bundled defaults.
    }
  }
  if (!memoryCatalog.has(scope)) memoryCatalog.set(scope, bundledRawCatalog(scope));
}

async function refresh(scope: CoverCatalogScope): Promise<void> {
  try {
    const response = await listCoverPresets({ scope });
    const parsed = parseCatalogEnvelope<CoverPreset>(response, scope);
    // Corrupt metadata never replaces the last valid snapshot.
    if (!parsed) return;
    const categories = scope === "profile" ? parsed.categories : [];
    // A successful response is authoritative, including deletions.
    memoryCatalog.set(scope, parsed.presets);
    memoryCategories.set(scope, categories);
    authoritativeRevision.set(scope, (authoritativeRevision.get(scope) ?? 0) + 1);
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${scope}`,
      JSON.stringify({ categories, presets: parsed.presets }),
    );
  } catch {
    // Keep the complete last-valid snapshot. Never re-add deleted entries.
  }
}

export function useCoverPresetCatalog(scope: CoverCatalogScope): CoverCatalogItem[] {
  return useCoverPresetCatalogState(scope).items;
}

export function useCoverPresetCatalogState(scope: CoverCatalogScope): {
  items: CoverCatalogItem[];
  categories: AvatarCategory[];
  /** > 0 once a fresh server catalog has been validated in this app session. */
  authoritativeRevision: number;
  hydrated: boolean;
  refresh: () => Promise<void>;
} {
  const [version, setVersion] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const refreshCatalog = useCallback(async () => {
    await refresh(scope);
    setVersion((value) => value + 1);
  }, [scope]);
  useEffect(() => {
    let active = true;
    setHydrated(false);
    const existing = loading.get(scope);
    const task = existing ?? (async () => {
      await hydrate(scope);
      await refresh(scope);
    })();
    loading.set(scope, task);
    task.then(() => {
      if (active) {
        setVersion((value) => value + 1);
        setHydrated(true);
      }
    }).finally(() => {
      if (loading.get(scope) === task) loading.delete(scope);
    });
    return () => {
      active = false;
    };
  }, [scope]);
  const items = useMemo(() => {
    void version;
    return resolveCoverCatalog(memoryCatalog.get(scope) ?? bundledRawCatalog(scope), scope);
  }, [scope, version]);
  const categories = useMemo(() => {
    void version;
    return memoryCategories.get(scope) ?? [];
  }, [scope, version]);
  void version;
  const revision = authoritativeRevision.get(scope) ?? 0;
  return { items, categories, authoritativeRevision: revision, hydrated, refresh: refreshCatalog };
}

export function resetCoverPresetCatalogForTests(): void {
  memoryCatalog.clear();
  memoryCategories.clear();
  authoritativeRevision.clear();
  loading.clear();
}