/**
 * Contenido educativo por geometría — usado en la sección "Aprende" de Geometrix.
 * Agregar/editar el texto descriptivo de cada forma aquí.
 */
import type { GeometryId, GeometryCategory } from "./geometries";

export interface GeometryLearnContent {
  /** Frase corta (tag de significado, aparece en la lista) */
  tag: string;
  /** Una línea descriptiva para la lista */
  summary: string;
  /** Descripción completa (varios párrafos) */
  description: string;
  /** Atributos clave para el panel de detalle */
  attributes: { label: string; value: string }[];
  /** Tags semánticos del detalle */
  tags: string[];
}

const PLACEHOLDER: GeometryLearnContent = {
  tag: "Sagrado",
  summary: "Una de las formas fundamentales de la geometría sagrada.",
  description:
    "Esta geometría es parte del lenguaje universal de la creación. Su estructura matemática aparece repetidamente en la naturaleza, el arte y las tradiciones espirituales de todo el mundo.\n\nSu proporción refleja el orden subyacente del cosmos y ha sido utilizada por civilizaciones antiguas como herramienta de meditación y comprensión del universo.",
  attributes: [
    { label: "Origen", value: "Geometría universal" },
    { label: "Elemento", value: "Éter" },
    { label: "Cultura", value: "Múltiples tradiciones" },
    { label: "Número", value: "Proporción áurea" },
  ],
  tags: ["Sagrado", "Universal", "Meditación"],
};

