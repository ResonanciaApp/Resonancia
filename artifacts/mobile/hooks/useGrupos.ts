import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "resonancia:grupos_creados";

export interface GrupoLocal {
  id: string;
  nombre: string;
  descripcion: string;
  privado: boolean;
  imageIdx: number | null;
  bienvenida: string;
  inviteCode: string;
  creadoEn: number;
}

const WELCOME =
  "Bienvenidx a este círculo de RESONANCIA 🙏  Acá compartimos desde el corazón, sin máscaras ni juicios. Cada voz suma, cada experiencia enseña. Que sea un espacio donde encontremos eco y resonancia.";

// Grupos oficiales creados por el admin de la app. Se siembran automáticamente
// la primera vez que el usuario abre Grupos y persisten en AsyncStorage para
// permitir comentarios/publicaciones reales.
export const ADMIN_GRUPOS: GrupoLocal[] = [
  {
    id: "admin-1",
    nombre: "Comparto mi despertar",
    descripcion:
      "Un espacio para narrar el momento en que algo dentro tuyo cambió.\nQuizás fue una meditación, un sueño, una pérdida o un amanecer.\nAcá compartimos sin pretensiones — solo lo que despertó y lo que sigue despertando.\nTu historia puede ser la chispa que otra persona necesita escuchar.",
    privado: false,
    imageIdx: 2,
    bienvenida: WELCOME,
    inviteCode: "DESPERTAR",
    creadoEn: 0,
  },
  {
    id: "admin-2",
    nombre: "Experiencias profundas",
    descripcion:
      "Hay vivencias que no entran en palabras fáciles, pero igual buscan ser nombradas.\nVisiones, sincronicidades, silencios que enseñaron, presencias que acompañaron.\nEste es el círculo para lo inexplicable, lo sutil, lo transformador.\nAcá nadie juzga lo que se cuenta — solo se sostiene con respeto.",
    privado: false,
    imageIdx: 6,
    bienvenida: WELCOME,
    inviteCode: "PROFUNDO",
    creadoEn: 0,
  },
  {
    id: "admin-3",
    nombre: "El mundo de la Sonoterapia",
    descripcion:
      "Cuencos, voz, gongs, frecuencias y todo lo que vibra con propósito.\nCompartimos prácticas, descubrimientos, dudas y aprendizajes del oficio sonoro.\nTanto si recién empezás como si ya facilitás sesiones, hay lugar para vos.\nEl sonido sana cuando lo escuchamos en comunidad.",
    privado: false,
    imageIdx: 10,
    bienvenida: WELCOME,
    inviteCode: "SONIDO",
    creadoEn: 0,
  },
  {
    id: "admin-4",
    nombre: "Meditación y Autodescubrimiento",
    descripcion:
      "Sentarse a observar la propia mente es uno de los actos más valientes.\nEn este grupo intercambiamos técnicas, obstáculos y revelaciones del camino interior.\nNo hay un método correcto — hay tantos como personas que se animan a mirar adentro.\nBienvenidx a este laboratorio compartido de presencia.",
    privado: false,
    imageIdx: 14,
    bienvenida: WELCOME,
    inviteCode: "ADENTRO",
    creadoEn: 0,
  },
  {
    id: "admin-5",
    nombre: "Cómo terminar con el sufrimiento",
    descripcion:
      "El sufrimiento no se elimina con frases bonitas, pero sí se puede transformar.\nAcá exploramos juntos qué nos sostiene cuando la mente se ata al dolor.\nHablamos de aceptación, desapego, terapias, prácticas y herramientas que funcionan.\nQue nadie atraviese su noche oscura sin compañía.",
    privado: false,
    imageIdx: 19,
    bienvenida: WELCOME,
    inviteCode: "LIBERTAD",
    creadoEn: 0,
  },
];

const ADMIN_IDS = new Set(ADMIN_GRUPOS.map((g) => g.id));

export function useGrupos() {
  const [grupos, setGrupos] = useState<GrupoLocal[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const existing: GrupoLocal[] = raw ? (JSON.parse(raw) as GrupoLocal[]) : [];

      // Asegurar que los grupos admin oficiales siempre existan. Si falta
      // alguno, lo agregamos al final (sin reordenar los del usuario).
      const presentIds = new Set(existing.map((g) => g.id));
      const missingAdmins = ADMIN_GRUPOS.filter((g) => !presentIds.has(g.id));

      if (missingAdmins.length > 0) {
        const merged = [...existing, ...missingAdmins];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        setGrupos(merged);
      } else {
        setGrupos(existing);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveGrupo = useCallback(async (grupo: GrupoLocal) => {
    setGrupos((prev) => {
      const next = [grupo, ...prev.filter((g) => g.id !== grupo.id)];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const deleteGrupo = useCallback(async (id: string) => {
    setGrupos((prev) => {
      const next = prev.filter((g) => g.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return { grupos, loading, reload, saveGrupo, deleteGrupo };
}

export function isAdminGrupo(id: string): boolean {
  return ADMIN_IDS.has(id);
}
