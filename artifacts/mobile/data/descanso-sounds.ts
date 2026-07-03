import type { ImageSourcePropType } from "react-native";

export type DescansoSoundCategory = "binaural" | "ambiental";

export interface DescansoSound {
  id: string;
  label: string;
  categoryId: DescansoSoundCategory;
  image: ImageSourcePropType;
  audioUri: string | null;
}

export const DESCANSO_SOUNDS: DescansoSound[] = [
  /* ── Sonidos Binaurales ── */
  {
    id: "ds-1",
    label: "Onda Delta 2Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-1.png"),
    audioUri: null,
  },
  {
    id: "ds-2",
    label: "Onda Theta 6Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-2.png"),
    audioUri: null,
  },
  {
    id: "ds-3",
    label: "Onda Alfa 10Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-3.png"),
    audioUri: null,
  },
  {
    id: "ds-4",
    label: "Sueño profundo 3Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-4.png"),
    audioUri: null,
  },
  {
    id: "ds-5",
    label: "Relajación 8Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-5.png"),
    audioUri: null,
  },
  {
    id: "ds-6",
    label: "Calma mental 5Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-6.png"),
    audioUri: null,
  },
  {
    id: "ds-7",
    label: "Descanso total 1Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-7.png"),
    audioUri: null,
  },
  {
    id: "ds-8",
    label: "Foco sereno 12Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-8.png"),
    audioUri: null,
  },
  {
    id: "ds-9",
    label: "Equilibrio 7Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-9.png"),
    audioUri: null,
  },
  {
    id: "ds-10",
    label: "Transición al sueño 4Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-10.png"),
    audioUri: null,
  },
  {
    id: "ds-11",
    label: "Silencio interior 2.5Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-11.png"),
    audioUri: null,
  },
  {
    id: "ds-12",
    label: "Vibración nocturna 9Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-12.png"),
    audioUri: null,
  },

  /* ── Ambientales ── */
  {
    id: "ds-13",
    label: "Lluvia suave",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-13.png"),
    audioUri: null,
  },
  {
    id: "ds-14",
    label: "Océano nocturno",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-14.png"),
    audioUri: null,
  },
  {
    id: "ds-15",
    label: "Bosque al amanecer",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-15.png"),
    audioUri: null,
  },
  {
    id: "ds-16",
    label: "Río en piedras",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-16.png"),
    audioUri: null,
  },
  {
    id: "ds-17",
    label: "Cascada suave",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-17.png"),
    audioUri: null,
  },
  {
    id: "ds-18",
    label: "Grillos nocturnos",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-18.png"),
    audioUri: null,
  },
  {
    id: "ds-19",
    label: "Chimenea",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-19.png"),
    audioUri: null,
  },
  {
    id: "ds-20",
    label: "Tormenta lejana",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-20.png"),
    audioUri: null,
  },
  {
    id: "ds-21",
    label: "Viento entre hojas",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-21.png"),
    audioUri: null,
  },
  {
    id: "ds-22",
    label: "Ciudad lejana",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-22.png"),
    audioUri: null,
  },
  {
    id: "ds-23",
    label: "Pájaros tropicales",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-23.png"),
    audioUri: null,
  },
  {
    id: "ds-24",
    label: "Tren nocturno",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-24.png"),
    audioUri: null,
  },
];
