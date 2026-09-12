import { REMOTE_SOUND_MAP } from "@/lib/remoteSoundMap";

import { SOUNDS, hasSoundFile } from "./sounds";

export const PLAYABLE_AMBIENT_SOUNDS = SOUNDS.filter(
  (sound) => hasSoundFile(sound.id) || !!REMOTE_SOUND_MAP[sound.id],
);

export const PLAYABLE_AMBIENT_SOUND_IDS = PLAYABLE_AMBIENT_SOUNDS.map(
  (sound) => sound.id,
);