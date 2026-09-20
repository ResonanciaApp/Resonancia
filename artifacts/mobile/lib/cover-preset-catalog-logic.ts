export type CatalogRecord = {
  id: string;
  key: string;
  label: string;
  builtinKey?: string | null;
  objectPath?: string | null;
};

export type ResolvedCatalogRecord<T> = CatalogRecord & { source: T };

export function authoritativeSnapshot<T>(
  response: ResolvedCatalogRecord<T>[] | null,
  cached: ResolvedCatalogRecord<T>[],
  bootstrap: ResolvedCatalogRecord<T>[],
): ResolvedCatalogRecord<T>[] {
  return response ?? (cached.length > 0 ? cached : bootstrap);
}

export function padWithBootstrap<T>(
  resolved: ResolvedCatalogRecord<T>[],
  bootstrap: ResolvedCatalogRecord<T>[]
): ResolvedCatalogRecord<T>[] {
  const stableKeys = new Set(bootstrap.map((item) => item.key));
  const result = resolved.filter((item) => stableKeys.has(item.key));
  const seen = new Set(result.map((item) => item.key));

  for (const fallback of bootstrap) {
    if (seen.has(fallback.key)) continue;
    const canonicalIndex = bootstrap.findIndex((item) => item.key === fallback.key);
    let insertAt = 0;
    for (let index = 0; index < canonicalIndex; index += 1) {
      const precedingIndex = result.findIndex((item) => item.key === bootstrap[index].key);
      if (precedingIndex >= insertAt) insertAt = precedingIndex + 1;
    }
    result.splice(insertAt, 0, fallback);
    seen.add(fallback.key);
  }

  return result.slice(0, bootstrap.length);
}

export function resolveCatalogRecord<T>(
  record: CatalogRecord,
  builtin: T | undefined,
  remote: T | undefined,
): ResolvedCatalogRecord<T> | null {
  const source = builtin ?? remote;
  return source === undefined ? null : { ...record, source };
}