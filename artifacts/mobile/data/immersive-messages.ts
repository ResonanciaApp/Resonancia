export type MessagePack = {
  id: string;
  label: string;
  emoji: string;
  messages: string[];
};

export const MESSAGE_PACKS: MessagePack[] = [
  {
    id: "calma",
    label: "Fluir",
    emoji: "🌊",
    messages: [
      "No resistes, no empujas.\nSimplemente fluyes.",
      "La vida se abre\ncuando dejas de forzarla.",
      "Eres agua:\ntomas la forma que necesitas.",
      "Soltar también\nes una forma de avanzar.",
      "Cuando fluyes,\nel camino aparece solo.",
      "Confías en el proceso\naunque no veas el destino.",
    ],
  },
  {
    id: "gratitud",
    label: "Gratitud",
    emoji: "✨",
    messages: [
      "Hay algo en tu vida\nque merece ser celebrado hoy.",
      "La gratitud convierte\nlo que tienes en suficiente.",
      "Tu cuerpo respira.\nEso ya es un regalo.",
      "Las cosas simples\nson las que más importan.",
      "Agradeces y el mundo\nresponde con más.",
      "Estás aquí.\nEso tiene un valor enorme.",
    ],
  },
  {
    id: "energia",
    label: "Positivismo",
    emoji: "⚡",
    messages: [
      "Lo que piensas\nse convierte en lo que vives.",
      "Hoy eliges ver\nlo que puede salir bien.",
      "Cada momento tiene\nuna luz, si la buscas.",
      "Tu actitud cambia\nlo que te rodea.",
      "Hay posibilidades\ndonde antes solo veías límites.",
      "El optimismo no es ingenuidad,\nes una decisión valiente.",
    ],
  },
  {
    id: "sueno",
    label: "Desafios",
    emoji: "🌙",
    messages: [
      "Los obstáculos no te detienen,\nte forman.",
      "Ya has superado\ncosas que antes parecían imposibles.",
      "Cada dificultad\nrevela una fortaleza que no sabías que tenías.",
      "No necesitas certeza\npara dar el siguiente paso.",
      "La presión crea\nlo más valioso.",
      "Creciste cada vez\nque no te rendiste.",
    ],
  },
];

export const DEFAULT_MESSAGE_PACK_ID = "calma";
