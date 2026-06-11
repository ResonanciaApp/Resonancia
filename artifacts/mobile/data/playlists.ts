export type Playlist = {
  id: string;
  title: string;
  description: string;
  cover: ReturnType<typeof require>;
  savedCount: number;
  durationLabel: string;
  sessionIds: string[];
};

export const PLAYLISTS: Playlist[] = [
  {
    id: "para-la-ansiedad",
    title: "Para la ansiedad",
    description: "Sonidos que calman la mente y liberan la tensión acumulada. Cuencos tibetanos, ondas binaurales y música que invita al cuerpo a soltar.",
    cover: require("../assets/images/sessions/session-8-musica-dark.jpg"),
    savedCount: 2840,
    durationLabel: "3 h 15 m",
    sessionIds: ["2", "8", "9", "10"],
  },
  {
    id: "sueno-profundo",
    title: "Sueño profundo",
    description: "Frecuencias delta y sonidos nocturnos para acompañar el descanso y entrar en un sueño reparador.",
    cover: require("../assets/images/sessions/session-20-musica-dark.jpg"),
    savedCount: 5120,
    durationLabel: "5 h 40 m",
    sessionIds: ["8", "24", "20", "21"],
  },
  {
    id: "musica-ambient",
    title: "Música Ambient",
    description: "Paisajes sonoros y música meditativa para fluir, crear o simplemente estar presente.",
    cover: require("../assets/images/sessions/session-5-musica-dark.jpg"),
    savedCount: 1670,
    durationLabel: "2 h 50 m",
    sessionIds: ["25", "26", "23"],
  },
  {
    id: "meditaciones-guiadas",
    title: "Meditaciones guiadas",
    description: "Viajes interiores guiados por el sonido y la voz. Perfectos para empezar o profundizar tu práctica.",
    cover: require("../assets/images/sessions/med-visualizaciones.jpg"),
    savedCount: 3390,
    durationLabel: "1 h 45 m",
    sessionIds: ["1", "5", "7"],
  },
];

export function getPlaylistById(id: string): Playlist | undefined {
  return PLAYLISTS.find((p) => p.id === id);
}
