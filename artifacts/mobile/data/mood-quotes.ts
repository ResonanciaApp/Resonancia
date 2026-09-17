import type { ImageSource } from "expo-image";

import type { MoodId } from "@/data/moods";

export type MoodQuote = {
  author: string;
  background: ImageSource;
  text: string;
};

export const MOOD_QUOTES: Record<MoodId, MoodQuote> = {
  estresado: {
    author: "Casa del Cuenco",
    background: require("@/assets/images/mood-quotes/mood-quote-estresado.jpg"),
    text: "No tienes que resolverlo todo ahora. Respira: este momento también puede sostenerte.",
  },
  ansioso: {
    author: "Casa del Cuenco",
    background: require("@/assets/images/mood-quotes/mood-quote-ansioso.jpg"),
    text: "Vuelve a lo que sí está aquí: tu respiración, tu cuerpo y este instante.",
  },
  cansado: {
    author: "Casa del Cuenco",
    background: require("@/assets/images/mood-quotes/mood-quote-cansado.jpg"),
    text: "Descansar no es rendirse; es permitir que tu energía encuentre de nuevo su cauce.",
  },
  inepto: {
    author: "Casa del Cuenco",
    background: require("@/assets/images/mood-quotes/mood-quote-inepto.jpg"),
    text: "Tu valor no depende de hacerlo perfecto. También estás aprendiendo mientras avanzas.",
  },
  triste: {
    author: "Casa del Cuenco",
    background: require("@/assets/images/mood-quotes/mood-quote-triste.jpg"),
    text: "Puedes darle espacio a lo que duele sin olvidar que ninguna emoción permanece para siempre.",
  },
  solo: {
    author: "Casa del Cuenco",
    background: require("@/assets/images/mood-quotes/mood-quote-solo.jpg"),
    text: "Aunque hoy sientas distancia, tu existencia sigue tocando la vida de quienes te rodean.",
  },
  deprimido: {
    author: "Casa del Cuenco",
    background: require("@/assets/images/mood-quotes/mood-quote-deprimido.jpg"),
    text: "Aunque hoy cueste verlo, dentro de ti sigue existiendo un lugar al que la luz sabe volver.",
  },
  desmotivado: {
    author: "Casa del Cuenco",
    background: require("@/assets/images/mood-quotes/mood-quote-desmotivado.jpg"),
    text: "No necesitas ver todo el camino. Un gesto pequeño también puede acercarte a ti.",
  },
  enojado: {
    author: "Casa del Cuenco",
    background: require("@/assets/images/mood-quotes/mood-quote-enojado.jpg"),
    text: "Tu enojo trae un mensaje. Escúchalo con calma antes de decidir cómo responder.",
  },
  adolorido: {
    author: "Casa del Cuenco",
    background: require("@/assets/images/mood-quotes/mood-quote-adolorido.jpg"),
    text: "Trata tu cuerpo con la misma ternura que ofrecerías a alguien que amas.",
  },
  agradecido: {
    author: "Casa del Cuenco",
    background: require("@/assets/images/mood-quotes/mood-quote-agradecido.jpg"),
    text: "Lo que agradeces se vuelve presencia: deja que este instante se expanda dentro de ti.",
  },
  emocionado: {
    author: "Casa del Cuenco",
    background: require("@/assets/images/mood-quotes/mood-quote-emocionado.jpg"),
    text: "Permite que esta energía te atraviese y encuentre una forma consciente de expresarse.",
  },
  "lleno-de-amor": {
    author: "Casa del Cuenco",
    background: require("@/assets/images/mood-quotes/mood-quote-lleno-de-amor.jpg"),
    text: "El amor que sientes no se agota al compartirlo; también puede volver hacia ti.",
  },
  feliz: {
    author: "Casa del Cuenco",
    background: require("@/assets/images/mood-quotes/mood-quote-feliz.jpg"),
    text: "Habita esta alegría sin apresurarla. Este momento merece ser vivido por completo.",
  },
  "en-paz": {
    author: "Casa del Cuenco",
    background: require("@/assets/images/mood-quotes/mood-quote-en-paz.jpg"),
    text: "Quédate un instante aquí, donde nada falta y tu respiración encuentra espacio.",
  },
  esperanzado: {
    author: "Casa del Cuenco",
    background: require("@/assets/images/mood-quotes/mood-quote-esperanzado.jpg"),
    text: "La esperanza no exige certezas; basta una luz pequeña para orientar el siguiente paso.",
  },
  contento: {
    author: "Casa del Cuenco",
    background: require("@/assets/images/mood-quotes/mood-quote-contento.jpg"),
    text: "Reconoce la calma de lo suficiente. También en lo simple vive la plenitud.",
  },
  presente: {
    author: "Casa del Cuenco",
    background: require("@/assets/images/mood-quotes/mood-quote-presente.jpg"),
    text: "Este instante no necesita ser distinto. Tu atención ya es una forma de encuentro.",
  },
};