export function biographyFingerprint(description: string, lifeMotto: string): string {
  return JSON.stringify([description.trim(), lifeMotto.trim()]);
}

/** Clean local biographies follow the server; pending local edits win. */
export function recoverBiography(
  local: { description: string; lifeMotto: string; biographyOwnerId: string | null; biographySyncedValue: string | null },
  remote: { longDescription?: string | null; lifeMotto?: string | null },
  ownerId: string,
): { description?: string; lifeMotto?: string; biographyOwnerId: string; biographySyncedValue: string } | null {
  const description = remote.longDescription ?? "";
  const lifeMotto = remote.lifeMotto ?? "";
  const remoteValue = biographyFingerprint(description, lifeMotto);
  const localValue = biographyFingerprint(local.description, local.lifeMotto);
  const restore = () => ({
    description, lifeMotto, biographyOwnerId: ownerId, biographySyncedValue: remoteValue,
  });
  if (local.biographyOwnerId && local.biographyOwnerId !== ownerId) return restore();
  if (!local.biographyOwnerId || local.biographySyncedValue == null) {
    return {
      description: local.description.trim() ? local.description : description,
      lifeMotto: local.lifeMotto.trim() ? local.lifeMotto : lifeMotto,
      biographyOwnerId: ownerId,
      biographySyncedValue: remoteValue,
    };
  }
  if (localValue === remoteValue && local.biographySyncedValue !== localValue) {
    return { biographyOwnerId: ownerId, biographySyncedValue: localValue };
  }
  if (localValue === local.biographySyncedValue && localValue !== remoteValue) return restore();
  return null;
}
