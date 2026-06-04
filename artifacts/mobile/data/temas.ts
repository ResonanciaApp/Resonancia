import type { MaterialCommunityIcons } from "@expo/vector-icons";
import type React from "react";

export type TemaItem = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  description: string;
  themeTagMatch?: string;
};

export const TEMAS: TemaItem[] = [
  {
    id: "ansiedad",
    label: "Ansiedad",
    icon: "heart-pulse",
    color: "#F0A0A8",
    description: "Sesiones diseñadas para calmar la mente y encontrar equilibrio en momentos de tensión.",
    themeTagMatch: "Para la ansiedad",
  },
  {
    id: "respiracion",
    label: "Respiración",
    icon: "weather-windy",
    color: "#A8D8EA",
    description: "Técnicas y prácticas guiadas para reconectar con tu respiración y recuperar la calma.",
    themeTagMatch: "Respiración consciente",
  },
  {
    id: "yoga",
    label: "Yoga",
    icon: "meditation",
    color: "#B8E0B0",
    description: "Movimiento consciente y posturas para unir cuerpo, mente y espíritu en armonía.",
  },
  {
    id: "para-padres",
    label: "Para padres",
    icon: "account-group",
    color: "#F5C87A",
    description: "Momentos de paz y presencia plena para quienes acompañan y cuidan a otros.",
  },
  {
    id: "estres",
    label: "Estrés",
    icon: "lightning-bolt",
    color: "#C4A8E0",
    description: "Prácticas para liberar la tensión acumulada y restaurar tu energía interior.",
  },
  {
    id: "angustia",
    label: "Angustia",
    icon: "weather-cloudy",
    color: "#8FC8C0",
    description: "Acompañamiento sonoro y guiado para atravesar momentos de incertidumbre con serenidad.",
  },
  {
    id: "energia",
    label: "Energía",
    icon: "white-balance-sunny",
    color: "#F5D88A",
    description: "Despierta tu vitalidad y activa tu cuerpo con sesiones llenas de luz y movimiento.",
    themeTagMatch: "Energiza tus mañanas",
  },
  {
    id: "psicodelia",
    label: "Psicodelia",
    icon: "eye",
    color: "#C0A0D8",
    description: "Soundscapes expansivos que abren la percepción y llevan la mente a nuevos horizontes.",
  },
  {
    id: "amor-propio",
    label: "Amor propio",
    icon: "heart",
    color: "#F0B8C8",
    description: "Cultiva una relación amorosa contigo mismo a través del silencio, el sonido y la intención.",
  },
];

export function getTemaById(id: string): TemaItem | undefined {
  return TEMAS.find((t) => t.id === id);
}
