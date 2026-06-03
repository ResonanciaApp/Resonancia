// AUTO-GENERADO — snapshot de migración del catálogo (Tarea #20).
  // Fuente: artifacts/mobile/data/{sessions,categories}.ts + config/audio-map.ts.
  // Regenerar con el script de extracción si el catálogo bundleado cambia.
  // Adelante, la DB pasa a ser la fuente de verdad (panel de creador).
  import type {
    InsertCatalogCategory,
    InsertCatalogSession,
    InsertCatalogAudioFile,
  } from "../schema";
  
export const SEED_CATEGORIES: InsertCatalogCategory[] = [
  {
    "id": "sonidos-ancestrales",
    "title": "Ancestrales",
    "subtitle": "Cuencos, gongs y frecuencias sagradas",
    "icon": "bowl-mix",
    "sessionCount": 4,
    "color": "#f4c993",
    "gradientStart": "#7A5520",
    "gradientEnd": "#3E2208",
    "isPrimary": true,
    "sortOrder": 0,
    "iconFamily": "MaterialCommunityIcons"
  },
  {
    "id": "meditaciones-guiadas",
    "title": "Meditaciones",
    "subtitle": "Viajes interiores guiados por el sonido",
    "icon": "eye",
    "sessionCount": 3,
    "color": "#C8B4E0",
    "gradientStart": "#4A3260",
    "gradientEnd": "#251633",
    "isPrimary": true,
    "sortOrder": 1
  },
  {
    "id": "musica-sonidos",
    "title": "Música",
    "subtitle": "Atmósferas sonoras para meditar",
    "icon": "music",
    "sessionCount": 2,
    "color": "#A8C4A8",
    "gradientStart": "#3A5438",
    "gradientEnd": "#1E2E1C",
    "isPrimary": true,
    "sortOrder": 2
  },
  {
    "id": "sabiduria-dia",
    "title": "3 Minutos de Sabiduría",
    "subtitle": "Sabiduría condensada en 3 minutos",
    "icon": "sun",
    "sessionCount": 1,
    "color": "#F0CC82",
    "gradientStart": "#5E4A22",
    "gradientEnd": "#3A2E12",
    "isPrimary": false,
    "sortOrder": 3
  },
  {
    "id": "podcast",
    "title": "Sonidos",
    "subtitle": "Conversaciones que despiertan el alma",
    "icon": "waveform",
    "sessionCount": 1,
    "color": "#8AAAD4",
    "gradientStart": "#243350",
    "gradientEnd": "#101A28",
    "isPrimary": true,
    "sortOrder": 4,
    "iconFamily": "MaterialCommunityIcons"
  },
  {
    "id": "mananas",
    "title": "Mañanas",
    "subtitle": "Rituales para comenzar el día con energía",
    "icon": "sun",
    "sessionCount": 0,
    "color": "#f4c993",
    "gradientStart": "#5C4A10",
    "gradientEnd": "#2E2408",
    "isPrimary": true,
    "sortOrder": 5
  },
  {
    "id": "noches",
    "title": "Noches",
    "subtitle": "Prepara tu cuerpo y mente para el descanso",
    "icon": "moon",
    "sessionCount": 0,
    "color": "#4DB8A0",
    "gradientStart": "#1A4A42",
    "gradientEnd": "#0C2420",
    "isPrimary": true,
    "sortOrder": 6
  }
];

