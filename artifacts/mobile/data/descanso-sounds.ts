import type { ImageSourcePropType } from "react-native";

export type DescansoSoundCategory = "dormirme" | "zen" | "relax" | "ruido";

export interface DescansoSound {
  id: string;
  label: string;
  categoryId: DescansoSoundCategory;
  image: ImageSourcePropType;
  audioUri: string | null;
}

export const DESCANSO_SOUNDS: DescansoSound[] = [
  /* ── Dormirme rápido ── */
  {
    id: "ds-1",
    label: "Lluvia suave",
    categoryId: "dormirme",
    image: require("../assets/images/descanso-sounds/sound-1.png"),
    audioUri: null,
  },
  {
    id: "ds-2",
    label: "Ruido blanco",
    categoryId: "dormirme",
    image: require("../assets/images/descanso-sounds/sound-2.png"),
    audioUri: null,
  },
  {
    id: "ds-3",
    label: "Latido cardíaco",
    categoryId: "dormirme",
    image: require("../assets/images/descanso-sounds/sound-3.png"),
    audioUri: null,
  },
  {
    id: "ds-4",
    label: "Océano nocturno",
    categoryId: "dormirme",
    image: require("../assets/images/descanso-sounds/sound-4.png"),
    audioUri: null,
  },
  {
    id: "ds-5",
    label: "Tormenta lejana",
    categoryId: "dormirme",
    image: require("../assets/images/descanso-sounds/sound-5.png"),
    audioUri: null,
  },
  {
    id: "ds-6",
    label: "Ventilador",
    categoryId: "dormirme",
    image: require("../assets/images/descanso-sounds/sound-6.png"),
    audioUri: null,
  },

  /* ── Modo zen ── */
  {
    id: "ds-7",
    label: "Cuencos tibetanos",
    categoryId: "zen",
    image: require("../assets/images/descanso-sounds/sound-7.png"),
    audioUri: null,
  },
  {
    id: "ds-8",
    label: "Flauta bambú",
    categoryId: "zen",
    image: require("../assets/images/descanso-sounds/sound-8.png"),
    audioUri: null,
  },
  {
    id: "ds-9",
    label: "Arroyo cristalino",
    categoryId: "zen",
    image: require("../assets/images/descanso-sounds/sound-9.png"),
    audioUri: null,
  },
  {
    id: "ds-10",
    label: "Campanas de viento",
    categoryId: "zen",
    image: require("../assets/images/descanso-sounds/sound-10.png"),
    audioUri: null,
  },
  {
    id: "ds-11",
    label: "Jardín zen",
    categoryId: "zen",
    image: require("../assets/images/descanso-sounds/sound-11.png"),
    audioUri: null,
  },
  {
    id: "ds-12",
    label: "Om meditación",
    categoryId: "zen",
    image: require("../assets/images/descanso-sounds/sound-12.png"),
    audioUri: null,
  },

  /* ── Full relax ── */
  {
    id: "ds-13",
    label: "Bosque al amanecer",
    categoryId: "relax",
    image: require("../assets/images/descanso-sounds/sound-13.png"),
    audioUri: null,
  },
  {
    id: "ds-14",
    label: "Pájaros tropicales",
    categoryId: "relax",
    image: require("../assets/images/descanso-sounds/sound-14.png"),
    audioUri: null,
  },
  {
    id: "ds-15",
    label: "Río en piedras",
    categoryId: "relax",
    image: require("../assets/images/descanso-sounds/sound-15.png"),
    audioUri: null,
  },
  {
    id: "ds-16",
    label: "Brisa entre hojas",
    categoryId: "relax",
    image: require("../assets/images/descanso-sounds/sound-16.png"),
    audioUri: null,
  },
  {
    id: "ds-17",
    label: "Cascada suave",
    categoryId: "relax",
    image: require("../assets/images/descanso-sounds/sound-17.png"),
    audioUri: null,
  },
  {
    id: "ds-18",
    label: "Grillos nocturnos",
    categoryId: "relax",
    image: require("../assets/images/descanso-sounds/sound-18.png"),
    audioUri: null,
  },

  /* ── Ruido ambiental ── */
  {
    id: "ds-19",
    label: "Café tranquilo",
    categoryId: "ruido",
    image: require("../assets/images/descanso-sounds/sound-19.png"),
    audioUri: null,
  },
  {
    id: "ds-20",
    label: "Chimenea",
    categoryId: "ruido",
    image: require("../assets/images/descanso-sounds/sound-20.png"),
    audioUri: null,
  },
  {
    id: "ds-21",
    label: "Biblioteca",
    categoryId: "ruido",
    image: require("../assets/images/descanso-sounds/sound-21.png"),
    audioUri: null,
  },
  {
    id: "ds-22",
    label: "Tren nocturno",
    categoryId: "ruido",
    image: require("../assets/images/descanso-sounds/sound-22.png"),
    audioUri: null,
  },
  {
    id: "ds-23",
    label: "Ciudad lejana",
    categoryId: "ruido",
    image: require("../assets/images/descanso-sounds/sound-23.png"),
    audioUri: null,
  },
  {
    id: "ds-24",
    label: "Cocina tranquila",
    categoryId: "ruido",
    image: require("../assets/images/descanso-sounds/sound-24.png"),
    audioUri: null,
  },
];
