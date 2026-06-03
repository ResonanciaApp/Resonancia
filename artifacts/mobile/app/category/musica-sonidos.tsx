import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ArtistCard } from "@/components/ArtistCard";
import { CategoryInfoPanel } from "@/components/CategoryInfoPanel";
import { PremiumBadge } from "@/components/PremiumBadge";
import { getNatureSounds } from "@/config/nature-base-map";
import { hasSoundFile } from "@/data/sounds";
import { getFeaturedArtists } from "@/data/artists";
import { useMixer } from "@/context/MixerContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { SESSIONS, type Session, type SoundTag } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const H_PAD = 20;
const GAP = 10;
const COLS = 3;
const CARD_WIDTH = (width - H_PAD * 2 - GAP * (COLS - 1)) / COLS;
const IMG_SIZE = CARD_WIDTH - 10;

type Tab = "Todos" | SoundTag;

const TABS: Tab[] = ["Todos", "Sonidos Naturaleza", "Música Ambient", "Música Enteógena"];

/** Timer del sonido. 5/10/20 min gratis; el resto (incluido "Sin límite") es premium. */
const TIMER_OPTIONS: { minutes: number | null; label: string; free: boolean }[] = [
  { minutes: 5, label: "5 min", free: true },
  { minutes: 10, label: "10 min", free: true },
  { minutes: 20, label: "20 min", free: true },
  { minutes: 30, label: "30 min", free: false },
  { minutes: 40, label: "40 min", free: false },
  { minutes: 60, label: "1 h", free: false },
  { minutes: null, label: "Sin límite", free: false },
];

const TAG_COLORS: Record<SoundTag, { bg: string; text: string }> = {
  "Sonidos Naturaleza": { bg: "rgba(255,255,255,0.1)", text: "rgba(255,255,255,0.65)" },
  "Música Ambient": { bg: "rgba(255,255,255,0.1)", text: "rgba(255,255,255,0.65)" },
  "Música Enteógena": { bg: "rgba(182,149,95,0.18)", text: "rgba(230,195,120,0.9)" },
};

const TAG_ICONS: Record<SoundTag, React.ComponentProps<typeof Feather>["name"]> = {
  "Sonidos Naturaleza": "wind",
  "Música Ambient": "music",
  "Música Enteógena": "zap",
};

const TAG_BADGE_LABELS: Record<SoundTag, string> = {
  "Sonidos Naturaleza": "Natural",
  "Música Ambient": "Ambient",
  "Música Enteógena": "Enteógena",
};

const MUSICA_SESSIONS = SESSIONS.filter((s) => s.categoryId === "musica-sonidos");

