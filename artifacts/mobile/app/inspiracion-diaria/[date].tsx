import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Platform, useWindowDimensions } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useInspiration } from "@/hooks/inspiration";
import { InspirationFade } from "@/components/InspirationFade";
import { InspirationArtwork } from "@/components/InspirationArtwork";
import { InspirationNotes } from "@/components/InspirationNotes";
import { InspirationShare } from "@/components/InspirationShare";
import { useColors } from "@/hooks/useColors";
import { formatFullDate } from "@/lib/date-utils";
import { usePlayerBrowse } from "@/context/PlayerContext";
import { getSessionById } from "@/data/sessions";
import { usePremium } from "@/context/PremiumContext";
import { useCatalog } from "@/context/CatalogContext";
import { useAmbientalDuration } from "@/context/AmbientalDurationContext";

function Detail({ date, expectedId }: { date: string; expectedId?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const colors = useColors();
  const { playSession } = usePlayerBrowse();
  const { isPremium, hydrated } = usePremium();
  const { openForSession } = useAmbientalDuration();
  useCatalog(); // React to remotely hydrated audio metadata.
  const { days, week, isFavorite, setFavorite, loading, error, isCached, retry } = useInspiration({ date });
  const day = days.find(d => d.date === date);
  const available = day?.status === "available" && !!day.content && !!day.id && (!expectedId || day.id === expectedId);
  const [viewport, setViewport] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const session = available && day?.content?.sessionId ? getSessionById(day.content.sessionId) : undefined;
  const favorite = !!day?.id && isFavorite(day.id);
  const close = () => router.canGoBack() ? router.back() : router.replace({ pathname: "/inspiracion-diaria", params: { date } });
  const toggleFavorite = async () => {
    if (!available || !day?.id || savingFavorite) return;
    setSavingFavorite(true); setActionError(null);
    try { await setFavorite(day.id, !favorite); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : "No se pudo guardar el favorito."); }
    finally { setSavingFavorite(false); }
  };
  const play = () => {
    if (!session || !hydrated) return;
    if (session.isPremium && !isPremium) { router.push("/membresia"); return; }
    if (session.isPlaceholder) { setActionError("Este audio aún no está disponible."); return; }
    if (openForSession(session)) return;
    playSession(session);
    router.push("/player");
  };
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    {available && day?.content && <InspirationArtwork key={day.content.imageUrl} content={day.content} />}
    <View style={[styles.header, { paddingTop: (Platform.OS === "web" ? 67 : Math.max(insets.top, 40)) + 8, backgroundColor: available ? "rgba(10,16,19,.65)" : colors.background }]}>
      <Pressable onPress={close} style={styles.icon} accessibilityLabel="Volver" testID="inspiration-detail-back"><Feather name="chevron-left" size={28} color={colors.foreground} /></Pressable>
      <Text numberOfLines={2} style={{ flex: 1, textAlign: "center", color: colors.foreground, fontSize: 14 }}>{week?.settings.sectionTitle || "Inspiración diaria"}</Text>
      {available ? <>
        <Pressable disabled={savingFavorite} onPress={() => void toggleFavorite()} style={styles.icon} accessibilityLabel={favorite ? "Quitar de favoritos" : "Guardar en favoritos"} testID="inspiration-favorite-btn">
          <MaterialCommunityIcons name={favorite ? "heart" : "heart-outline"} size={24} color={favorite ? "#dc7373" : colors.foreground} />
        </Pressable>
        <Pressable onPress={() => setSharing(true)} style={styles.icon} accessibilityLabel="Compartir imagen" testID="inspiration-share-btn"><Feather name="share-2" size={22} color={colors.foreground} /></Pressable>
      </> : <View style={styles.icon} />}
    </View>
    <ScrollView key={date} keyboardShouldPersistTaps="handled" onScroll={event => setViewport(event.nativeEvent.contentOffset.y)} scrollEventThrottle={64} contentContainerStyle={{ paddingBottom: insets.bottom + 50 }}>
      {(error || isCached) && <View style={{ padding: 16, backgroundColor: colors.card }}>
        <Text style={{ color: colors.foreground }}>{error || "Mostrando copia guardada; actualizando…"}</Text>
        {error && <Pressable onPress={() => void retry()} style={{ paddingTop: 10 }}><Text style={{ color: colors.primary }}>Reintentar</Text></Pressable>}
      </View>}
      {actionError && <Text accessibilityRole="alert" style={{ color: "#d87272", padding: 16 }}>{actionError}</Text>}
      {loading ? <View style={styles.empty}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.foreground }}>Cargando inspiración…</Text></View> :
        available && day?.content ? <>
          <View style={{ minHeight: Math.max(350, height * .6), justifyContent: "flex-end", padding: 24, paddingTop: 100 }}>
            <InspirationFade replayKey={date} delay={0}><Text style={styles.date}>{formatFullDate(day.date).toUpperCase()}</Text></InspirationFade>
            <InspirationFade replayKey={date} delay={100}>
              <Text style={styles.quote}>{day.content.quote}</Text>
              {!!day.content.author && <Text style={styles.author}>— {day.content.author}</Text>}
            </InspirationFade>
          </View>
          <View style={[styles.body, { backgroundColor: "rgba(6,10,15,.72)" }]}>
            <InspirationFade replayKey={date} viewportTick={viewport} delay={100}>
              <Text selectable style={{ fontFamily: "Manrope", fontSize: 18, lineHeight: 30, color: colors.foreground }}>{day.content.reflection}</Text>
            </InspirationFade>
            {!!day.content.sessionId && <InspirationFade replayKey={date} viewportTick={viewport} delay={180}>
              <View style={{ paddingTop: 36, gap: 16 }}>
                <Text style={{ color: colors.foreground, fontSize: 21, fontWeight: "600" }}>{week?.settings.discoverMoreLabel || "Descubre más"}</Text>
                {session ? <Pressable onPress={play} disabled={!hydrated} style={[styles.audio, { backgroundColor: colors.card }]} accessibilityLabel={`Reproducir ${session.title}, ${session.durationLabel}${session.isPremium ? ", Premium" : ""}`}>
                  <Image source={session.image} style={{ width: 62, height: 62, borderRadius: 12 }} contentFit="cover" />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>{session.title}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{session.durationLabel} · {session.isPremium ? "Premium" : "Gratis"}</Text>
                  </View>
                  <Feather name={session.isPremium && !isPremium ? "lock" : "play"} size={22} color={colors.foreground} />
                </Pressable> : <Text style={{ color: colors.mutedForeground }}>El audio relacionado ya no está disponible.</Text>}
              </View>
            </InspirationFade>}
            <InspirationFade replayKey={date} viewportTick={viewport} delay={240}>
              <InspirationNotes inspirationId={day.id!} notesLabel={week?.settings.notesLabel} />
            </InspirationFade>
          </View>
        </> : <View style={styles.body}>
          <View style={styles.empty}><Feather name={day?.status === "future" ? "lock" : "calendar"} size={40} color={colors.mutedForeground} />
            <Text style={{ color: colors.foreground, fontSize: 20, textAlign: "center" }}>{day?.status === "future" ? "Disponible pronto" : error ? "No se pudo consultar esta inspiración" : "Esta inspiración no está disponible"}</Text>
            <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>Tus notas privadas siguen disponibles en Mis notas.</Text>
            <Pressable onPress={() => router.push("/inspiracion-diaria/notas")}><Text style={{ color: colors.primary }}>Mis notas</Text></Pressable>
          </View>
          {expectedId && <InspirationNotes inspirationId={expectedId} />}
        </View>}
    </ScrollView>
    {sharing && available && day && <InspirationShare day={day} onClose={() => setSharing(false)} />}
  </KeyboardAvoidingView>;
}
export default function InspiracionDiariaDetail() {
  const { date, id } = useLocalSearchParams<{ date: string; id?: string }>();
  return <Detail key={`${date}-${id || ""}`} date={date} expectedId={id} />;
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingBottom: 8 },
  icon: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  date: { fontFamily: "Manrope", fontSize: 12, letterSpacing: 1.2, color: "#eee", marginBottom: 14 },
  quote: { fontFamily: "Manrope", fontSize: 28, lineHeight: 39, color: "#fff", fontWeight: "500" },
  author: { color: "#eee", fontSize: 16, marginTop: 16, fontStyle: "italic" },
  body: { padding: 24 }, empty: { minHeight: 260, padding: 24, alignItems: "center", justifyContent: "center", gap: 18 },
  audio: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 16 },
});