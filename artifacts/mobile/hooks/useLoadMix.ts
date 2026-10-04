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
import { useCallback } from "react";
import { Alert } from "react-native";

import { useMixerLibrary, type MixPreset } from "@/context/MixerContext";
import { usePremium } from "@/context/PremiumContext";
import { useSounds } from "@/context/SoundsContext";
import { hasSoundFile } from "@/data/sounds";
import { REMOTE_SOUND_MAP } from "@/lib/remoteSoundMap";
import { openPremiumPlans } from "@/lib/premiumGate";

export function useLoadMix() {
  const { isPremium } = usePremium();
  const { loadPreset } = useMixerLibrary();
  const { sounds: catalogSounds } = useSounds();

  return useCallback(
    (preset: MixPreset): boolean => {
      const hasLockedPremium = preset.sounds.some(
        (s) => catalogSounds.find((candidate) => candidate.id === s.id)?.isPremium && !isPremium,
      );
      if (hasLockedPremium) {
        openPremiumPlans();
        return false;
      }

      const accessible = preset.sounds.filter((s) => {
        const snd = catalogSounds.find((candidate) => candidate.id === s.id);
        if (!snd || (!snd.audioUrl && !hasSoundFile(s.id) && !REMOTE_SOUND_MAP[s.id])) return false;
        if (snd.isPremium && !isPremium) return false;
        return true;
      });

      if (accessible.length === 0) {
        Alert.alert("Mezcla vacía", "Los sonidos de esta mezcla aún no están disponibles.");
        return false;
      }

      loadPreset({ ...preset, sounds: accessible });
      return true;
    },
    [catalogSounds, isPremium, loadPreset],
  );
}
