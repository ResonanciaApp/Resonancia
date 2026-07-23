export type Participante = {
  id: string;
  avatarColor: string;
  iniciales: string;
  foto?: number;
};

export type GuiaEncuentro = {
  nombre: string;
  encuentros: number;
  avatarColor: string;
  iniciales: string;
};

export type Encuentro = {
  id: string;
  titulo: string;
  descripcion: string;
  fechaISO: string;
  horaTexto: string;
  imagen: number;
  participantes: Participante[];
  inscritos: number;
  guia: GuiaEncuentro;
};

export const ENCUENTROS: Encuentro[] = [
  {
    id: "enc-1",
    titulo: "Cultivar la aceptación momento a momento",
    descripcion:
      "Cerramos juntos el reto Explorando tu universo interior con una sesión en vivo para integrar todo lo aprendido y abrir un espacio de conversación.",
    fechaISO: "2026-08-07T10:00:00",
    horaTexto: "10:00 h",
    imagen: require("@/assets/images/sessions/session-10.jpg"),
    guia: {
      nombre: "Sofía Ramírez",
      encuentros: 26,
      avatarColor: "#7C5CBF",
      iniciales: "SR",
    },
    participantes: [
      { id: "p1", avatarColor: "#7C5CBF", iniciales: "SR" },
      { id: "p2", avatarColor: "#3D7EAA", iniciales: "ML" },
      { id: "p3", avatarColor: "#B85C5C", iniciales: "AV" },
    ],
    inscritos: 54,
  },
  {
    id: "enc-2",
    titulo: "Doorway to deep sleep — respiración y relajación",
    descripcion:
      "Técnicas de respiración consciente para entrar en un estado de relajación profunda. Trae tu cojín y una manta.",
    fechaISO: "2026-08-14T20:00:00",
    horaTexto: "20:00 h",
    imagen: require("@/assets/images/sessions/session-11.jpg"),
    guia: {
      nombre: "Mateo Luz",
      encuentros: 14,
      avatarColor: "#4A9E6F",
      iniciales: "ML",
    },
    participantes: [
      { id: "p1", avatarColor: "#4A9E6F", iniciales: "CR" },
      { id: "p2", avatarColor: "#C47B2B", iniciales: "PG" },
    ],
    inscritos: 31,
  },
  {
    id: "enc-3",
    titulo: "Sonidos ancestrales en vivo — cuencos tibetanos",
    descripcion:
      "Un baño de sonido guiado con cuencos tibetanos, gongs y campanillas para limpiar el espacio interno y conectar con el presente.",
    fechaISO: "2026-08-21T18:30:00",
    horaTexto: "18:30 h",
    imagen: require("@/assets/images/sessions/ancestral-instrumentos.jpg"),
    guia: {
      nombre: "Casa del Cuenco",
      encuentros: 42,
      avatarColor: "#C47B2B",
      iniciales: "CC",
    },
    participantes: [
      { id: "p1", avatarColor: "#7C5CBF", iniciales: "JM" },
      { id: "p2", avatarColor: "#B85C5C", iniciales: "SR" },
      { id: "p3", avatarColor: "#3D7EAA", iniciales: "TK" },
    ],
    inscritos: 88,
  },
];

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];
const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function formatearFecha(isoStr: string): string {
  const d = new Date(isoStr);
  const dia = DIAS_SEMANA[d.getDay()];
  const num = d.getDate();
  const mes = MESES[d.getMonth()];
  return `${dia}. ${num}, ${mes}.`;
}

export function formatearFechaDetalle(isoStr: string, horaTexto: string): string {
  const d = new Date(isoStr);
  const num = d.getDate();
  const mes = MESES[d.getMonth()];
  return `${num} ${mes}. · ${horaTexto}`;
}