export const SEED_SESSIONS: InsertCatalogSession[] = [
  {
    "id": "1",
    "title": "Adentro de uno mismo",
    "subtitle": "Meditación Guiada",
    "categoryId": "meditaciones-guiadas",
    "categoryLabel": "Meditaciones",
    "duration": 30,
    "durationLabel": "30 min",
    "description": "Un viaje guiado hacia el centro de tu ser. El sonido de los cuencos te acompaña suavemente mientras te sumerges en las capas más profundas de tu interior, encontrando quietud y claridad.",
    "benefits": [
      "Relajación profunda",
      "Claridad mental",
      "Conexión interior",
      "Paz duradera"
    ],
    "instruments": [
      "Cuencos tibetanos",
      "Campana",
      "Voz guía"
    ],
    "imageKey": "session-1.jpg",
    "isFeatured": true,
    "isNew": false,
    "isPremium": false,
    "status": "published",
    "sortOrder": 0,
    "meditationTag": "Visualizaciones",
    "guideId": "sofia-ramirez"
  },
  {
    "id": "2",
    "title": "Para dormir bien",
    "subtitle": "Baño de Cuencos y Gongs",
    "categoryId": "sonidos-ancestrales",
    "categoryLabel": "Ancestrales",
    "duration": 45,
    "durationLabel": "45 min",
    "description": "Las frecuencias profundas de cuencos tibetanos y gong guían tu mente hacia el descanso más reparador. Cada vibración disuelve la tensión acumulada y prepara tu cuerpo para un sueño sagrado.",
    "benefits": [
      "Sueño profundo",
      "Alivio del estrés",
      "Relajación total",
      "Descanso reparador"
    ],
    "instruments": [
      "Cuencos tibetanos martillados",
      "Gong Paiste",
      "Tingsha"
    ],
    "imageKey": "session-2.jpg",
    "isFeatured": true,
    "isNew": false,
    "isPremium": false,
    "status": "published",
    "sortOrder": 1,
    "frequency": "Delta 0.5–4 Hz",
    "ancestralTag": "Cuencos y Gongs",
    "sleepTag": "Sonidos Ancestrales"
  },
  {
    "id": "4",
    "title": "Dentro de uno",
    "subtitle": "El Gran Despertar · Episodio 1",
    "categoryId": "podcast",
    "categoryLabel": "Mezclador",
    "duration": 35,
    "durationLabel": "35 min",
    "description": "Una conversación profunda sobre el despertar de la conciencia y el camino hacia el autoconocimiento. Reflexiones que invitan a mirar adentro con honestidad y compasión.",
    "benefits": [
      "Autoconocimiento",
      "Inspiración profunda",
      "Claridad de vida",
      "Perspectiva nueva"
    ],
    "instruments": [
      "Voz",
      "Cuenco tibetano de apertura",
      "Silencio consciente"
    ],
    "imageKey": "session-4.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": false,
    "status": "published",
    "sortOrder": 2,
    "podcastTag": "Espiritualidad",
    "guests": [
      {
        "name": "Ricardo Galdamez",
        "role": "Profesor de Yoga"
      }
    ]
  },
  {
    "id": "5",
    "title": "Más allá del sonido",
    "subtitle": "Consejo del Día",
    "categoryId": "sabiduria-dia",
    "categoryLabel": "3 Minutos de Sabiduría",
    "duration": 5,
    "durationLabel": "5 min",
    "description": "Una pequeña semilla de sabiduría para plantar en tu jornada. El sonido del cuenco abre el espacio, y la reflexión que le sigue puede cambiar el rumbo de tu día.",
    "benefits": [
      "Inspiración diaria",
      "Intención clara",
      "Perspectiva fresca",
      "Momento de pausa"
    ],
    "instruments": [
      "Cuenco tibetano",
      "Voz guía"
    ],
    "imageKey": "session-5.jpg",
    "isFeatured": true,
    "isNew": false,
    "isPremium": false,
    "status": "published",
    "sortOrder": 3,
    "sabiduriaTag": "Silencio Interior"
  },
  {
    "id": "7",
    "title": "Prueba",
    "subtitle": "Meditación Guiada",
    "categoryId": "meditaciones-guiadas",
    "categoryLabel": "Meditaciones",
    "duration": 20,
    "durationLabel": "20 min",
    "description": "Una sesión de meditación guiada para explorar tu mundo interior. Los sonidos de cuencos tibetanos te acompañan en un viaje de atención plena y presencia consciente.",
    "benefits": [
      "Relajación profunda",
      "Presencia plena",
      "Claridad mental",
      "Paz interior"
    ],
    "instruments": [
      "Cuencos tibetanos",
      "Voz guía",
      "Campanilla"
    ],
    "imageKey": "session-7.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": true,
    "status": "published",
    "sortOrder": 4,
    "meditationTag": "Escaneo Corporal"
  },
  {
    "id": "8",
    "title": "Ondas Delta para Dormir",
    "subtitle": "Sonidos Binaurales con Cuencos",
    "categoryId": "sonidos-ancestrales",
    "categoryLabel": "Ancestrales",
    "duration": 45,
    "durationLabel": "45 min",
    "description": "Frecuencias binaurales delta entretejidas con el canto de cuencos tibetanos. Tu cerebro es guiado suavemente hacia el estado de sueño más profundo y reparador.",
    "benefits": [
      "Sueño profundo",
      "Reducción del estrés",
      "Regeneración celular",
      "Paz mental"
    ],
    "instruments": [
      "Cuencos tibetanos",
      "Frecuencias binaurales delta"
    ],
    "imageKey": "session-9.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": false,
    "status": "published",
    "sortOrder": 5,
    "frequency": "Delta 1–4 Hz",
    "ancestralTag": "Cuencos Tibetanos",
    "sleepTag": "Sonidos Binaurales"
  },
  {
    "id": "9",
    "title": "Theta Profundo con Cuencos",
    "subtitle": "Sonidos Binaurales con Cuencos",
    "categoryId": "sonidos-ancestrales",
    "categoryLabel": "Ancestrales",
    "duration": 30,
    "durationLabel": "30 min",
    "description": "El estado theta es el umbral entre el sueño y la vigilia. Los cuencos y las frecuencias binaurales te llevan a ese espacio liminal donde surgen los sueños lúcidos y la intuición.",
    "benefits": [
      "Creatividad expandida",
      "Sueños lúcidos",
      "Intuición profunda",
      "Relajación total"
    ],
    "instruments": [
      "Cuencos de cuarzo",
      "Frecuencias binaurales theta"
    ],
    "imageKey": "session-9.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": false,
    "status": "published",
    "sortOrder": 6,
    "frequency": "Theta 4–8 Hz",
    "ancestralTag": "Cuencos de Cuarzo",
    "sleepTag": "Sonidos Binaurales"
  },
  {
    "id": "10",
    "title": "Sincronización Gamma 40Hz",
    "subtitle": "Sonidos Binaurales con Cuencos",
    "categoryId": "sonidos-ancestrales",
    "categoryLabel": "Ancestrales",
    "duration": 20,
    "durationLabel": "20 min",
    "description": "Las ondas gamma a 40Hz activan la lucidez y la integración neuronal. Combinadas con cuencos de alta frecuencia, esta sesión despierta tu claridad más elevada.",
    "benefits": [
      "Claridad mental",
      "Foco profundo",
      "Integración neuronal",
      "Presencia total"
    ],
    "instruments": [
      "Cuencos de cuarzo soprano",
      "Frecuencias binaurales gamma"
    ],
    "imageKey": "session-10.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": true,
    "status": "published",
    "sortOrder": 7,
    "frequency": "Gamma 40 Hz",
    "ancestralTag": "Cuencos de Cuarzo",
    "sleepTag": "Sonidos Binaurales"
  },
  {
    "id": "20",
    "title": "Sonidos de la Naturaleza",
    "subtitle": "Atmósfera Natural",
    "categoryId": "musica-sonidos",
    "categoryLabel": "Frecuencias",
    "duration": 10,
    "durationLabel": "10 min",
    "description": "Un paisaje sonoro envuelto en el pad cálido de Mi mayor. Cierra los ojos y habita el momento presente.",
    "benefits": [
      "Presencia plena",
      "Alivio de ansiedad",
      "Relajación instantánea",
      "Claridad mental"
    ],
    "instruments": [
      "Pad Mi mayor",
      "Atmósfera natural"
    ],
    "imageKey": "session-20-musica-dark.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": false,
    "status": "published",
    "sortOrder": 8,
    "soundTag": "Sonidos Naturaleza"
  },
  {
    "id": "21",
    "title": "Lluvia de Bosque",
    "subtitle": "Sonidos Naturales",
    "categoryId": "musica-sonidos",
    "categoryLabel": "Frecuencias",
    "duration": 15,
    "durationLabel": "15 min",
    "description": "El sonido suave de la lluvia cayendo sobre hojas de bosque antiguo. Una experiencia sonora que disuelve el ruido mental y devuelve la calma natural.",
    "benefits": [
      "Relajación profunda",
      "Sueño suave",
      "Calma instantánea",
      "Presencia plena"
    ],
    "instruments": [
      "Lluvia",
      "Viento suave",
      "Naturaleza"
    ],
    "imageKey": "session-3-musica-dark.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": false,
    "status": "published",
    "sortOrder": 9,
    "soundTag": "Sonidos Naturaleza"
  },
  {
    "id": "22",
    "title": "Orilla del Mar",
    "subtitle": "Sonidos Naturales",
    "categoryId": "musica-sonidos",
    "categoryLabel": "Frecuencias",
    "duration": 20,
    "durationLabel": "20 min",
    "description": "Las olas llegando y retirándose sobre la arena. Cada ciclo del mar es un recordatorio de que todo pasa y todo vuelve. Suéltate al ritmo del océano.",
    "benefits": [
      "Descanso mental",
      "Reducción del estrés",
      "Ritmo natural",
      "Sueño reparador"
    ],
    "instruments": [
      "Olas del mar",
      "Brisa marina",
      "Naturaleza costera"
    ],
    "imageKey": "session-5-musica-dark.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": false,
    "status": "published",
    "sortOrder": 10,
    "soundTag": "Sonidos Naturaleza"
  },
  {
    "id": "23",
    "title": "Binaural Alpha 8Hz",
    "subtitle": "Ondas Cerebrales",
    "categoryId": "musica-sonidos",
    "categoryLabel": "Frecuencias",
    "duration": 30,
    "durationLabel": "30 min",
    "description": "Frecuencias binaurales en la banda Alpha (8–12 Hz). Ideal para estados de calma alerta, creatividad fluida y reducción de ansiedad. Usar con auriculares.",
    "benefits": [
      "Estado alpha",
      "Creatividad",
      "Calma alerta",
      "Anti-estrés"
    ],
    "instruments": [
      "Frecuencias binaurales alpha",
      "Tono base suave"
    ],
    "imageKey": "session-8-musica-dark.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": true,
    "status": "published",
    "sortOrder": 11,
    "frequency": "Alpha 8–12 Hz",
    "soundTag": "Música Ambient"
  },
  {
    "id": "24",
    "title": "Binaural Theta Nocturno",
    "subtitle": "Ondas Cerebrales",
    "categoryId": "musica-sonidos",
    "categoryLabel": "Frecuencias",
    "duration": 45,
    "durationLabel": "45 min",
    "description": "Frecuencias theta (4–8 Hz) para inducir estados de meditación profunda y sueño lúcido. Una transición suave hacia el descanso más reparador de tu noche.",
    "benefits": [
      "Meditación profunda",
      "Sueño lúcido",
      "Creatividad nocturna",
      "Descanso total"
    ],
    "instruments": [
      "Frecuencias binaurales theta",
      "Ambiente nocturno"
    ],
    "imageKey": "session-9-musica-dark.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": true,
    "status": "published",
    "sortOrder": 12,
    "frequency": "Theta 4–8 Hz",
    "soundTag": "Música Ambient"
  },
  {
    "id": "25",
    "title": "Música Ambient Dorada",
    "subtitle": "Música Meditativa",
    "categoryId": "musica-sonidos",
    "categoryLabel": "Frecuencias",
    "duration": 25,
    "durationLabel": "25 min",
    "description": "Capas de sintetizadores cálidos y cuencos de cuarzo crean una atmósfera dorada perfecta para meditar, leer o simplemente estar presente sin hacer nada.",
    "benefits": [
      "Ambiente meditativo",
      "Foco suave",
      "Presencia sin esfuerzo",
      "Calma creativa"
    ],
    "instruments": [
      "Sintetizadores ambient",
      "Cuencos de cuarzo",
      "Pad armónico"
    ],
    "imageKey": "session-6-musica-dark.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": true,
    "status": "published",
    "sortOrder": 13,
    "soundTag": "Música Ambient",
    "artistId": "lumen-sonora"
  },
  {
    "id": "26",
    "title": "Piano y Cuencos",
    "subtitle": "Música Meditativa",
    "categoryId": "musica-sonidos",
    "categoryLabel": "Frecuencias",
    "duration": 20,
    "durationLabel": "20 min",
    "description": "Notas de piano minimalistas entretejidas con el resonar de cuencos tibetanos. Una composición para abrir el corazón y soltar lo que ya no se necesita llevar.",
    "benefits": [
      "Apertura emocional",
      "Claridad interior",
      "Calma profunda",
      "Bienestar general"
    ],
    "instruments": [
      "Piano acústico",
      "Cuencos tibetanos",
      "Silencio consciente"
    ],
    "imageKey": "session-7-musica-dark.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": true,
    "status": "published",
    "sortOrder": 14,
    "soundTag": "Música Ambient",
    "artistId": "raiz-profunda"
  },
  {
    "id": "28",
    "title": "Prueba 1",
    "subtitle": "Meditación Guiada con Cuencos",
    "categoryId": "meditaciones-guiadas",
    "categoryLabel": "Meditaciones",
    "duration": 10,
    "durationLabel": "10 min",
    "description": "Una meditación guiada con la voz de Casa del Cuenco acompañada de un fondo de cuencos tibetanos. Permítete soltar, respirar y volver a ti.",
    "benefits": [
      "Calma profunda",
      "Presencia plena",
      "Conexión interior",
      "Relajación"
    ],
    "instruments": [
      "Cuencos tibetanos",
      "Voz guiada"
    ],
    "imageKey": "session-28.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": false,
    "status": "published",
    "sortOrder": 15,
    "meditationTag": "Visualizaciones"
  },
  {
    "id": "27",
    "title": "Riachuelo con Pájaros",
    "subtitle": "Sonidos Naturales",
    "categoryId": "musica-sonidos",
    "categoryLabel": "Frecuencias",
    "duration": 10,
    "durationLabel": "10 min",
    "description": "El suave murmullo de un riachuelo de montaña acompañado por el canto de los pájaros. Un refugio sonoro que devuelve a la mente su ritmo natural, disuelve la tensión y abre el corazón a la presencia.",
    "benefits": [
      "Calma instantánea",
      "Conexión con la naturaleza",
      "Reducción del estrés",
      "Presencia plena"
    ],
    "instruments": [
      "Agua corriente",
      "Canto de pájaros",
      "Ambiente natural"
    ],
    "imageKey": "session-27-musica-dark.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": true,
    "status": "published",
    "sortOrder": 16,
    "soundTag": "Sonidos Naturaleza"
  },
  {
    "id": "30",
    "title": "Prueba Maestra 2",
    "subtitle": "Binaural",
    "categoryId": "musica-sonidos",
    "categoryLabel": "Frecuencias",
    "duration": 20,
    "durationLabel": "20 min",
    "description": "Esta es una prueba maestra 2.",
    "benefits": [
      "Energía matutina",
      "Claridad mental",
      "Activación suave",
      "Foco natural"
    ],
    "instruments": [
      "Binaural",
      "Sonido ambiente"
    ],
    "imageKey": "session-20.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": true,
    "status": "published",
    "sortOrder": 17,
    "soundTag": "Música Ambient",
    "themeTag": [
      "Energiza tus mañanas"
    ],
    "sleepTag": "ASMR Expansivos"
  },
  {
    "id": "29",
    "title": "Prueba Maestra 1",
    "subtitle": "Cuencos Tibetanos",
    "categoryId": "sonidos-ancestrales",
    "categoryLabel": "Ancestrales",
    "duration": 20,
    "durationLabel": "20 min",
    "description": "Esta es una prueba maestra.",
    "benefits": [
      "Relajación profunda",
      "Calma interior",
      "Vibración ancestral",
      "Presencia plena"
    ],
    "instruments": [
      "Cuencos Tibetanos"
    ],
    "imageKey": "ancestral-instrumentos.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": false,
    "status": "published",
    "sortOrder": 18,
    "ancestralTag": "Cuencos Tibetanos",
    "themeTag": [
      "Para la ansiedad"
    ],
    "sleepTag": "Sonidos Binaurales"
  },
  {
    "id": "31",
    "title": "Selva Enteógena",
    "subtitle": "Música Enteógena",
    "categoryId": "musica-sonidos",
    "categoryLabel": "Música",
    "duration": 40,
    "durationLabel": "40 min",
    "description": "Una travesía sonora profunda inspirada en rituales amazónicos. Capas de percusión orgánica, drones y texturas enteógenas que disuelven la mente ordinaria y abren portales hacia lo invisible.",
    "benefits": [
      "Expansión de consciencia",
      "Profundidad emocional",
      "Soltar el control",
      "Viaje interior"
    ],
    "instruments": [
      "Percusión ritual",
      "Drones",
      "Sintetizadores orgánicos"
    ],
    "imageKey": "session-9-musica-dark.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": true,
    "status": "published",
    "sortOrder": 19,
    "soundTag": "Música Enteógena",
    "artistId": "lumen-sonora"
  },
  {
    "id": "32",
    "title": "Cacao Ceremonial",
    "subtitle": "Música Enteógena",
    "categoryId": "musica-sonidos",
    "categoryLabel": "Música",
    "duration": 50,
    "durationLabel": "50 min",
    "description": "Composición diseñada para ceremonias de cacao: apertura del corazón, sentir la gratitud y conectar con la tierra. Un viaje musical que acompaña desde la apertura hasta la integración.",
    "benefits": [
      "Apertura del corazón",
      "Gratitud",
      "Conexión con la tierra",
      "Integración"
    ],
    "instruments": [
      "Tambor chamánico",
      "Flautas nativas",
      "Texturas ambientales"
    ],
    "imageKey": "session-2-musica-dark.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": true,
    "status": "published",
    "sortOrder": 20,
    "soundTag": "Música Enteógena",
    "artistId": "raiz-profunda"
  },
  {
    "id": "33",
    "title": "Cuencos del Alba",
    "subtitle": "Música Ancestral",
    "categoryId": "musica-sonidos",
    "categoryLabel": "Música",
    "duration": 30,
    "durationLabel": "30 min",
    "description": "Una composición musical que incorpora cuencos tibetanos, gongs y campanas ancestrales sobre una base ambient. Distinta a la práctica de cuencos: aquí los sonidos ancestrales son el lenguaje de una pieza musical continua.",
    "benefits": [
      "Vibración profunda",
      "Limpieza energética",
      "Presencia plena",
      "Calma duradera"
    ],
    "instruments": [
      "Cuencos tibetanos",
      "Gongs de borde",
      "Campanas tingsha"
    ],
    "imageKey": "session-20-musica-dark.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": true,
    "status": "published",
    "sortOrder": 21,
    "soundTag": "Música Ancestral"
  },
  {
    "id": "34",
    "title": "Didgeridoo y Tambor",
    "subtitle": "Música Ancestral",
    "categoryId": "musica-sonidos",
    "categoryLabel": "Música",
    "duration": 25,
    "durationLabel": "25 min",
    "description": "El resonar del didgeridoo se entrelaza con el pulso del tambor chamánico para crear un campo sonoro primitivo y poderoso. Música que ancla el cuerpo en la tierra y aquieta la mente.",
    "benefits": [
      "Conexión con la tierra",
      "Anclaje corporal",
      "Calma mental",
      "Vibración ancestral"
    ],
    "instruments": [
      "Didgeridoo",
      "Tambor chamánico",
      "Ambiente natural"
    ],
    "imageKey": "session-27-musica-dark.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": true,
    "status": "published",
    "sortOrder": 22,
    "soundTag": "Música Ancestral"
  },
  {
    "id": "35",
    "title": "Delta Profundo",
    "subtitle": "Ondas Cerebrales",
    "categoryId": "podcast",
    "categoryLabel": "Sonidos",
    "duration": 60,
    "durationLabel": "60 min",
    "description": "Frecuencias binaurales en la banda Delta (0.5–4 Hz) para inducir sueño profundo y regeneración celular. Usar con auriculares para la experiencia completa.",
    "benefits": [
      "Sueño profundo",
      "Regeneración celular",
      "Descanso total",
      "Meditación profunda"
    ],
    "instruments": [
      "Frecuencias binaurales delta",
      "Ruido rosa suave"
    ],
    "imageKey": "session-9.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": true,
    "status": "published",
    "sortOrder": 23,
    "sonidosTag": "Sonidos Binaurales"
  },
  {
    "id": "36",
    "title": "Gamma 40Hz — Claridad",
    "subtitle": "Ondas Cerebrales",
    "categoryId": "podcast",
    "categoryLabel": "Sonidos",
    "duration": 30,
    "durationLabel": "30 min",
    "description": "Frecuencias Gamma (40 Hz) asociadas a estados de alta cognición, claridad mental y percepción expandida. Ideal para sesiones de estudio profundo o meditación activa.",
    "benefits": [
      "Claridad mental",
      "Cognición elevada",
      "Foco intenso",
      "Percepción expandida"
    ],
    "instruments": [
      "Frecuencias binaurales gamma",
      "Tono base suave"
    ],
    "imageKey": "session-10.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": true,
    "status": "published",
    "sortOrder": 24,
    "sonidosTag": "Sonidos Binaurales"
  },
  {
    "id": "37",
    "title": "Selva Tropical",
    "subtitle": "Sonidos Naturales",
    "categoryId": "podcast",
    "categoryLabel": "Sonidos",
    "duration": 45,
    "durationLabel": "45 min",
    "description": "La sinfonía viva de una selva tropical en su plenitud: aves exóticas, insectos nocturnos, lluvia suave sobre el dosel verde. Un refugio sonoro para salir del ruido mental.",
    "benefits": [
      "Conexión con la naturaleza",
      "Calma instantánea",
      "Presencia plena",
      "Sueño suave"
    ],
    "instruments": [
      "Aves tropicales",
      "Insectos",
      "Lluvia de selva"
    ],
    "imageKey": "session-1.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": false,
    "status": "published",
    "sortOrder": 25,
    "sonidosTag": "Sonidos Naturaleza"
  },
  {
    "id": "38",
    "title": "Río de Montaña",
    "subtitle": "Sonidos Naturales",
    "categoryId": "podcast",
    "categoryLabel": "Sonidos",
    "duration": 30,
    "durationLabel": "30 min",
    "description": "El fluir constante de un río de montaña limpio y fresco. Cada gorgoteo del agua sobre las piedras ancla la mente al momento presente y disuelve la tensión acumulada.",
    "benefits": [
      "Anclaje al presente",
      "Reducción del estrés",
      "Claridad mental",
      "Relajación natural"
    ],
    "instruments": [
      "Agua corriente",
      "Viento suave",
      "Naturaleza andina"
    ],
    "imageKey": "session-2.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": false,
    "status": "published",
    "sortOrder": 26,
    "sonidosTag": "Sonidos Naturaleza"
  },
  {
    "id": "39",
    "title": "Tormenta Eléctrica",
    "subtitle": "Atmósfera",
    "categoryId": "podcast",
    "categoryLabel": "Sonidos",
    "duration": 50,
    "durationLabel": "50 min",
    "description": "El drama sonoro de una tormenta eléctrica lejana: truenos que reverberan, lluvia intensa y el silencio eléctrico entre relámpagos. Ideal para enfocarse o conciliar el sueño.",
    "benefits": [
      "Concentración profunda",
      "Sueño reparador",
      "Presencia emocional",
      "Calma dramática"
    ],
    "instruments": [
      "Truenos",
      "Lluvia intensa",
      "Viento",
      "Silencio eléctrico"
    ],
    "imageKey": "session-4.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": true,
    "status": "published",
    "sortOrder": 27,
    "sonidosTag": "Sonidos Atmosféricos"
  },
  {
    "id": "40",
    "title": "Espacio Profundo",
    "subtitle": "Atmósfera",
    "categoryId": "podcast",
    "categoryLabel": "Sonidos",
    "duration": 60,
    "durationLabel": "60 min",
    "description": "Drones atmosféricos inspirados en los sonidos captados por la NASA del espacio profundo. Una experiencia de vastedad y silencio que disuelve los límites del yo.",
    "benefits": [
      "Expansión de consciencia",
      "Perspectiva cósmica",
      "Meditación profunda",
      "Silencio interior"
    ],
    "instruments": [
      "Drones espaciales",
      "Texturas electrónicas",
      "Ruido blanco filtrado"
    ],
    "imageKey": "session-5.jpg",
    "isFeatured": false,
    "isNew": true,
    "isPremium": true,
    "status": "published",
    "sortOrder": 28,
    "sonidosTag": "Sonidos Atmosféricos"
  }
];

