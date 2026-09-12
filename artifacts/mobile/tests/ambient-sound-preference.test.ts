import assert from "node:assert/strict";
import test from "node:test";

import {
  AMBIENT_SOUND_PREFERENCE_KEY,
  loadAmbientSoundPreference,
  resolveAmbientSoundPreference,
  saveAmbientSoundPreference,
  shouldAutoStartAmbientSound,
  type AmbientPreferenceStorage,
} from "../lib/ambient-sound-preference.ts";
import {
  getMeditationBackgroundSounds,
  hasAudioSourceRevision,
  type MixSound,
} from "../data/sounds.ts";

const PLAYABLE = ["rain", "forest", "ocean"] as const;

function createStorage(initial: string | null = null): AmbientPreferenceStorage {
  let value = initial;
  return {
    async getItem(key) {
      assert.equal(key, AMBIENT_SOUND_PREFERENCE_KEY);
      return value;
    },
    async setItem(key, nextValue) {
      assert.equal(key, AMBIENT_SOUND_PREFERENCE_KEY);
      value = nextValue;
    },
  };
}

test("uses the first playable sound when no preference exists", () => {
  assert.equal(resolveAmbientSoundPreference(null, PLAYABLE), "rain");
});

test("keeps a stored preference when it is still playable", () => {
  assert.equal(resolveAmbientSoundPreference("ocean", PLAYABLE), "ocean");
});

test("falls back when the stored sound is no longer playable", () => {
  assert.equal(resolveAmbientSoundPreference("removed", PLAYABLE), "rain");
});

test("persists and reloads the most recently selected sound", async () => {
  const storage = createStorage();
  await saveAmbientSoundPreference(storage, "forest", PLAYABLE);
  assert.equal(await loadAmbientSoundPreference(storage, PLAYABLE), "forest");
});

test("rejects unavailable sounds instead of persisting them", async () => {
  const storage = createStorage();
  await assert.rejects(
    saveAmbientSoundPreference(storage, "removed", PLAYABLE),
    /unavailable ambient sound/,
  );
});

test("auto-start is restricted to meditation sessions", () => {
  assert.equal(shouldAutoStartAmbientSound("meditaciones-guiadas"), true);
  assert.equal(shouldAutoStartAmbientSound("musica"), false);
  assert.equal(shouldAutoStartAmbientSound("ambientales"), false);
  assert.equal(shouldAutoStartAmbientSound(undefined), false);
});

test("meditation backgrounds require the admin flag and a playable audio URL", () => {
  const base: MixSound = {
    id: "base",
    name: "Base",
    icon: "music",
    iconSet: "feather",
    category: "bosque",
  };
  const sounds: MixSound[] = [
    { ...base, id: "enabled", showInMeditationBackgrounds: true, audioUrl: "https://audio.test/enabled.mp3" },
    { ...base, id: "missing-audio", showInMeditationBackgrounds: true },
    { ...base, id: "mixer-only", showInMeditationBackgrounds: false, audioUrl: "https://audio.test/mixer.mp3" },
  ];

  assert.deepEqual(
    getMeditationBackgroundSounds(sounds).map((sound) => sound.id),
    ["enabled"],
  );
});

test("detects resolved audio URL revisions without treating missing sources as revisions", () => {
  const previous: MixSound = {
    id: "remote",
    name: "Remote",
    icon: "music",
    iconSet: "feather",
    category: "bpm",
    audioUrl: "https://audio.test/v1.mp3",
  };
  assert.equal(
    hasAudioSourceRevision(previous, {
      ...previous,
      audioUrl: "https://audio.test/v2.mp3",
    }),
    true,
  );
  assert.equal(hasAudioSourceRevision(previous, previous), false);
  assert.equal(
    hasAudioSourceRevision(
      previous,
      { ...previous, audioUrl: undefined },
    ),
    true,
  );
  assert.equal(
    hasAudioSourceRevision(undefined, {
      ...previous,
      audioUrl: "https://audio.test/v2.mp3",
    }),
    false,
  );
});