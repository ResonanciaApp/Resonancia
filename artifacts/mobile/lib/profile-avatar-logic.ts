export type ProfileAvatarRecord = {
  avatarPresetId?: string | null;
  avatarUrl?: string | null;
};

export type ProfileAvatarCandidate<T> = {
  id: string;
  key: string;
  source: T;
};

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
  if (/^(https?:|data:)/i.test(normalized)) return normalized;
  const base = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  const servingPath = normalized.startsWith("/objects/")
    ? normalized.replace(/^\/objects\//, "/api/storage/objects/")
    : normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `${base}${servingPath}`;
}