export const SEED_AUDIO_FILES: InsertCatalogAudioFile[] = [
  {
    "sessionId": "1",
    "role": "main",
    "assetKey": "62 CM.mp3",
    "name": "62 CM.mp3",
    "contentType": "audio/mpeg",
    "isLoop": false
  },
  {
    "sessionId": "2",
    "role": "main",
    "assetKey": "sesion2_pad_mi_mayor.mp3",
    "name": "sesion2_pad_mi_mayor.mp3",
    "contentType": "audio/mpeg",
    "isLoop": false
  },
  {
    "sessionId": "20",
    "role": "main",
    "assetKey": "sesion2_pad_mi_mayor.mp3",
    "name": "sesion2_pad_mi_mayor.mp3",
    "contentType": "audio/mpeg",
    "isLoop": true
  },
  {
    "sessionId": "27",
    "role": "main",
    "assetKey": "riachuelo_stream.mp3",
    "name": "riachuelo_stream.mp3",
    "contentType": "audio/mpeg",
    "isLoop": true
  },
  {
    "sessionId": "27",
    "role": "ambient",
    "assetKey": "pajaros_ambiente.mp3",
    "name": "pajaros_ambiente.mp3",
    "contentType": "audio/mpeg",
    "isLoop": false
  },
  {
    "sessionId": "28",
    "role": "main",
    "assetKey": "sesion_cuencos_mix.mp3",
    "name": "sesion_cuencos_mix.mp3",
    "contentType": "audio/mpeg",
    "isLoop": false
  },
  {
    "sessionId": "28",
    "role": "voice",
    "assetKey": "meditacion_voz_profunda.mp3",
    "name": "meditacion_voz_profunda.mp3",
    "contentType": "audio/mpeg",
    "isLoop": false
  },
  {
    "sessionId": "29",
    "role": "main",
    "assetKey": "prueba1.mp3",
    "name": "prueba1.mp3",
    "contentType": "audio/mpeg",
    "isLoop": false
  },
  {
    "sessionId": "29",
    "role": "voice",
    "assetKey": "voz.mp3",
    "name": "voz.mp3",
    "contentType": "audio/mpeg",
    "isLoop": false
  },
  {
    "sessionId": "30",
    "role": "main",
    "assetKey": "prueba1.mp3",
    "name": "prueba1.mp3",
    "contentType": "audio/mpeg",
    "isLoop": false
  },
  {
    "sessionId": "30",
    "role": "ambient",
    "assetKey": "voz.mp3",
    "name": "voz.mp3",
    "contentType": "audio/mpeg",
    "isLoop": false
  }
];
