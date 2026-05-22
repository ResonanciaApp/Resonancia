export interface TagCard {
  id: string;
  label: string;
  image: number;
}

export const TAG_CARDS: TagCard[] = [
  { id: "ultimos-estrenos",          label: "Últimos Estrenos",              image: require("@/assets/images/cat1-meditaciones.jpg") },
  { id: "para-la-ansiedad",          label: "Para la ansiedad",              image: require("@/assets/images/meditation-person.png") },
  { id: "para-energizar",            label: "Para energizar",                image: require("@/assets/images/cat4-podcast.jpg") },
  { id: "aceptacion-agradecimiento", label: "Aceptación y Agradecimiento",   image: require("@/assets/images/crystal-bowls.png") },
  { id: "foco-concentracion",        label: "Foco y Concentración",          image: require("@/assets/images/cat6-pausas.jpg") },
  { id: "loops-mentales",            label: "Loops Mentales",                image: require("@/assets/images/cat3-asmr.jpg") },
  { id: "autorealizacion",           label: "Autorealización",               image: require("@/assets/images/hero-bowl.png") },
];
