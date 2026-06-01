import { SESSIONS, type Session } from "./sessions";

export type GuideLink = {
  /** Etiqueta visible, ej: "Instagram", "Spotify", "YouTube" */
  label: string;
  /** URL completa (con https://) */
  url: string;
};

export type Guide = {
  id: string;
  name: string;
  photo: import("react-native").ImageSourcePropType;
  /** Bio / descripción del guiador */
  bio: string;
  country: string;
  /** Especialidad o estilo, ej: "Meditación · Mindfulness" */
  specialty: string;
  /** Redes sociales / links (opcional) */
  links?: GuideLink[];
  /** Sello certificado por Resonancia (true por defecto en guiadores reales) */
  certified?: boolean;
  /** Mostrar en el carrusel "Guiadores". El guiador de la casa va en false. */
  featured?: boolean;
};

/** Guiador por defecto (la app) cuando una sesión no indica guideId. */
export const DEFAULT_GUIDE_ID = "casa-cuenco";

export const GUIDES: Guide[] = [
  {
    id: "casa-cuenco",
    name: "Casa del Cuenco",
    photo: require("@/assets/images/logo-resonancia-gold.png"),
    bio: "La voz de la casa. Meditaciones guiadas creadas por el equipo de Resonancia para acompañarte paso a paso, sin necesidad de experiencia previa.",
    country: "Latinoamérica",
    specialty: "Meditación · Mindfulness",
    certified: true,
    featured: false,
  },
  // ── Guiadores de ejemplo (reemplazar con guiadores reales) ──
  {
    id: "sofia-ramirez",
    name: "Sofía Ramírez",
    photo: require("@/assets/images/meditation-person.png"),
    bio: "Guía de meditación y facilitadora de mindfulness. Su voz cálida acompaña procesos de calma, presencia y reconexión con el cuerpo a través de visualizaciones suaves.",
    country: "Argentina",
    specialty: "Visualización · Presencia",
    links: [
      { label: "Instagram", url: "https://instagram.com" },
      { label: "Web", url: "https://example.com" },
    ],
    certified: true,
    featured: true,
  },
  {
    id: "mateo-luz",
    name: "Mateo Luz",
    photo: require("@/assets/images/meditation-person.png"),
    bio: "Instructor de respiración consciente y escaneo corporal. Sus meditaciones guían hacia la quietud profunda combinando atención plena y trabajo con el aliento.",
    country: "México",
    specialty: "Respiración · Escaneo Corporal",
    links: [{ label: "YouTube", url: "https://youtube.com" }],
    certified: true,
    featured: true,
  },
];

/** Resuelve el guiador de una sesión; si no hay guideId (o es inválido), devuelve el guiador de la casa. */
export function getGuide(id?: string): Guide {
  const fallback = GUIDES.find((g) => g.id === DEFAULT_GUIDE_ID)!;
  if (!id) return fallback;
  return GUIDES.find((g) => g.id === id) ?? fallback;
}

/** Busca un guiador por id SIN fallback (para la pantalla de perfil: id inválido → undefined). */
export function getGuideById(id?: string): Guide | undefined {
  if (!id) return undefined;
  return GUIDES.find((g) => g.id === id);
}

/**
 * Sesiones atribuidas a un guiador. Solo Meditaciones Guiadas;
 * las que no declaran guideId pertenecen a Casa del Cuenco (la casa).
 */
export function getGuideSessions(guideId: string): Session[] {
  return SESSIONS.filter(
    (s) =>
      s.categoryId === "meditaciones-guiadas" &&
      (s.guideId ?? DEFAULT_GUIDE_ID) === guideId
  );
}

/** Cantidad de meditaciones que un guiador tiene en la app. */
export function getGuideTrackCount(guideId: string): number {
  return getGuideSessions(guideId).length;
}

/** Guiadores que se muestran en el carrusel. */
export function getFeaturedGuides(): Guide[] {
  return GUIDES.filter((g) => g.featured);
}
