/** Opciones incluidas para la primera versión de la portada personal. */
export const PROFILE_COVER_OPTIONS = [
  { id: "espacio", label: "Mi espacio", source: require("../assets/images/mi-espacio-header-bg.jpg") },
  { id: "vuelve", label: "Vuelve a ti", source: require("../assets/images/hero-vuelve-a-ti.jpg") },
  { id: "templo", label: "Templo", source: require("../assets/images/hero-everest-temple.png") },
  { id: "mezclador", label: "Sonidos", source: require("../assets/images/hero-mezclador.png") },
  { id: "yoga", label: "Yoga", source: require("../assets/images/hero-yoga.jpg") },
  { id: "spa", label: "Calma", source: require("../assets/images/hero-spa.jpg") },
  { id: "respiracion", label: "Respiración", source: require("../assets/images/hero-respiracion.jpg") },
  { id: "asmr", label: "Silencio", source: require("../assets/images/hero-asmr.jpg") },
  { id: "rituales", label: "Rituales", source: require("../assets/images/hero-rituales.jpg") },
  { id: "insomnio", label: "Descanso", source: require("../assets/images/hero-insomnio.jpg") },
] as const;

export function profileCoverSource(id: string | null, uri: string | null) {
  if (uri) return { uri };
  return PROFILE_COVER_OPTIONS.find((option) => option.id === id)?.source;
}