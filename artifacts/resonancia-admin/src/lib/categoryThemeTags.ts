export type CategoryThemeTagConfig = {
  tagType: string;
  label: string;
  defaults: string[];
};

export const ANCESTRAL_TAGS = ["Cuencos Tibetanos","Cuencos de Cuarzo","Mix de Cuencos","Gongs","Cuencos y Gongs","Full Instrumentos"];
export const MEDITATION_TAGS = ["No Duales","Visualizaciones","Mantras","Escaneo Corporal","Manifestación","3 Minutos de Sabiduría"];
export const SOUND_TAGS = ["Música Ambient","Música Enteógena","Música Étnica","Música Tribal"];
export const CHARLAS_SUBCATEGORY_TAGS = ["Subcategoría 1", "Subcategoría 2", "Subcategoría 3"];
export const HISTORIAS_SUBCATEGORY_TAGS = ["Subcategoría 1", "Subcategoría 2", "Subcategoría 3"];
export const AMBIENTALES_SUBCATEGORY_TAGS = ["Subcategoría 1", "Subcategoría 2", "Subcategoría 3"];
export const DESCANSO_TAGS = [
  "Música para dormir",
  "Meditaciones para dormir",
  "Historias para dormir",
  "Sonidos para dormir",
  "Paisajes sonoros",
  "Para niños",
  "Sonidos de lluvia",
  "Ruido",
];
export const OTHER_THEME_TAGS = [
  "Para la ansiedad",
  "Energiza tus mañanas",
  "Foco y concentración",
  "Suelto la Rabia",
  "Crecimiento personal",
  "Armonía familiar",
  "Respiración consciente",
  "Meditaciones Activas",
  "Astrología",
];
export const SONIDOS_COLLECTION_TAGS = [
  "Todos los sonidos",
  "Sonidos de naturaleza",
  "Sonidos binaurales",
  "Frecuencias Astrales",
  "Música de enfoque",
  "Cantos medicinales",
  "Sonidos de lluvia",
  "Sonidos para Chakras",
];

export const CATEGORY_THEME_TAGS: Record<string, CategoryThemeTagConfig> = {
  "musica-sonidos": {
    tagType: "theme",
    label: "Etiquetas de Música (opcional)",
    defaults: ["Yoga", "Respiración", "Ansiedad", "Rituales", "Crecimiento", "ASMR", "Estrés", "Spa", "Familia"],
  },
  "meditaciones-guiadas": {
    tagType: "category_theme_meditaciones",
    label: "Etiquetas de Meditaciones (opcional)",
    defaults: ["Presencia", "Calma", "Enfoque"],
  },
  "sonidos-ancestrales": {
    tagType: "category_theme_sonoterapia",
    label: "Pantallas internas subcategorías",
    defaults: ["Cuencos", "Gong", "Vibración"],
  },
  charlas: {
    tagType: "category_theme_charlas",
    label: "Nombre de colección de Charlas (opcional)",
    defaults: ["Consciencia", "Bienestar", "Filosofía"],
  },
  historias: {
    tagType: "category_theme_historias",
    label: "Nombre de colección de Historias (opcional)",
    defaults: ["Inspiración", "Transformación", "Sabiduría"],
  },
  ambientales: {
    tagType: "category_theme_ambientales",
    label: "Nombre de colección de Ambientales (opcional)",
    defaults: ["Lluvia", "Bosque", "Océano"],
  },
};

export const SUPERCATEGORY_THEME_TAGS = {
  descanso: {
    tagType: "supercategory_theme_descanso",
    label: "Etiquetas editoriales de Dormir (opcional)",
    defaults: ["Opción A", "Opción B", "Opción C"],
  },
  sonidos: {
    tagType: "supercategory_theme_sonidos",
    label: "Etiquetas editoriales de Sonidos (opcional)",
    defaults: ["Opción A", "Opción B", "Opción C"],
  },
} satisfies Record<string, CategoryThemeTagConfig>;

const storagePrefix = (tagType: string) =>
  tagType === "theme" ? "" : `__${tagType}__:`;

export function themeTagStoredValue(tagType: string, label: string): string {
  return `${storagePrefix(tagType)}${label}`;
}

export function themeTagSelectedLabels(tagType: string, stored: string[]): string[] {
  const prefix = storagePrefix(tagType);
  return prefix
    ? stored.filter((value) => value.startsWith(prefix)).map((value) => value.slice(prefix.length))
    : stored.filter((value) => !value.startsWith("__"));
}

export function categoryThemeStoredValue(categoryId: string, label: string): string {
  const config = CATEGORY_THEME_TAGS[categoryId];
  return config ? themeTagStoredValue(config.tagType, label) : label;
}

export function categoryThemeSelectedLabels(categoryId: string, stored: string[]): string[] {
  const config = CATEGORY_THEME_TAGS[categoryId];
  if (!config) return [];
  return themeTagSelectedLabels(config.tagType, stored);
}
