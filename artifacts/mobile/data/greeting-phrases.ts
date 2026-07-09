function isoWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
}

const CARD_PHRASES = [
  "El silencio también habla. Escucha.",
  "Respira. El presente es tu único hogar.",
  "Hay sabiduría en la quietud.",
  "Tu cuerpo sabe lo que tu mente olvida.",
  "Cada respiración es un nuevo comienzo.",
  "La paz no se encuentra. Se recuerda.",
  "Confía en el ritmo que ya llevas dentro.",
  "En el silencio interior, todo es claro.",
  "Lo que buscas ya vive en ti.",
  "Hoy es suficiente. Tú eres suficiente.",
  "El descanso es también una práctica sagrada.",
  "Suelta lo que no puedes controlar.",
  "La presencia plena es el regalo más grande.",
  "Cuando estás en calma, el mundo se aclara.",
  "Habita este momento con todo lo que eres.",
  "El cuerpo descansa; el alma se expande.",
  "Cada instante es una puerta hacia dentro.",
  "No necesitas hacer nada. Solo ser.",
  "La mente que observa no juzga. Solo ve.",
  "Lo esencial no tiene prisa.",
  "Vuelve siempre a tu centro.",
  "La quietud no es vacío. Es plenitud.",
  "Tus raíces sostienen tu vuelo.",
  "Hay fuerza en la suavidad.",
  "Este momento ya es suficiente.",
  "El amor que das también te transforma.",
];

const WEEKLY_DESCRIPTIONS = [
  "Un momento de calma puede cambiar el rumbo de tu jornada.",
  "La práctica constante transforma el carácter con suavidad.",
  "Cada semana trae una oportunidad de volver a ti.",
  "El bienestar no es un destino. Es una forma de caminar.",
  "Pequeños momentos de presencia construyen una vida plena.",
  "La meditación no te aleja del mundo. Te devuelve a él.",
  "Esta semana, invita al silencio como a un amigo.",
  "Tu interior merece la misma atención que el exterior.",
  "La regularidad es más poderosa que la intensidad.",
  "Cuando te centras, todo lo demás encuentra su lugar.",
  "El cuerpo descansado es un aliado para la mente clara.",
  "Una respiración profunda puede ser el reinicio que necesitas.",
  "Esta semana practica escuchar sin responder de inmediato.",
  "El descanso consciente es tan valioso como la acción.",
  "Cada día es una nueva práctica, no un examen.",
  "Dedica unos minutos al silencio y observa lo que surge.",
  "La gratitud cambia la forma en que percibes el tiempo.",
  "Haz una cosa a la vez. Es un acto radical de presencia.",
  "Esta semana, pon atención a lo que te nutre de verdad.",
  "Lo que resistes persiste. Lo que abrazas se transforma.",
  "El ritmo natural del cuerpo es sabio. Escúchalo.",
  "Dar espacio al descanso es dar espacio al crecimiento.",
  "Esta semana observa tus pensamientos sin seguirlos.",
  "La compasión contigo mismo es el comienzo de todo cambio.",
  "Cuando el cuerpo se relaja, la mente se abre.",
  "Esta semana, celebra cada pequeño momento de paz.",
];

export function getWeeklyPhrase(): string {
  const week = isoWeekNumber(new Date());
  return CARD_PHRASES[(week - 1) % CARD_PHRASES.length];
}

export function getWeeklyDescription(): string {
  const week = isoWeekNumber(new Date());
  return WEEKLY_DESCRIPTIONS[(week - 1) % WEEKLY_DESCRIPTIONS.length];
}
