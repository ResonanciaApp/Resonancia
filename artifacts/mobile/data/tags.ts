export interface TagCard {
  id: string;
  label: string;
  image: number;
}

export const TAG_CARDS: TagCard[] = [
  { id: "ultimos-estrenos",          label: "Últimos Estrenos",             image: require("@/assets/images/tag-ultimos-estrenos.png") },
  { id: "para-la-ansiedad",          label: "Para la ansiedad",             image: require("@/assets/images/tag-ansiedad.png") },
  { id: "para-energizar",            label: "Para energizar",               image: require("@/assets/images/tag-energizar.png") },
  { id: "aceptacion-agradecimiento", label: "Aceptación y Agradecimiento",  image: require("@/assets/images/tag-aceptacion.png") },
  { id: "foco-concentracion",        label: "Foco y Concentración",         image: require("@/assets/images/tag-foco.png") },
  { id: "loops-mentales",            label: "Loops Mentales",               image: require("@/assets/images/tag-loops.png") },
  { id: "autorealizacion",           label: "Autorealización",              image: require("@/assets/images/tag-autorealizacion.png") },
  { id: "suelto-la-rabia",           label: "Suelto la Rabia",              image: require("@/assets/images/tag-rabia.png") },
];
