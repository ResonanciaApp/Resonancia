import type { CatalogSession } from "@workspace/api-client-react";

import type { Session } from "@/data/sessions";

function resolveSafeMediaUri(
  value: string | null | undefined,
  resolveMediaUri: (value: string | null | undefined) => string | undefined,
): string | undefined {
  if (!value || value.startsWith("bundle:")) return undefined;
  return resolveMediaUri(value);
}

export function normalizeFeaturedMomentSessionData(
  remote: CatalogSession,
  local: Session | undefined,
  fallbackImage: Session["image"],
  resolveMediaUri: (value: string | null | undefined) => string | undefined,
): Session {
  const matchingLocal = local?.categoryId === remote.categoryId ? local : undefined;
  const mainAudio =
    remote.audioFiles.find((audio) => audio.role === "main" || audio.role === "base") ??
    remote.audioFiles[0];
  const voiceAudio = remote.audioFiles.find((audio) => audio.role === "voice");
  const remoteImage = resolveSafeMediaUri(remote.imageUrl, resolveMediaUri);
  const image =
    matchingLocal?.image ??
    (remoteImage ? { uri: remoteImage } : fallbackImage);

  return {
    id: remote.id,
    title: remote.title,
    subtitle: remote.subtitle,
    categoryId: remote.categoryId,
    categoryLabel: remote.categoryLabel,
    duration: remote.duration,
    durationLabel: remote.durationLabel,
    description: remote.description,
    benefits: remote.benefits,
    instruments: remote.instruments,
    image,
    audio: matchingLocal?.audio,
    isFeatured: remote.isFeatured,
    isFeaturedCategory: remote.isFeaturedCategory,
    isFeaturedSleep: remote.isFeaturedSleep,
    isNew: remote.isNew,
    isPremium: remote.isPremium,
    isPlaceholder: remote.isPlaceholder,
    skipDetail: remote.skipDetail ?? matchingLocal?.skipDetail,
    skipMiniPlayer: remote.skipMiniPlayer ?? matchingLocal?.skipMiniPlayer,
    isLoop: remote.isLoop ?? matchingLocal?.isLoop,
    frequency: remote.frequency ?? undefined,
    soundTag: remote.soundTag ? (remote.soundTag as Session["soundTag"]) : undefined,
    meditationTag: remote.meditationTag
      ? (remote.meditationTag as Session["meditationTag"])
      : undefined,
    ancestralTag: remote.ancestralTag
      ? (remote.ancestralTag as Session["ancestralTag"])
      : undefined,
    sabiduriaTag: remote.sabiduriaTag
      ? (remote.sabiduriaTag as Session["sabiduriaTag"])
      : undefined,
    podcastTag: remote.podcastTag ? (remote.podcastTag as Session["podcastTag"]) : undefined,
    sonidosTag: remote.sonidosTag ? (remote.sonidosTag as Session["sonidosTag"]) : undefined,
    sonidosTags: remote.sonidosTags as Session["sonidosTags"],
    descansoTags: remote.descansoTags as Session["descansoTags"],
    themeTag: remote.themeTag?.filter((tag) => !/chakra/i.test(tag)) as Session["themeTag"],
    temaTag: remote.temaTag ?? undefined,
    moodIds: remote.moodIds,
    sleepTag: remote.sleepTag ? (remote.sleepTag as Session["sleepTag"]) : undefined,
    voiceTag: remote.voiceTag,
    guideId: remote.guideId ?? undefined,
    guideIds: remote.guideIds,
    artistId: remote.artistId ?? undefined,
    guests: remote.guests?.map((guest) => ({
      name: guest.name,
      role: guest.role,
      instagram: guest.instagram ?? undefined,
    })),
    playerDescription: remote.playerDescription ?? undefined,
    audioUri: mainAudio?.assetKey?.startsWith("bundle:")
      ? undefined
      : resolveSafeMediaUri(mainAudio?.url, resolveMediaUri),
    voiceUri: voiceAudio?.assetKey?.startsWith("bundle:")
      ? undefined
      : resolveSafeMediaUri(voiceAudio?.url, resolveMediaUri),
  };
}

export function isFeaturedMomentResponseNewerThanCatalog(input: {
  catalogStatus: "bundled" | "cached" | "remote";
  featuredResponseIsFresh: boolean;
  featuredResponseFetchedAt: number;
  catalogSnapshotFetchedAt: number;
}): boolean {
  const {
    catalogStatus,
    featuredResponseIsFresh,
    featuredResponseFetchedAt,
    catalogSnapshotFetchedAt,
  } = input;
  return featuredResponseIsFresh &&
    (catalogStatus !== "remote" ||
      featuredResponseFetchedAt > catalogSnapshotFetchedAt);
}

export function isFeaturedMomentCatalogCompatible(input: {
  sessionId: string;
  catalogStatus: "bundled" | "cached" | "remote";
  catalogSessionIds: ReadonlySet<string> | null;
  localSessionIsEligible: boolean;
  featuredResponseIsFresh: boolean;
  featuredResponseFetchedAt: number;
  catalogSnapshotFetchedAt: number;
}): boolean {
  const {
    sessionId,
    catalogStatus,
    catalogSessionIds,
    localSessionIsEligible,
    featuredResponseIsFresh,
    featuredResponseFetchedAt,
    catalogSnapshotFetchedAt,
  } = input;
  const featuredIsNewer = isFeaturedMomentResponseNewerThanCatalog(input);
  if (featuredIsNewer) return true;
  if (catalogStatus === "bundled") return localSessionIsEligible;
  return !!catalogSessionIds?.has(sessionId) && localSessionIsEligible;
}