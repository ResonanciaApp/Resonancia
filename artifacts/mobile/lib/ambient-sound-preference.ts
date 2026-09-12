export const AMBIENT_SOUND_PREFERENCE_KEY = "@resonance_ambient_sound_preference";
export const MEDITATION_CATEGORY_ID = "meditaciones-guiadas";

let cachedAmbientSoundId: string | null | undefined;

export type AmbientPreferenceStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export function shouldAutoStartAmbientSound(categoryId: string | undefined): boolean {
  return categoryId === MEDITATION_CATEGORY_ID;
}

export function resolveAmbientSoundPreference(
  storedSoundId: string | null,
  playableSoundIds: readonly string[],
): string | null {
  if (storedSoundId && playableSoundIds.includes(storedSoundId)) {
    return storedSoundId;
  }
  return playableSoundIds[0] ?? null;
}

export async function loadAmbientSoundPreference(
  storage: AmbientPreferenceStorage,
  playableSoundIds: readonly string[],
): Promise<string | null> {
  if (cachedAmbientSoundId !== undefined) {
    return resolveAmbientSoundPreference(cachedAmbientSoundId, playableSoundIds);
  }
  try {
    const storedSoundId = await storage.getItem(AMBIENT_SOUND_PREFERENCE_KEY);
    const resolvedSoundId = resolveAmbientSoundPreference(storedSoundId, playableSoundIds);
    cachedAmbientSoundId = resolvedSoundId;
    return resolvedSoundId;
  } catch {
    const fallbackSoundId = playableSoundIds[0] ?? null;
    cachedAmbientSoundId = fallbackSoundId;
    return fallbackSoundId;
  }
}

export async function saveAmbientSoundPreference(
  storage: AmbientPreferenceStorage,
  soundId: string,
  playableSoundIds: readonly string[],
): Promise<void> {
  if (!playableSoundIds.includes(soundId)) {
    throw new Error(`Cannot save unavailable ambient sound: ${soundId}`);
  }
  const previousCachedSoundId = cachedAmbientSoundId;
  cachedAmbientSoundId = soundId;
  try {
    await storage.setItem(AMBIENT_SOUND_PREFERENCE_KEY, soundId);
  } catch (error) {
    cachedAmbientSoundId = previousCachedSoundId;
    throw error;
  }
}