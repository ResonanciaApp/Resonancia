export type DailyWisdomQuote = {
  author: string;
  text: string;
};

export const DAILY_WISDOM_QUOTES: DailyWisdomQuote[] = [
  { author: "Mooji", text: "No eres tus pensamientos; eres la presencia que los observa." },
  { author: "Mooji", text: "Dentro de ti existe un silencio que nunca ha sido perturbado." },
  { author: "Mooji", text: "Suelta la historia y descubre la libertad que ya está aquí." },
  { author: "Mooji", text: "Tu verdadera naturaleza no necesita convertirse en nada." },
  { author: "Mooji", text: "Los pensamientos vienen y van, pero la conciencia permanece." },
  { author: "Mooji", text: "La paz aparece cuando dejas de perseguirla." },
  { author: "Mooji", text: "Quédate en el simple reconocimiento de que existes." },

  { author: "Jiddu Krishnamurti", text: "Observar sin evaluar es una forma elevada de inteligencia." },
  { author: "Jiddu Krishnamurti", text: "Para transformar el mundo debemos comenzar por nosotros mismos." },
  { author: "Jiddu Krishnamurti", text: "La mente quieta puede descubrir aquello que es verdadero." },
  { author: "Jiddu Krishnamurti", text: "El miedo nace cuando el pensamiento abandona el presente." },
  { author: "Jiddu Krishnamurti", text: "La comprensión llega con la atención, no con la condena." },
  { author: "Jiddu Krishnamurti", text: "El silencio posee una creatividad que el ruido desconoce." },
  { author: "Jiddu Krishnamurti", text: "Conocerse a uno mismo es el comienzo de la sabiduría." },

  { author: "Alan Watts", text: "El sentido de la vida es estar plenamente vivo." },
  { author: "Alan Watts", text: "Eres el universo experimentándose desde un punto particular." },
  { author: "Alan Watts", text: "La vida no va hacia ningún lugar: ya está sucediendo aquí." },
  { author: "Alan Watts", text: "La única manera de comenzar es comenzar desde ahora." },
  { author: "Alan Watts", text: "La fe es una apertura sincera hacia el misterio." },
  { author: "Alan Watts", text: "No puedes atrapar el agua cerrando el puño." },
  { author: "Alan Watts", text: "Quien aprende a vivir deja de pelear con el cambio." },

  { author: "Eckhart Tolle", text: "El momento presente es el único lugar donde ocurre la vida." },
  { author: "Eckhart Tolle", text: "Eres la conciencia que existe detrás de la mente." },
  { author: "Eckhart Tolle", text: "La resistencia crea sufrimiento; la aceptación abre espacio." },
  { author: "Eckhart Tolle", text: "La quietud no está vacía: está llena de vida." },
  { author: "Eckhart Tolle", text: "Observa tu mente y dejarás de ser prisionero de ella." },
  { author: "Eckhart Tolle", text: "Este instante no es un obstáculo; es tu puerta de entrada." },
  { author: "Eckhart Tolle", text: "La paz comienza cuando haces amistad con el presente." },

  { author: "Jesús", text: "Ama a tu prójimo como a ti mismo." },
  { author: "Jesús", text: "Donde esté tu tesoro, allí estará también tu corazón." },
  { author: "Jesús", text: "No se turbe tu corazón ni tenga miedo." },
  { author: "Jesús", text: "La verdad los hará libres." },
  { author: "Jesús", text: "Bienaventurados los que trabajan por la paz." },
  { author: "Jesús", text: "Trata a los demás como quieres que ellos te traten." },
  { author: "Jesús", text: "El reino de Dios está dentro de ustedes." },

  { author: "Buda", text: "La paz viene de dentro; no la busques fuera." },
  { author: "Buda", text: "Lo que piensas, en eso te conviertes." },
  { author: "Buda", text: "El odio no cesa con odio, sino con amor." },
  { author: "Buda", text: "Cada mañana nacemos de nuevo; lo que hacemos hoy importa." },
  { author: "Buda", text: "La mente disciplinada trae felicidad." },
  { author: "Buda", text: "No habites en el pasado ni sueñes con el futuro: habita el presente." },
  { author: "Buda", text: "Miles de velas pueden encenderse sin disminuir la luz de una sola." },

  { author: "Lao Tse", text: "Un viaje de mil pasos comienza bajo tus pies." },
  { author: "Lao Tse", text: "Cuando dejo de ser lo que soy, me convierto en lo que puedo ser." },
  { author: "Lao Tse", text: "La naturaleza no se apresura y, sin embargo, todo se cumple." },
  { author: "Lao Tse", text: "Conocer a otros es inteligencia; conocerse a uno mismo es sabiduría." },
  { author: "Lao Tse", text: "Quien sabe que tiene suficiente es verdaderamente rico." },
  { author: "Lao Tse", text: "La suavidad vence a la dureza; la quietud vence al ruido." },
  { author: "Lao Tse", text: "Para recibirlo todo, abre las manos." },

  { author: "Rumi", text: "Lo que buscas también te está buscando." },
  { author: "Rumi", text: "La herida es el lugar por donde entra la luz." },
  { author: "Rumi", text: "Deja que el silencio te lleve al centro de la vida." },
  { author: "Rumi", text: "Ayer era inteligente y quería cambiar el mundo; hoy cambio yo." },
  { author: "Rumi", text: "Hay una voz que no usa palabras: aprende a escucharla." },
  { author: "Rumi", text: "No eres una gota en el océano; eres el océano en una gota." },
  { author: "Rumi", text: "Cuando actúas desde el alma, un río de alegría corre dentro de ti." },

  { author: "Thích Nhất Hạnh", text: "La vida solo está disponible en el momento presente." },
  { author: "Thích Nhất Hạnh", text: "Sonríe, respira y avanza despacio." },
  { author: "Thích Nhất Hạnh", text: "Cada paso puede ser un paso de sanación." },
  { author: "Thích Nhất Hạnh", text: "La compasión es el antídoto del miedo." },
  { author: "Thích Nhất Hạnh", text: "La paz está presente en cada respiración consciente." },
  { author: "Thích Nhất Hạnh", text: "Comprender es otra forma de amar." },
  { author: "Thích Nhất Hạnh", text: "Camina como si besaras la tierra con tus pies." },

  { author: "Confucio", text: "Estudia el pasado si quieres comprender el futuro." },
  { author: "Confucio", text: "No importa lo lento que avances mientras no te detengas." },
  { author: "Confucio", text: "La persona que mueve una montaña comienza retirando pequeñas piedras." },
  { author: "Confucio", text: "Exígete mucho a ti mismo y espera poco de los demás." },
  { author: "Confucio", text: "Saber lo que sabes y reconocer lo que no sabes es sabiduría." },
  { author: "Confucio", text: "Dondequiera que vayas, ve con todo tu corazón." },
  { author: "Confucio", text: "Nuestra mayor gloria está en levantarnos cada vez que caemos." },
];

export function getDailyWisdomQuote(date = new Date()): DailyWisdomQuote {
  const localDayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  return DAILY_WISDOM_QUOTES[localDayNumber % DAILY_WISDOM_QUOTES.length];
}