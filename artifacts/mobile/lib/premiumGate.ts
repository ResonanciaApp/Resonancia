import { router } from "expo-router";
import { openPremiumPlansOverlayGlobal } from "@/lib/premiumPlansOverlay";

/** Límites del plan gratuito (la propuesta premium del proyecto). */
export const FREE_FAVORITES_LIMIT = 5;
export const FREE_DIARIO_LIMIT = 5;
export const FREE_REFLECTIONS_LIMIT = 3;
export const FREE_TIMER_MAX_MINUTES = 30;

/** Opens the premium offer above every existing drawer/category overlay. */
export function openPremiumPlans() {
  if (!openPremiumPlansOverlayGlobal()) {
    router.push("/membresia" as never);
  }
}

/**
 * Muestra una explicación breve de la función premium y ofrece ir a la
 * pantalla de membresía. UX coherente para todo el gating free vs premium.
 */
export function showPremiumGate(message: string) {
  void message;
  openPremiumPlans();
}
