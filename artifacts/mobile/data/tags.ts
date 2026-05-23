export type ThemeTag =
  | "Para la ansiedad"
  | "Energiza tus mañanas"
  | "Foco y concentración"
  | "Suelto la Rabia"
  | "Crecimiento personal"
  | "Armonía familiar"
  | "Respiración consciente"
  | "Meditaciones Activas"
  | "Astrología";

export interface TagCard {
  id: string;
  label: ThemeTag;
  image: number;
}

export const TAG_CARDS: TagCard[] = [
  { id: "para-la-ansiedad",         label: "Para la ansiedad",        image: require("@/assets/images/tag-ansiedad.png") },
  { id: "energiza-tus-mananas",     label: "Energiza tus mañanas",    image: require("@/assets/images/tag-energizar.png") },
  { id: "foco-concentracion",       label: "Foco y concentración",    image: require("@/assets/images/tag-foco.png") },
  { id: "suelto-la-rabia",          label: "Suelto la Rabia",         image: require("@/assets/images/tag-rabia.png") },
  { id: "crecimiento-personal",     label: "Crecimiento personal",    image: require("@/assets/images/tag-crecimiento.png") },
  { id: "armonia-familiar",         label: "Armonía familiar",        image: require("@/assets/images/tag-armonia.png") },
  { id: "respiracion-consciente",   label: "Respiración consciente",  image: require("@/assets/images/tag-respiracion.png") },
  { id: "meditaciones-activas",     label: "Meditaciones Activas",    image: require("@/assets/images/tag-meditaciones-activas.png") },
  { id: "astrologia",               label: "Astrología",              image: require("@/assets/images/tag-astrologia.png") },
];

export const TAGS_PREVIEW_COUNT = 6;
