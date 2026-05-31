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
import { getSoundById, hasSoundFile } from "@/data/sounds";

export function useLoadMix() {
  const { isPremium } = usePremium();
  const { loadPreset } = useMixer();

  return useCallback(
    (preset: MixPreset): boolean => {
      const accessible = preset.sounds.filter((s) => {
        const snd = getSoundById(s.id);
        if (!snd || !hasSoundFile(s.id)) return false;
        if (snd.isPremium && !isPremium) return false;
        return true;
      });

      if (accessible.length === 0) {
        const hasLockedPremium = preset.sounds.some(
          (s) => getSoundById(s.id)?.isPremium && !isPremium,
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
    [isPremium, loadPreset],
  );
}
