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

export function resolveCatalogRecord<T>(
  record: CatalogRecord,
  builtin: T | undefined,
  remote: T | undefined,
): ResolvedCatalogRecord<T> | null {
  const source = builtin ?? remote;
  return source === undefined ? null : { ...record, source };
}