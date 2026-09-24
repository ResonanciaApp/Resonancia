import { AppState } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useGetEffectiveHero } from "@workspace/api-client-react";
import type { EffectiveHero } from "@workspace/api-client-react";
import { useInspiration } from "@/hooks/inspiration";

export type HeroMedia =
  | { kind: "image"; uri: string | number }
  | { kind: "video"; uri: string };

export function absoluteMediaUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_DOMAIN || "";
  const origin = /^https?:\/\//i.test(base) ? base : base ? `https://${base}` : "";
  const servingPath = path.startsWith("/objects/")
    ? path.replace(/^\/objects\//, "/api/storage/objects/")
    : `/${path.replace(/^\/+/, "")}`;
  return `${origin.replace(/\/+$/, "")}${servingPath}`;
}

export function resolveEffectiveHeroSource(
  hero: EffectiveHero | undefined,
  inspirationImageUrl: string | null | undefined,
  fallbackImage: string | number,
): HeroMedia {
  const media = hero?.source === "override" ? hero.media : null;
  if (media && media.objectPath && hero) {
    return { kind: media.type, uri: absoluteMediaUrl(media.objectPath) };
  }
  if (hero?.source === "inspiration" && inspirationImageUrl) {
    return { kind: "image", uri: absoluteMediaUrl(inspirationImageUrl) };
  }
  if (hero?.fallbackImageUrl) {
    return { kind: "image", uri: absoluteMediaUrl(hero.fallbackImageUrl) };
  }
  if (inspirationImageUrl) {
    return { kind: "image", uri: absoluteMediaUrl(inspirationImageUrl) };
  }
  return { kind: "image", uri: fallbackImage };
}

export function useEffectiveHero(fallbackImage: string | number, enabled = true) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [now, setNow] = useState(() => new Date());
  const today = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now);
    } catch {
      return now.toISOString().slice(0, 10);
    }
  }, [now, timezone]);
  const inspiration = useInspiration({ date: today, timezone });
  const query = useGetEffectiveHero(
    { timeZone: timezone },
    {
      query: {
        queryKey: ["effective-hero", timezone, today],
        enabled,
        staleTime: 60_000,
        gcTime: 300_000,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
      },
    },
  );

  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = setInterval(tick, 30_000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        tick();
        void query.refetch();
      }
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [query.refetch]);

  const inspirationDay = inspiration.days.find((day) => day.date === inspiration.today);
  const inspirationImage = inspirationDay?.content?.imageUrl;
  const resolved = resolveEffectiveHeroSource(query.data, inspirationImage, fallbackImage);
  const fallbackImageUrl = query.data?.fallbackImageUrl || inspirationImage;
  return {
    ...resolved,
    loading: query.isLoading && !inspirationImage,
    error: query.error ?? inspiration.error,
    title: inspirationDay?.content?.quote,
    overlayOpacity: inspirationDay?.content?.overlayOpacity ?? 0,
    fallbackImage: fallbackImageUrl ? absoluteMediaUrl(fallbackImageUrl) : fallbackImage,
  };
}