export default function MusicaSonidosScreen() {
  const colors = useColors();
  const { isPremium } = usePremium();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite, playSession } = usePlayer();
  const { stopAll, toggleSound, setSleepTimer } = useMixer();

  const featuredArtists = getFeaturedArtists();

  const [activeTab, setActiveTab] = useState<Tab>("Todos");
  const [pendingSession, setPendingSession] = useState<Session | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = useMemo(() => {
    let list = MUSICA_SESSIONS;
    if (activeTab !== "Todos") {
      list = list.filter((s) => s.soundTag === activeTab);
    }
    return list;
  }, [activeTab]);

  const handleSelectTimer = (opt: (typeof TIMER_OPTIONS)[number]) => {
    if (!pendingSession) return;
    // Gating premium: solo 5/10/20 min son gratis.
    if (!opt.free && !isPremium) {
      setPendingSession(null);
      stopAll();
      router.push("/membresia" as never);
      return;
    }
    const session = pendingSession;
    setPendingSession(null);
    const nature = getNatureSounds(session.id);
    const base = nature?.base;
    // Sin sonido base válido (mapeado y con archivo) no hay nada que reproducir:
    // limpiar y abortar para no entrar a la inmersiva heredando una mezcla vieja.
    if (!base || !hasSoundFile(base)) {
      stopAll();
      return;
    }
    // El ambiente viene precargado en la sesión: se pasa a la inmersiva para
    // que lo cargue como segunda capa (el usuario solo regula su volumen).
    const ambient =
      nature?.ambient && hasSoundFile(nature.ambient) ? nature.ambient : undefined;
    // null = "Sin límite": setSleepTimer(null) deja sonando sin temporizador.
    setSleepTimer(opt.minutes);
    router.push({
      pathname: "/inmersivo",
      params: {
        title: session.title,
        baseId: base,
        ...(ambient ? { ambientId: ambient } : {}),
      },
    } as never);
  };

  // Cancelar el timer detiene el sonido que arrancó al tocar la card.
  const handleCancelTimer = () => {
    setPendingSession(null);
    stopAll();
  };

  return (
    <View style={[styles.root, { backgroundColor: "#060A0F" }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#060A0F", "#060A0F"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 120 + bottomPad,
          paddingTop: topPad + 8,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: H_PAD }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={[styles.catIconCircle, { backgroundColor: "transparent", borderColor: "transparent" }]}>
            <Feather name="music" size={44} color="#50AC6E" />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>
            Frecuencias
          </Text>
          <Text style={[styles.pageSub, { color: "#EDE1D3" }]}>
            Elige un sonido y conecta con el momento presente
          </Text>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabsRow, { paddingHorizontal: H_PAD }]}
          style={{ marginBottom: 20 }}
        >
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active ? colors.primary : "#11161F",
                    borderColor: "transparent",
                    borderWidth: 0,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: active ? "#060A0F" : colors.foreground },
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Grid */}
        <View style={[styles.grid, { paddingHorizontal: H_PAD }]}>
          {filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Feather name="search" size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Sin resultados
              </Text>
            </View>
          ) : (
            <View style={styles.gridRow}>
              {filtered.map((session) => {
                const fav = isFavorite(session.id);
                const tag = session.soundTag;
                const tagStyle = tag ? TAG_COLORS[tag] : null;
                const tagIcon = tag ? TAG_ICONS[tag] : null;

                return (
                  <Pressable
                    key={session.id}
                    style={({ pressed }) => [
                      styles.card,
                      {
                        width: CARD_WIDTH,
                        backgroundColor: "#090E17",
                        borderColor: "transparent",
                        borderWidth: 0,
                        opacity: pressed ? 0.82 : 1,
                      },
                    ]}
                    onPress={() => {
                      if (session.isPremium && !isPremium) {
                        router.push("/membresia" as never);
                      } else if (session.soundTag === "Sonidos Naturaleza") {
                        // Modelo Pura Mente: arranca el sonido base (fondo) al
                        // instante y abre el timer. El ambiente precargado se
                        // suma en la inmersiva; no hay picker de sonidos.
                        const base = getNatureSounds(session.id)?.base;
                        if (base && hasSoundFile(base)) {
                          stopAll();
                          toggleSound(base);
                          setPendingSession(session);
                        }
                      } else {
                        // Música Ambient / Enteógena → pistas con duración fija
                        playSession(session);
                        router.push("/player" as never);
                      }
                    }}
                  >
                    {/* Full-bleed image */}
                    <View style={[styles.imgWrap, { width: CARD_WIDTH, height: CARD_WIDTH, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, overflow: "hidden" }]}>
                      <ExpoImage
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        source={session.image as any}
                        style={[styles.img, { width: CARD_WIDTH, height: CARD_WIDTH, borderRadius: 0 }]}
                        contentFit="cover"
                        transition={IMAGE_TRANSITION}
                        cachePolicy="memory-disk"
                        placeholder={BLUR_PLACEHOLDER}
                      />
                      <PremiumBadge session={session} />
                    </View>

                    {/* Title */}
                    <Text
                      style={[styles.cardTitle, { color: colors.foreground }]}
                      numberOfLines={2}
                    >
                      {session.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <CategoryInfoPanel
          accentColor="#A8C4A8"
          heading="¿Qué es Frecuencias?"
          items={[
            {
              icon: "music",
              title: "Atmósferas para acompañar",
              body: "Paisajes sonoros que sostienen el momento — para meditar, leer, trabajar o simplemente estar.",
            },
            {
              icon: "repeat",
              title: "Pensados para fluir",
              body: "En Sonidos Naturaleza eliges cuánto tiempo permanecer dentro del sonido. Música Ambient y Enteógena son pistas de duración fija.",
            },
            {
              icon: "headphones",
              title: "Mejor con auriculares",
              body: "El detalle estéreo y las capas sutiles cobran vida cuando escuchas con auriculares.",
            },
          ]}
          quote="El sonido no llena el silencio — lo revela."
          whyItems={[
            { icon: "feather", text: "Porque la música también es un refugio." },
            { icon: "wind", text: "Porque a veces basta con escuchar para volver al cuerpo." },
          ]}
        />

        {featuredArtists.length > 0 && (
          <View style={styles.artistsSection}>
            <Text style={[styles.artistsTitle, { color: colors.foreground }]}>Artistas</Text>
            <Text style={[styles.artistsSub, { color: colors.mutedForeground }]}>
              Productores certificados que crean música para Resonancia
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 6 }}
            >
              {featuredArtists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Duration Picker Modal */}
      <Modal
        visible={!!pendingSession}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={handleCancelTimer}
      >
        <TouchableWithoutFeedback onPress={handleCancelTimer}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalSheet,
                  {
                    backgroundColor: "rgba(9,14,23,0.98)",
                    paddingBottom: Math.max(insets.bottom, 24) + 8,
                  },
                ]}
              >
                {/* Drag handle */}
                <View style={[styles.dragHandle, { backgroundColor: "rgba(198,155,79,0.25)" }]} />

                {/* Session info */}
                {pendingSession && (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={[styles.modalIcon, { backgroundColor: "rgba(198,155,79,0.12)" }]}>
                        <Feather name="clock" size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                          ¿Cuánto tiempo?
                        </Text>
                        <Text style={[styles.modalSub, { color: colors.foreground }]} numberOfLines={1}>
                          {pendingSession.title}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.modalHint, { color: colors.mutedForeground }]}>
                      El sonido se detiene al terminar este tiempo · 5, 10 y 20 min gratis
                    </Text>

                    {/* Timer options */}
                    <View style={styles.durationGrid}>
                      {TIMER_OPTIONS.map((opt) => {
                        const locked = !opt.free && !isPremium;
                        return (
                          <Pressable
                            key={opt.label}
                            style={({ pressed }) => [
                              styles.durationBtn,
                              {
                                backgroundColor: pressed
                                  ? colors.primary
                                  : "rgba(198,155,79,0.10)",
                                borderColor: pressed
                                  ? colors.primary
                                  : "rgba(198,155,79,0.28)",
                              },
                            ]}
                            onPress={() => handleSelectTimer(opt)}
                          >
                            {({ pressed }) => (
                              <>
                                <Text
                                  style={[
                                    styles.durationNum,
                                    { fontSize: 18, color: pressed ? "#060A0F" : colors.foreground },
                                  ]}
                                >
                                  {opt.label}
                                </Text>
                                {locked && (
                                  <View style={styles.timerLock}>
                                    <Feather name="lock" size={9} color="#C69B4F" />
                                  </View>
                                )}
                              </>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Cancel */}
                    <Pressable
                      style={[styles.cancelBtn, { borderColor: "rgba(198,155,79,0.22)" }]}
                      onPress={handleCancelTimer}
                    >
                      <Text style={[styles.cancelText, { color: colors.foreground }]}>
                        Cancelar
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  artistsSection: { paddingHorizontal: 20, marginTop: 28 },
  artistsTitle: { fontSize: 18, fontWeight: "700", letterSpacing: 0.3, marginBottom: 6 },
  artistsSub: { fontSize: 13, lineHeight: 18, marginBottom: 4 },

  header: {
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 4,
  },
  backBtn: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  catIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 6,
    textAlign: "center",
  },
  pageSub: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  searchWrap: {},
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    margin: 0,
  },

  tabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 2,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },

  grid: {},
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },

  card: {
    borderRadius: 16,
    borderWidth: 0,
    overflow: "hidden",
    alignItems: "center",
    position: "relative",
    marginBottom: 4,
  },
  favBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    padding: 2,
  },
  imgWrap: {
    position: "relative",
    marginBottom: 0,
    marginTop: 0,
  },
  img: {},
  tagBadge: {
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
    left: "10%",
    right: "10%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 15,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },

  emptyWrap: {
    alignItems: "center",
    paddingVertical: 60,
    width: "100%",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 10,
  },
  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  modalSub: {
    fontSize: 13,
  },
  modalHint: {
    fontSize: 12,
    marginBottom: 22,
    lineHeight: 18,
  },
  durationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  durationBtn: {
    width: (width - 48 - 20) / 3,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  timerLock: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(214,168,91,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  durationNum: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 26,
  },
  durationUnit: {
    fontSize: 11,
    fontWeight: "500",
  },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