export const GEOMETRY_LEARN: Partial<Record<GeometryId, GeometryLearnContent>> = {
  // ── Geometría Sagrada ──────────────────────────────────────────────────────
  "flor-vida": {
    tag: "Origen",
    summary: "Patrón de 19 círculos que representa la creación del universo",
    description:
      "La Flor de la Vida es considerada el símbolo geométrico más sagrado e importante de toda la geometría sagrada. Es un patrón de 19 círculos que se entrelazan de manera perfecta, creando una forma que se repite infinitamente en la naturaleza.\n\nEste patrón contiene dentro de sí misma todas las otras formas sagradas, incluyendo la Semilla de la Vida, el Fruto de la Vida y el Cubo de Metatrón. Se ha encontrado en culturas de todo el mundo, desde los templos egipcios de Abidos hasta los manuscritos medievales europeos.\n\nLa estructura matemática de la Flor de la Vida refleja la proporción áurea (φ = 1.618), la misma proporción que aparece en las espirales de los caracoles, el crecimiento de las plantas y las proporciones del cuerpo humano.",
    attributes: [
      { label: "Origen", value: "El código maestro de la creación" },
      { label: "Elemento", value: "Todos los elementos · Éter" },
      { label: "Cultura", value: "Egipto, India, China, Mesopotamia" },
      { label: "Número", value: "7 — ciclos de la naturaleza" },
    ],
    tags: ["Sagrado", "Creación", "Universal"],
  },
  "semilla-vida": {
    tag: "Base",
    summary: "7 círculos que conforman el inicio de toda geometría sagrada",
    description:
      "La Semilla de la Vida es la forma más simple de la familia de la Flor de la Vida, compuesta por 7 círculos de igual tamaño donde cada uno pasa por el centro de los otros seis que lo rodean.\n\nEsta forma representa los 7 días de la creación y es el primer patrón que emerge cuando se traza la Flor de la Vida. Se considera el 'ADN' de toda la geometría sagrada, pues todas las demás formas pueden derivarse de ella.\n\nEn muchas tradiciones espirituales representa la semana, los chakras y los planetas clásicos del sistema solar.",
    attributes: [
      { label: "Origen", value: "Primer patrón de la creación" },
      { label: "Elemento", value: "Los 4 elementos + Éter" },
      { label: "Cultura", value: "Cabalá, Hinduismo, Celtismo" },
      { label: "Número", value: "7 — días, chakras, planetas" },
    ],
    tags: ["Base", "Creación", "Ciclos"],
  },
  "metatron": {
    tag: "Arquetipo",
    summary: "Contiene los 5 sólidos platónicos dentro de su estructura",
    description:
      "El Cubo de Metatrón es una figura sagrada derivada del Fruto de la Vida y nombrada en honor al arcángel Metatrón, guardián del árbol de la vida en la tradición judía.\n\nEsta forma contiene dentro de sí los cinco Sólidos Platónicos: el tetraedro, el cubo, el octaedro, el icosaedro y el dodecaedro. Estos sólidos representan los cinco elementos clásicos: fuego, tierra, aire, agua y éter.\n\nSe utiliza como herramienta de meditación para conectar con los arquetipos universales y como mapa del flujo de energía en el universo.",
    attributes: [
      { label: "Origen", value: "Tradición judía y geometría sagrada" },
      { label: "Elemento", value: "Los 5 elementos platónicos" },
      { label: "Cultura", value: "Cabalá, geometría griega" },
      { label: "Número", value: "13 — esferas del Fruto de la Vida" },
    ],
    tags: ["Arquetipo", "Platónico", "Protección"],
  },
  "merkaba": {
    tag: "Energía",
    summary: "Vehículo de luz que fusiona el cuerpo físico con el espiritual",
    description:
      "El Merkaba (del hebreo Mer = luz, Ka = espíritu, Ba = cuerpo) es un campo de energía sagrada formado por dos tetraedros entrelazados girando en sentidos opuestos.\n\nSegún las tradiciones antiguas, el Merkaba es el vehículo de luz que rodea el cuerpo humano y permite la ascensión o viaje entre dimensiones. Se cree que cuando se activa mediante la meditación, crea un campo electromagnético sagrado alrededor del practicante.\n\nEs un símbolo central en el misticismo judío, el antiguo Egipto y diversas tradiciones esotéricas modernas.",
    attributes: [
      { label: "Origen", value: "Vehículo de luz dimensional" },
      { label: "Elemento", value: "Fuego y Agua (tetraedros)" },
      { label: "Cultura", value: "Judaísmo, Egipto antiguo" },
      { label: "Número", value: "3 — cuerpo, mente, espíritu" },
    ],
    tags: ["Energía", "Ascensión", "Protección"],
  },
  "vesica": {
    tag: "Dualidad",
    summary: "La intersección de dos círculos iguales, símbolo de creación",
    description:
      "La Vesica Piscis (latín: vejiga de pez) es la figura geométrica formada por la intersección de dos círculos del mismo radio, donde el centro de cada uno está en la circunferencia del otro.\n\nEs considerada el símbolo de la creación primordial — el punto de unión entre dos mundos o dimensiones. Las proporciones de la Vesica Piscis contienen la raíz cuadrada de 3, fundamental en la construcción de la Flor de la Vida y la arquitectura sagrada.\n\nAparece en la arquitectura de catedrales medievales, en el arte cristiano primitivo (el icthys o pez cristiano), y en los textos de geometría sagrada de Da Vinci.",
    attributes: [
      { label: "Origen", value: "Unión de dos mundos" },
      { label: "Elemento", value: "Agua — fluidez y creación" },
      { label: "Cultura", value: "Cristianismo, Grecia, Roma" },
      { label: "Número", value: "√3 — proporción sagrada" },
    ],
    tags: ["Dualidad", "Unión", "Creación"],
  },
  "sri-yantra": {
    tag: "Meditación",
    summary: "9 triángulos entrelazados que representan los 85.000 mantras",
    description:
      "El Sri Yantra (o Sri Chakra) es considerado el más poderoso y auspicioso de todos los yantras en la tradición hindú. Está compuesto por 9 triángulos entrelazados que crean 43 triángulos más pequeños en una configuración perfectamente equilibrada.\n\nLos 4 triángulos apuntando hacia arriba representan Shiva (principio masculino/consciente), mientras que los 5 triángulos apuntando hacia abajo representan Shakti (principio femenino/energía primordial). La intersección de estos 9 triángulos crea el punto central llamado Bindu, que representa la fuente de toda la creación.\n\nSe utiliza como soporte de meditación para alcanzar estados elevados de consciencia y se asocia con la prosperidad, la abundancia y la iluminación espiritual.",
    attributes: [
      { label: "Origen", value: "Tradición tántrica hindú" },
      { label: "Elemento", value: "Los 5 elementos + consciencia" },
      { label: "Cultura", value: "India — hinduismo y tantra" },
      { label: "Número", value: "9 — triángulos primordiales" },
    ],
    tags: ["Meditación", "Shakti", "Abundancia"],
  },
  "toroide": {
    tag: "Campo",
    summary: "El campo energético universal en forma de donut continuo",
    description:
      "El Toroide es la forma geométrica tridimensional que describe cómo fluye la energía en el universo — desde el nivel subatómico hasta las galaxias. Tiene la forma de un donut o toro, donde la energía fluye continuamente hacia adentro a través del centro y hacia afuera por los lados.\n\nEl campo electromagnético del corazón humano tiene forma toroidal, al igual que el campo magnético de la Tierra y los patrones de crecimiento de muchas plantas y frutos. Es el patrón de flujo de energía más fundamental del universo.\n\nEn la física moderna, los modelos toroidales se utilizan para describir el plasma en reactores de fusión nuclear (tokamaks) y se exploran como posibles geometrías del universo.",
    attributes: [
      { label: "Origen", value: "Campo de flujo universal" },
      { label: "Elemento", value: "Éter — energía en movimiento" },
      { label: "Cultura", value: "Física cuántica, tradiciones sufíes" },
      { label: "Número", value: "∞ — flujo sin fin" },
    ],
    tags: ["Campo", "Flujo", "Universal"],
  },
  "mandala": {
    tag: "Totalidad",
    summary: "Representación circular del universo y el ser interior",
    description:
      "El Mandala (sánscrito: círculo) es una representación geométrica sagrada que simboliza el universo, el cosmos y la totalidad de la existencia. Aparece en prácticamente todas las culturas del mundo bajo diferentes formas y nombres.\n\nEn el budismo y el hinduismo, los mandalas se utilizan como mapas espirituales del cosmos y como apoyo a la meditación. El psicólogo Carl Jung los utilizó como herramienta terapéutica, reconociendo su capacidad para representar el Ser total.\n\nLa creación de mandalas con arena es una práctica meditativa tibetana donde los monjes crean intrincados diseños durante días o semanas, y luego los destruyen para simbolizar la impermanencia.",
    attributes: [
      { label: "Origen", value: "Mapa del cosmos y el Ser" },
      { label: "Elemento", value: "Todos los elementos" },
      { label: "Cultura", value: "Budismo, Hinduismo, Jung" },
      { label: "Número", value: "∞ — totalidad del ser" },
    ],
    tags: ["Totalidad", "Meditación", "Cosmos"],
  },
  "triquetra": {
    tag: "Trinidad",
    summary: "Tres arcos entrelazados, símbolo de lo eterno y sin fin",
    description:
      "La Triquetra (del latín: tres esquinas) es un símbolo formado por tres arcos entrelazados que crean un nudo continuo sin principio ni fin. Es uno de los símbolos más antiguos conocidos, con apariciones en el norte de Europa que datan de más de 5.000 años.\n\nEn la tradición celta, representa las tres fuerzas de la naturaleza: tierra, mar y cielo; o el pasado, presente y futuro. En el cristianismo se adoptó como símbolo de la Trinidad: Padre, Hijo y Espíritu Santo.\n\nLa geometría de la Triquetra está íntimamente relacionada con el vesica piscis — de hecho, puede construirse a partir de tres vesica pisces superpuestas.",
    attributes: [
      { label: "Origen", value: "Símbolo celta de 5.000+ años" },
      { label: "Elemento", value: "Los 3 elementos celtas" },
      { label: "Cultura", value: "Celtismo, Nórdico, Cristianismo" },
      { label: "Número", value: "3 — trinidad universal" },
    ],
    tags: ["Trinidad", "Eterno", "Celta"],
  },
  "arbol-vida": {
    tag: "Kabbalah",
    summary: "10 sefirot que mapean la conciencia cósmica y el alma",
    description:
      "El Árbol de la Vida es el diagrama central de la Cabalá, compuesto por 10 sefirot (esferas de luz) interconectadas por 22 senderos. Representa el mapa de la creación, desde la fuente divina infinita (Ein Sof) hasta la manifestación material.\n\nCada sefirá representa una cualidad divina: Keter (corona/voluntad divina), Chokhmah (sabiduría), Binah (entendimiento), Chesed (amor), Gevurah (fuerza), Tiferet (belleza), Netzach (victoria), Hod (esplendor), Yesod (fundamento) y Malkuth (reino/tierra).\n\nEl Árbol de la Vida se superpone perfectamente sobre el cuerpo humano y el Cubo de Metatrón, estableciendo conexiones profundas entre la anatomía, la cosmología y la espiritualidad.",
    attributes: [
      { label: "Origen", value: "Mapa de la creación divina" },
      { label: "Elemento", value: "Los 4 mundos kabbalísticos" },
      { label: "Cultura", value: "Judaísmo místico (Cabalá)" },
      { label: "Número", value: "10 sefirot, 22 senderos" },
    ],
    tags: ["Kabbalah", "Consciencia", "Creación"],
  },

  // ── Poliedros 3D ───────────────────────────────────────────────────────────
  "tetraedro": {
    tag: "Fuego",
    summary: "El más simple de los sólidos platónicos — 4 triángulos equiláteros",
    description:
      "El Tetraedro es el más fundamental de los cinco sólidos platónicos, compuesto por 4 caras triangulares equiláteras. Es el sólido de menor cantidad de caras posible en tres dimensiones y representa el elemento fuego en la filosofía platónica.\n\nPlaceholder — descripción completa próximamente.",
    attributes: [
      { label: "Elemento", value: "Fuego" },
      { label: "Caras", value: "4 triángulos equiláteros" },
      { label: "Vértices", value: "4" },
      { label: "Aristas", value: "6" },
    ],
    tags: ["Fuego", "Platónico", "Simplicidad"],
  },
  "hexaedro": {
    tag: "Tierra",
    summary: "El cubo — estabilidad y el elemento tierra",
    description:
      "El Hexaedro (cubo) representa el elemento tierra en la tradición platónica. Sus 6 caras cuadradas y su perfecta simetría lo convierten en símbolo de estabilidad, solidez y manifestación material.\n\nPlaceholder — descripción completa próximamente.",
    attributes: [
      { label: "Elemento", value: "Tierra" },
      { label: "Caras", value: "6 cuadrados" },
      { label: "Vértices", value: "8" },
      { label: "Aristas", value: "12" },
    ],
    tags: ["Tierra", "Estabilidad", "Platónico"],
  },
  "octaedro": {
    tag: "Aire",
    summary: "8 triángulos equiláteros — el sólido del elemento aire",
    description:
      "El Octaedro, con sus 8 caras triangulares, representa el elemento aire. Su forma simétrica puede verse como dos pirámides cuadradas unidas por su base.\n\nPlaceholder — descripción completa próximamente.",
    attributes: [
      { label: "Elemento", value: "Aire" },
      { label: "Caras", value: "8 triángulos equiláteros" },
      { label: "Vértices", value: "6" },
      { label: "Aristas", value: "12" },
    ],
    tags: ["Aire", "Equilibrio", "Platónico"],
  },
  "icosaedro": {
    tag: "Agua",
    summary: "20 triángulos — el sólido del elemento agua y la fluidez",
    description:
      "El Icosaedro, con 20 caras triangulares, representa el elemento agua en la tradición platónica. Es el más esférico de los sólidos platónicos y su forma aparece en muchos virus y estructuras de proteínas.\n\nPlaceholder — descripción completa próximamente.",
    attributes: [
      { label: "Elemento", value: "Agua" },
      { label: "Caras", value: "20 triángulos equiláteros" },
      { label: "Vértices", value: "12" },
      { label: "Aristas", value: "30" },
    ],
    tags: ["Agua", "Fluidez", "Platónico"],
  },
  "dodecaedro": {
    tag: "Éter",
    summary: "12 pentágonos — el sólido del cosmos y el éter",
    description:
      "El Dodecaedro, formado por 12 pentágonos regulares, representa el éter o el cosmos en la tradición platónica. Platón afirmó que 'Dios usó este sólido para bordear el universo'. Cada cara es un pentágono que contiene la proporción áurea en su geometría.\n\nPlaceholder — descripción completa próximamente.",
    attributes: [
      { label: "Elemento", value: "Éter / Cosmos" },
      { label: "Caras", value: "12 pentágonos regulares" },
      { label: "Vértices", value: "20" },
      { label: "Aristas", value: "30" },
    ],
    tags: ["Éter", "Cosmos", "Proporción áurea"],
  },

  // ── Formas y Estrellas ─────────────────────────────────────────────────────
  "espiral": {
    tag: "Proporción",
    summary: "La espiral de Fibonacci que rige el crecimiento en la naturaleza",
    description:
      "La Espiral Áurea es una espiral logarítmica cuyo factor de crecimiento es la proporción áurea φ (phi ≈ 1.618). Esta proporción aparece en las conchas de caracol, el giro de las galaxias, el filo de las semillas de girasol y el crecimiento de las plantas.\n\nPlaceholder — descripción completa próximamente.",
    attributes: [
      { label: "Proporción", value: "φ = 1.618... (Phi)" },
      { label: "Elemento", value: "Agua — flujo y crecimiento" },
      { label: "Cultura", value: "Grecia, Renacimiento, naturaleza" },
      { label: "Número", value: "Fibonacci: 1,1,2,3,5,8,13…" },
    ],
    tags: ["Proporción", "Naturaleza", "Crecimiento"],
  },
  "pentagrama": {
    tag: "Divino",
    summary: "Estrella de 5 puntas — símbolo de protección y lo divino",
    description:
      "El Pentagrama es una estrella de 5 puntas formada por 5 líneas diagonales de un pentágono regular. Cada intersección de sus líneas crea la proporción áurea, lo que lo convierte en un símbolo geométricamente rico y sagrado.\n\nPlaceholder — descripción completa próximamente.",
    attributes: [
      { label: "Elemento", value: "Los 5 elementos" },
      { label: "Cultura", value: "Grecia, Pitagorismo, Wicca" },
      { label: "Proporción", value: "φ en cada intersección" },
      { label: "Número", value: "5 — los sentidos y elementos" },
    ],
    tags: ["Divino", "Protección", "Proporción áurea"],
  },
  "hexagrama": {
    tag: "Unión",
    summary: "Estrella de David — la unión de lo masculino y lo femenino",
    description:
      "El Hexagrama, conocido como la Estrella de David (Magen David) en el judaísmo, está formado por dos triángulos equiláteros superpuestos, uno apuntando hacia arriba y otro hacia abajo. Simboliza la unión de los opuestos: cielo y tierra, masculino y femenino, fuego y agua.\n\nPlaceholder — descripción completa próximamente.",
    attributes: [
      { label: "Elemento", value: "Fuego + Agua" },
      { label: "Cultura", value: "Judaísmo, Hinduismo, Islam" },
      { label: "Símbolo", value: "Unión de opuestos" },
      { label: "Número", value: "6 — armonía y equilibrio" },
    ],
    tags: ["Unión", "Dualidad", "Sagrado"],
  },
};

/** Obtiene el contenido educativo de una geometría, con fallback al placeholder */
export function getGeometryLearn(id: GeometryId): GeometryLearnContent {
  return GEOMETRY_LEARN[id] ?? PLACEHOLDER;
}

/** Íconos de categoría para la pantalla principal de Aprende */
export const CATEGORY_META: Record<
  GeometryCategory,
  { desc: string; count: number }
> = {
  sagradas: {
    desc: "Patrones universales que conectan la naturaleza con lo divino",
    count: 20,
  },
  poliedros: {
    desc: "Los cinco sólidos de Platón y sus extensiones dimensionales",
    count: 9,
  },
  formas: {
    desc: "Polígonos, espirales y estrellas que revelan el orden matemático",
    count: 15,
  },
};
