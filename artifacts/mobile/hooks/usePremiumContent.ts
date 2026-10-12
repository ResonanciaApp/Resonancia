import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { getGetPremiumContentQueryKey, useGetPremiumContent, type PremiumContentSettings } from "@workspace/api-client-react";

const KEY = "@resonancia/premium-content-v1";
const images = Array.from({ length: 10 }, (_, i) => `builtin:${i}`);
const description = "Comienza tu camino hacia el bienestar con más de 500 meditaciones y sonidos relajantes.";
export const INITIAL_PREMIUM_CONTENT: PremiumContentSettings = {
  revision: 0,
  content: {
    sounds: { title: "Suscríbete al Plan Premium", description: "Accede a una librería de más de 300 sonidos ambientales de Chile y el mundo", images: [] },
    sleep: { title: "¿Problemas para dormir?", description, images },
    home: { title: "Prueba Premium Gratis", description, images },
    profile: { title: "Prueba Premium", description: "Tu transformación comienza acá", images: [] },
  },
};
export function isPremiumContent(value: unknown): value is PremiumContentSettings {
  const data = value as PremiumContentSettings | undefined;
  return !!data && Number.isInteger(data.revision) && data.revision >= 0 &&
    ["sounds", "sleep", "home", "profile"].every(key => {
      const section = data.content?.[key as keyof typeof data.content];
      return section && typeof section.title === "string" && !!section.title.trim() &&
        typeof section.description === "string" && Array.isArray(section.images) &&
        section.images.every(p => typeof p === "string" && (/^builtin:[0-9]$/.test(p) || p.startsWith("/objects/")));
    });
}
export function usePremiumContent() {
  const [cached, setCached] = useState<PremiumContentSettings | null>(null);
  const query = useGetPremiumContent({ query: {
    queryKey: getGetPremiumContentQueryKey(),
    staleTime: 15_000, refetchOnMount: true, refetchOnWindowFocus: true,
    refetchInterval: 30_000, retry: 1,
  } });
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(KEY).then(raw => {
      if (!raw || !active) return;
      try { const value = JSON.parse(raw); if (isPremiumContent(value)) setCached(old => !old || old.revision < value.revision ? value : old); } catch {}
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!isPremiumContent(query.data)) return;
    setCached(query.data);
    void AsyncStorage.setItem(KEY, JSON.stringify(query.data)).catch(() => {});
  }, [query.data]);
  return isPremiumContent(query.data) ? query.data : cached ?? INITIAL_PREMIUM_CONTENT;
}
