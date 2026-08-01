import type { MaterialCommunityIcons } from "@expo/vector-icons";
import type React from "react";

export type TemaItem = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  description: string;
  themeTagMatch?: string[];
  image?: number;
  /** Ruta personalizada (ej. categorías propias). Por defecto navega a /tema/{id}. */
  route?: string;
};

export const TEMAS: TemaItem[] = [
  {
    id: "yoga",
    label: "Yoga",
    icon: "meditation",
    color: "#A0554A",
    description: "Movimiento consciente y posturas para unir cuerpo, mente y espíritu en armonía.",
    image: require("@/assets/images/hero-yoga.jpg"),
    themeTagMatch: ["Yoga"],
  },
  {
    id: "respiracion",
    label: "Respiración",
    icon: "weather-windy",
    color: "#A8D8EA",
    description: "Técnicas y prácticas guiadas para reconectar con tu respiración y recuperar la calma.",
    image: require("@/assets/images/hero-respiracion.jpg"),
    themeTagMatch: ["Respiración", "Respiración consciente"],
  },
  {
    id: "angustia",
    label: "Ansiedad",
    icon: "weather-cloudy",
    color: "#C8A85C",
    description: "Acompañamiento sonoro y guiado para atravesar momentos de incertidumbre con serenidad.",
    image: require("@/assets/images/hero-ansiedad.jpg"),
    themeTagMatch: ["Ansiedad"],
  },
  {
    id: "ansiedad",
    label: "Rituales",
    icon: "heart-pulse",
    color: "#0AA99A",
    description: "Sesiones diseñadas para calmar la mente y encontrar equilibrio en momentos de tensión.",
    themeTagMatch: ["Rituales", "Para la ansiedad"],
    image: require("@/assets/images/hero-rituales.jpg"),
  },
  {
    id: "asmr",
    label: "ASMR",
    icon: "ear-hearing",
    color: "#4455C7",
    description: "Sonidos suaves y texturas auditivas que relajan el sistema nervioso con delicadeza.",
    image: require("@/assets/images/hero-asmr.jpg"),
    themeTagMatch: ["ASMR"],
  },
  {
    id: "estres",
    label: "Estrés",
    icon: "lightning-bolt",
    color: "#C98A44",
    description: "Prácticas para liberar la tensión acumulada y restaurar tu energía interior.",
    image: require("@/assets/images/hero-estres.jpg"),
    themeTagMatch: ["Estrés"],
  },
  {
    id: "spa",
    label: "Spa",
    icon: "spa",
    color: "#E06BAA",
    description: "Experiencias sensoriales profundas para descansar el cuerpo y renovar la mente.",
    image: require("@/assets/images/hero-spa.jpg"),
    themeTagMatch: ["Spa"],
  },
  {
    id: "familia",
    label: "Familia",
    icon: "account-group",
    color: "#0AA99A",
    description: "Momentos de paz y presencia plena para compartir con quienes más queremos.",
    image: require("@/assets/images/hero-familia.jpg"),
    themeTagMatch: ["Familia"],
  },
  {
    id: "insomnio",
    label: "Insomnio",
    icon: "weather-night",
    color: "#7C6FCD",
    description: "Sesiones diseñadas para calmar la mente y preparar el cuerpo para un sueño profundo.",
    image: require("@/assets/images/hero-insomnio.jpg"),
    themeTagMatch: ["Insomnio", "Sueño"],
  },
];

export function getTemaById(id: string): TemaItem | undefined {
  return TEMAS.find((t) => t.id === id);
}
