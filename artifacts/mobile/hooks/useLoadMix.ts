/**
 * useLoadMix — carga una mezcla (curada o del usuario) en el mezclador.
 * ─────────────────────────────────────────────────────────────────
 * Sanea según premium: filtra sonidos sin archivo y sonidos premium si
 * el usuario no es premium. Si no queda nada reproducible, avisa.
 *
 * Devuelve `true` si la mezcla se cargó, `false` si se bloqueó/avisó.
 * Lo usan tanto la pantalla "Mi Música" como la librería por categoría.
 * ─────────────────────────────────────────────────────────────────
 */
import { router } from "expo-router";
import { useCallback } from "react";
import { Alert } from "react-native";

import { useMixer, type MixPreset } from "@/context/MixerContext";
import { usePremium } from "@/context/PremiumContext";
import { useSounds } from "@/context/SoundsContext";
import { hasSoundFile } from "@/data/sounds";
import { REMOTE_SOUND_MAP } from "@/lib/remoteSoundMap";

export function useLoadMix() {
  const { isPremium } = usePremium();
  const { loadPreset } = useMixer();
  const { sounds: catalogSounds } = useSounds();

  return useCallback(
    (preset: MixPreset): boolean => {
      const accessible = preset.sounds.filter((s) => {
        const snd = catalogSounds.find((candidate) => candidate.id === s.id);
        if (!snd || (!snd.audioUrl && !hasSoundFile(s.id) && !REMOTE_SOUND_MAP[s.id])) return false;
        if (snd.isPremium && !isPremium) return false;
        return true;
      });

      if (accessible.length === 0) {
        const hasLockedPremium = preset.sounds.some(
          (s) => catalogSounds.find((candidate) => candidate.id === s.id)?.isPremium && !isPremium,
        );
        if (hasLockedPremium) {
          Alert.alert("Mezcla Premium", "Esta mezcla usa sonidos exclusivos de Premium.", [
            { text: "Ahora no", style: "cancel" },
            { text: "Ver Premium", onPress: () => router.push("/membresia" as never) },
          ]);
        } else {
          Alert.alert("Mezcla vacía", "Los sonidos de esta mezcla aún no están disponibles.");
        }
        return false;
      }

      loadPreset({ ...preset, sounds: accessible });
      return true;
    },
    [catalogSounds, isPremium, loadPreset],
  );
}
