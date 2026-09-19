import type { ReflectionCategory } from "@workspace/api-client-react";

export type ReflectionFixture = {
  category: ReflectionCategory;
  message: string;
  createdAt: string;
};

/**
 * Datos exclusivamente de desarrollo para validar textos de distinta longitud,
 * orden cronológico y agrupación de varias reflexiones en un mismo día.
 */
export const REFLECTION_FIXTURES: ReflectionFixture[] = [
  {
    category: "gratitude",
    message:
      "Hoy cierro el día con el corazón lleno. Agradezco las pequeñas cosas, las personas que me rodean y todo lo que estoy aprendiendo en este proceso.",
    createdAt: "2026-09-18T21:36:00-03:00",
  },
  {
    category: "calm",
    message:
      "Hoy quiero sentirme en paz con lo que no puedo controlar. Respiro, suelto y confío en que todo se acomoda en su momento.",
    createdAt: "2026-09-18T08:12:00-03:00",
  },
  {
    category: "clarity",
    message:
      "Quiero tener más claridad en mis decisiones y escuchar más a mi intuición. Cuando me detengo y respiro, las respuestas aparecen.",
    createdAt: "2026-09-17T10:24:00-03:00",
  },
  {
    category: "purpose",
    message: "Hoy elijo recordar hacia dónde quiero dirigir mi energía.",
    createdAt: "2026-09-16T07:50:00-03:00",
  },
  {
    category: "acceptance",
    message: "Estoy aprendiendo a aceptar aquello que no puedo cambiar.",
    createdAt: "2026-09-15T19:20:00-03:00",
  },
  {
    category: "calm",
    message:
      "Respiro. Todo está bien. No necesito tener todas las respuestas hoy. Confío en el proceso y me doy permiso para ir más despacio.",
    createdAt: "2026-09-14T08:15:00-03:00",
  },
  {
    category: "clarity",
    message: "Hoy distingo con serenidad qué decisión necesita mi atención.",
    createdAt: "2026-09-12T18:40:00-03:00",
  },
  {
    category: "purpose",
    message: "Un paso pequeño también puede acercarme a la vida que quiero construir.",
    createdAt: "2026-09-12T07:25:00-03:00",
  },
];