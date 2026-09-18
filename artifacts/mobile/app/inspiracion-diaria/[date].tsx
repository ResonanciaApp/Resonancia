import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useInspiration } from "@/hooks/inspiration";
import { InspirationArtwork } from "@/components/InspirationArtwork";
import { InspirationShare } from "@/components/InspirationShare";
import { useColors } from "@/hooks/useColors";
import { parseISO } from "@/lib/date-utils";
import { usePlayerBrowse } from "@/context/PlayerContext";
import { getSessionById } from "@/data/sessions";
import { usePremium } from "@/context/PremiumContext";
import { useCatalog } from "@/context/CatalogContext";
import { useAmbientalDuration } from "@/context/AmbientalDurationContext";

function dateParts(date: string) {
  const value = parseISO(date);
  return {
    day: new Intl.DateTimeFormat("es", { day: "numeric" }).format(value),
    monthYear: new Intl.DateTimeFormat("es", { month: "short", year: "numeric" })
      .format(value)
      .replace(".", ""),
  };
}

function Detail({ date, expectedId }: { date: string; expectedId?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const colors = useColors();
  const { playSession } = usePlayerBrowse();
  const { isPremium, hydrated } = usePremium();
  const { openForSession } = useAmbientalDuration();
  useCatalog();
  const { days, week, loading, error, retry } = useInspiration({ date });
  const day = days.find((candidate) => candidate.date === date);
  const available = day?.status === "available" && !!day.content && !!day.id && (!expectedId || day.id === expectedId);
  const [sharing, setSharing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const session = available && day?.content?.sessionId ? getSessionById(day.content.sessionId) : undefined;
  const formatted = dateParts(date);
  const topInset = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const close = () => router.canGoBack()
    ? router.back()
    : router.replace({ pathname: "/inspiracion-diaria", params: { date } });

  const editNote = () => {
    if (!day?.id) return;
    router.push({
      pathname: "/inspiracion-diaria/notas",
      params: { inspirationId: day.id, date: day.date },
    });
  };

  const play = () => {
    if (!session || !hydrated) return;
    if (session.isPremium && !isPremium) {
      router.push("/membresia");
      return;
    }
    if (session.isPlaceholder) {
      setActionError("Este audio aún no está disponible.");
      return;
    }
    if (openForSession(session)) return;
    playSession(session);
    router.push("/player");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {available && day?.content && (
        <>
          <InspirationArtwork
            key={`${day.content.imageUrl}-${day.content.overlayOpacity}`}
            content={day.content}
          />
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(3,5,9,.12)", "rgba(3,5,9,.35)", "rgba(3,5,9,.82)"]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />
        </>
      )}

      <View style={[styles.controls, { top: topInset + 8 }]}>
        <Pressable
          onPress={close}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          testID="inspiration-detail-back"
        >
          <Feather name="x" size={30} color="#fff" />
        </Pressable>
        {available && (
          <View style={styles.controlGroup}>
            <Pressable
              onPress={editNote}
              style={styles.groupButton}
              accessibilityRole="button"
              accessibilityLabel="Editar nota"
            >
              <Feather name="edit-3" size={22} color="#fff" />
            </Pressable>
            <View style={styles.groupDivider} />
            <Pressable
              onPress={() => setSharing(true)}
              style={styles.groupButton}
              accessibilityRole="button"
              accessibilityLabel="Compartir inspiración"
              testID="inspiration-share-btn"
            >
              <Feather name="share" size={22} color="#fff" />
            </Pressable>
          </View>
        )}
      </View>

      <ScrollView
        key={date}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            minHeight: height,
            paddingTop: topInset + 117,
            paddingBottom: Math.max(insets.bottom, 18) + 48,
          },
        ]}
      >
        {!!error && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{error}</Text>
            <Pressable onPress={() => void retry()}>
              <Text style={styles.retry}>Reintentar</Text>
            </Pressable>
          </View>
        )}
        {!!actionError && <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text>}

        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.emptyText}>Cargando inspiración…</Text>
          </View>
        ) : available && day?.content ? (
          <>
            <View style={styles.dateBlock}>
              <Text style={styles.day}>{formatted.day}</Text>
              <Text style={styles.monthYear}>{formatted.monthYear}</Text>
            </View>

            <Text style={styles.quote}>{day.content.quote}</Text>
            {!!day.content.author && <Text style={styles.author}>— {day.content.author}</Text>}
            <Text selectable style={styles.reflection}>{day.content.reflection}</Text>

            {!!day.content.sessionId && (
              <View style={styles.related}>
                <View style={styles.separator} />
                <Text style={styles.relatedTitle}>Reflexión de apoyo</Text>

                {session ? (
                  <Pressable
                    onPress={play}
                    disabled={!hydrated}
                    style={styles.audioCard}
                    accessibilityLabel={`Reproducir ${session.title}, ${session.durationLabel}${session.isPremium ? ", Premium" : ""}`}
                  >
                    {Platform.OS !== "web" ? (
                      <BlurView
                        intensity={22}
                        tint="dark"
                        experimentalBlurMethod="dimezisBlurView"
                        style={StyleSheet.absoluteFillObject}
                      />
                    ) : (
                      <View style={[StyleSheet.absoluteFillObject, styles.audioCardWebGlass]} />
                    )}
                    <View style={styles.audioThumb}>
                      <Image source={session.image} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                      <View style={styles.playBadge}>
                        <Feather
                          name={session.isPremium && !isPremium ? "lock" : "play"}
                          size={17}
                          color="#fff"
                        />
                      </View>
                    </View>
                    <View style={styles.audioCopy}>
                      <Text numberOfLines={2} style={styles.audioTitle}>{session.title}</Text>
                      <Text style={styles.audioDuration}>{session.durationLabel}</Text>
                    </View>
                  </Pressable>
                ) : (
                  <Text style={styles.unavailableAudio}>El audio relacionado ya no está disponible.</Text>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={styles.empty}>
            <Feather name={day?.status === "future" ? "lock" : "calendar"} size={38} color="rgba(255,255,255,.72)" />
            <Text style={styles.emptyText}>
              {day?.status === "future"
                ? "Disponible pronto"
                : error
                  ? "No se pudo consultar esta inspiración"
                  : "Esta inspiración no está disponible"}
            </Text>
          </View>
        )}
      </ScrollView>

      {sharing && available && day && <InspirationShare day={day} onClose={() => setSharing(false)} />}
    </View>
  );
}

export default function InspiracionDiariaDetail() {
  const { date, id } = useLocalSearchParams<{ date: string; id?: string }>();
  return <Detail key={`${date}-${id || ""}`} date={date} expectedId={id} />;
}

const serif = Platform.select({
  ios: "Georgia",
  android: "serif",
  web: "Georgia, serif",
  default: "serif",
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  controls: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.14)",
    backgroundColor: "rgba(6,8,13,.3)",
  },
  controlGroup: {
    height: 52,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.14)",
    backgroundColor: "rgba(6,8,13,.3)",
    overflow: "hidden",
  },
  groupButton: { width: 54, height: 52, alignItems: "center", justifyContent: "center" },
  groupDivider: { width: StyleSheet.hairlineWidth, height: 24, backgroundColor: "rgba(255,255,255,.18)" },
  scrollContent: { paddingHorizontal: 28 },
  notice: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    padding: 9,
    borderRadius: 12,
    backgroundColor: "rgba(4,8,13,.72)",
    marginBottom: 18,
  },
  noticeText: { color: "rgba(255,255,255,.82)", fontFamily: "Manrope", fontSize: 12 },
  retry: { color: "#fff", fontFamily: "Manrope", fontSize: 12, fontWeight: "700" },
  error: { color: "#ffaaaa", marginBottom: 16, fontFamily: "Manrope" },
  dateBlock: { alignItems: "center", marginBottom: 34 },
  day: { color: "#fff", fontFamily: "Manrope", fontSize: 33, lineHeight: 38, fontWeight: "500" },
  monthYear: { color: "rgba(255,255,255,.88)", fontFamily: "Manrope", fontSize: 13, marginTop: 2 },
  quote: {
    color: "#fff",
    fontFamily: "Manrope",
    fontSize: 21,
    lineHeight: 30,
    textAlign: "center",
    fontWeight: "500",
  },
  author: {
    color: "rgba(255,255,255,.82)",
    fontFamily: serif,
    fontSize: 15,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 12,
  },
  reflection: {
    color: "rgba(255,255,255,.94)",
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 44,
  },
  related: { marginTop: 32 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,.26)", marginBottom: 24 },
  relatedTitle: { color: "#fff", fontFamily: "Manrope", fontSize: 21, lineHeight: 27, fontWeight: "700", marginBottom: 20 },
  audioCard: {
    minHeight: 72,
    padding: 10,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,.14)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,.28)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  audioCardWebGlass: { backgroundColor: "rgba(255,255,255,.14)" },
  audioThumb: { width: 52, height: 52, borderRadius: 8, overflow: "hidden", backgroundColor: "#171B22" },
  playBadge: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5,8,13,.34)",
  },
  audioCopy: { flex: 1, gap: 5 },
  audioTitle: { color: "#F9F9F9", fontFamily: "Manrope", fontSize: 15, lineHeight: 20, fontWeight: "700" },
  audioDuration: { color: "#F9F9F9", fontFamily: "Manrope", fontSize: 12 },
  unavailableAudio: { color: "rgba(255,255,255,.72)", fontFamily: "Manrope", fontSize: 14 },
  empty: { minHeight: 420, alignItems: "center", justifyContent: "center", gap: 16 },
  emptyText: { color: "#fff", fontFamily: "Manrope", fontSize: 18, textAlign: "center" },
});