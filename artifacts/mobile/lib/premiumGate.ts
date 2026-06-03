import { router } from "expo-router";
import { Alert } from "react-native";

/** Límites del plan gratuito (la propuesta premium del proyecto). */
export const FREE_FAVORITES_LIMIT = 5;
export const FREE_DIARIO_LIMIT = 5;
export const FREE_TIMER_MAX_MINUTES = 30;

/**
 * Muestra una explicación breve de la función premium y ofrece ir a la
 * pantalla de membresía. UX coherente para todo el gating free vs premium.
 */
export function showPremiumGate(message: string) {
  Alert.alert("Función Premium", message, [
    { text: "Más tarde", style: "cancel" },
    { text: "Ver Premium", onPress: () => router.push("/membresia" as never) },
  ]);
}
