export type MessagePack = {
  id: string;
  label: string;
  emoji: string;
  messages: string[];
};

export const MESSAGE_PACKS: MessagePack[] = [
  {
    id: "calma",
    label: "Calma",
    emoji: "🌊",
    messages: [
      "Respira profundo.\nEl presente es suficiente.",
      "No hay nada que resolver ahora.\nSolo estar.",
      "Tu mente puede descansar.\nEstás a salvo.",
      "Este momento es tuyo.\nNo tiene prisa.",
      "Cada sonido es un ancla\nal momento que eres.",
      "Deja que los sonidos\nte lleven más adentro.",
    ],
  },
  {
    id: "gratitud",
    label: "Gratitud",
    emoji: "✨",
    messages: [
      "Gracias por este momento\nde paz contigo.",
      "Tu presencia aquí\nes suficiente.",
      "Hay belleza en la quietud.",
      "Eres más de lo que crees.",
      "Cada respiro es un regalo.",
      "La vida se vive\ndesde adentro hacia afuera.",
    ],
  },
  {
    id: "energia",
    label: "Energía",
    emoji: "⚡",
    messages: [
      "Eres vibración.\nEres sonido. Eres vida.",
      "Cada célula vibra\ncon el universo.",
      "La energía fluye\na través de ti.",
      "Suena. Siente. Vive.",
      "Estás exactamente\ndonde necesitas estar.",
      "El sonido te recuerda\nquién eres.",
    ],
  },
  {
    id: "sueno",
    label: "Sueño",
    emoji: "🌙",
    messages: [
      "Deja ir el día.\nEl descanso te espera.",
      "Tu mente puede soltar\ncada pensamiento.",
      "Flota en la quietud.",
      "El sueño llega\ncuando te rindes suavemente.",
      "Nada que hacer.\nSolo ser.",
      "La noche te acoge\ncon ternura.",
    ],
  },
];

export const DEFAULT_MESSAGE_PACK_ID = "calma";
