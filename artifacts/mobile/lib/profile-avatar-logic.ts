export type ProfileAvatarRecord = {
  avatarPresetId?: string | null;
  avatarUrl?: string | null;
};

export type ProfileAvatarCandidate<T> = {
  id: string;
  key: string;
  source: T;
};

/** A new URI per selection invalidates image caches and avatar sync markers. */
export function buildLocalAvatarFilename(uri: string, uniqueId: string): string {
  const path = uri.split(/[?#]/, 1)[0];
  const extension = path.match(/\.([a-z0-9]{1,8})$/i)?.[1] ?? "jpg";
  return `profile_photo_${uniqueId}.${extension}`;
}

export function resolveProfileAvatarSource<T>(
  profile: ProfileAvatarRecord,
  catalog: ProfileAvatarCandidate<T>[],
): T | { uri: string } | undefined {
  if (profile.avatarPresetId) {
    const preset = catalog.find(
      (item) =>
        item.key === profile.avatarPresetId
        || item.id === profile.avatarPresetId
        || `profile:${item.key}` === profile.avatarPresetId,
    );
    if (preset) return preset.source;
  }
  const url = resolveAvatarUrl(profile.avatarUrl);
  return url ? { uri: url } : undefined;
}

function resolveAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const normalized = path.replace(/\/api\/storage\/+(?=objects\/)/, "/api/storage/");
   if (/^[a-z][a-z\d+.-]*:/i.test(normalized)) return normalized;
  const base = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  const servingPath = normalized.startsWith("/objects/")
    ? normalized.replace(/^\/objects\//, "/api/storage/objects/")
    : normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `${base}${servingPath}`;
}