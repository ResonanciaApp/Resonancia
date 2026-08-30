export type ContentCategoryDefinition = {
  id:
    | "meditaciones-guiadas"
    | "sonidos-ancestrales"
    | "musica-sonidos"
    | "ambientales"
    | "__descanzo__"
    | "historias"
    | "charlas"
    | "__mezcla__"
    | "__geometrix__";
  label: string;
  color: string;
  cardColor: string;
  horizontalWidth: number;
};

export const CONTENT_CATEGORIES: readonly ContentCategoryDefinition[] = [
  {
    id: "meditaciones-guiadas",
    label: "Meditaciones",
    color: "#C8A6FF",
    cardColor: "#7251A3",
    horizontalWidth: 164,
  },
  {
    id: "sonidos-ancestrales",
    label: "Sonoterapia",
    color: "#E7A36E",
    cardColor: "#9A5A2C",
    horizontalWidth: 158,
  },
  {
    id: "musica-sonidos",
    label: "Música",
    color: "#6FD7D8",
    cardColor: "#287F83",
    horizontalWidth: 126,
  },
  {
    id: "ambientales",
    label: "Ambientales",
    color: "#86C49A",
    cardColor: "#3F704D",
    horizontalWidth: 144,
  },
  {
    id: "__descanzo__",
    label: "Dormir",
    color: "#8ED9FF",
    cardColor: "#32708E",
    horizontalWidth: 120,
  },
  {
    id: "historias",
    label: "Historias",
    color: "#D5A4E8",
    cardColor: "#691E5E",
    horizontalWidth: 130,
  },
  {
    id: "charlas",
    label: "Charlas",
    color: "#F0B17A",
    cardColor: "#78221E",
    horizontalWidth: 118,
  },
  {
    id: "__mezcla__",
    label: "Mezclador",
    color: "#E6BE67",
    cardColor: "#E6BE67",
    horizontalWidth: 140,
  },
  {
    id: "__geometrix__",
    label: "Geometrix",
    color: "#C4C8D4",
    cardColor: "#C4C8D4",
    horizontalWidth: 140,
  },
];

const DISCOVER_HIDDEN_IDS = new Set(["__descanzo__", "__mezcla__", "__geometrix__"]);

/** Categorías visibles en la fila superior de Descubrir, en su orden editorial. */
export const DISCOVER_CONTENT_CATEGORIES = CONTENT_CATEGORIES.filter(
  (category) => !DISCOVER_HIDDEN_IDS.has(category.id),
);