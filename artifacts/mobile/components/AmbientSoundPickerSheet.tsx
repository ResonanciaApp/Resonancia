import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image as ExpoImage } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getSoundImage } from "@/config/sound-images";
import { SOUNDS, hasSoundFile, type MixSound, type SoundCategoryId } from "@/data/sounds";
import { REMOTE_SOUND_MAP } from "@/lib/remoteSoundMap";
import { BLUR_PLACEHOLDER } from "@/constants/imagePlaceholder";

/** Sonidos que realmente tienen audio (bundle o remoto) */
function isPlayable(id: string): boolean {
  return hasSoundFile(id) || !!REMOTE_SOUND_MAP[id];
}

const PLAYABLE_SOUNDS = SOUNDS.filter((s) => isPlayable(s.id));

const FAV_KEY = "@ambient_fav_sounds";

type TabId = "todos" | "naturaleza" | "ancestrales" | "digital" | "voces" | "bpm";

const TABS: { id: TabId; label: string; categories: SoundCategoryId[] | null }[] = [
  { id: "todos",       label: "Todos",     categories: null },
  { id: "naturaleza",  label: "Naturales", categories: ["animales","bosque","mar","fuego","desierto"] },
  { id: "ancestrales", label: "Sagrados",  categories: ["cuencos_tibetanos","cuencos_cuarzo","gongs","campanas_viento","vientos","cantos","percusion"] },
  { id: "digital",     label: "Digital",   categories: ["solfeggio","ruidos","frecuencias"] },
  { id: "voces",       label: "Voces",     categories: ["mantras"] },
  { id: "bpm",         label: "BPM",       categories: ["bpm"] },
];

const TAB_COLORS: Record<TabId, string> = {
  todos:       "#8C1A2B",
  naturaleza:  "#3A9060",
  ancestrales: "#B09040",
  digital:     "#3A80B0",
  voces:       "#9060A0",
  bpm:         "#A04040",
};

type SessionInfo = { title: string; image: any };

type Props = {
  visible: boolean;
  selectedSoundId: string | null;
  session?: SessionInfo;
  onClose: () => void;
  onSelect: (soundId: string | null, ambientVolume: number, sessionVolume: number) => void;
  /** Valor inicial del slider de sesión (refleja el volumen actual del player) */
  initialSessionVolume?: number;
  /** Valor inicial del slider de ambiente (refleja el volumen del overlay actual) */
  initialAmbientVolume?: number;
  /** Llamado al tocar un sonido para previsualización inmediata (null = detener) */
  onPreviewStart?: (soundId: string | null) => void;
  /** Si hay sonido ya seleccionado, abrir directo en "controles" */
  initialStep?: "pick" | "controles";
  /** Llamado en tiempo real al mover el slider de sesión */
  onSessionVolumeChange?: (vol: number) => void;
  /** Llamado en tiempo real al mover el slider de ambiente */
  onAmbientVolumeChange?: (vol: number) => void;
  /** Llamado al confirmar la eliminación del sonido ambiente (cierra el sheet y limpia) */
  onRemoveConfirm?: () => void;
};

export function AmbientSoundPickerSheet({
  visible,
  selectedSoundId,
  session,
  onClose,
  onSelect,
  initialSessionVolume,
  initialAmbientVolume,
  onPreviewStart,
  initialStep,
  onSessionVolumeChange,
  onAmbientVolumeChange,
  onRemoveConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabId>("todos");
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [localSelected, setLocalSelected] = useState<string | null>(selectedSoundId);
  const [favPopupSound, setFavPopupSound] = useState<MixSound | null>(null);
  const [step, setStep] = useState<"pick" | "controles">("pick");
  const [sessionVolume, setSessionVolume] = useState(initialSessionVolume ?? 0.8);
  const [ambientVolume, setAmbientVolume] = useState(initialAmbientVolume ?? 0.5);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const goToControles = () => {
    setStep("controles");
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
    }).start();
  };

  const goToPick = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 340,
      useNativeDriver: true,
    }).start(() => setStep("pick"));
  };

  // Reset whenever the sheet opens
  useEffect(() => {
    if (!visible) return;
    const startStep = initialStep ?? "pick";
    setLocalSelected(selectedSoundId);
    setStep(startStep);
    slideAnim.setValue(startStep === "controles" ? 1 : 0);
    setSessionVolume(initialSessionVolume ?? 0.8);
    setAmbientVolume(initialAmbientVolume ?? 0.5);
    AsyncStorage.getItem(FAV_KEY).then((val) => {
      if (val) setFavIds(new Set(JSON.parse(val) as string[]));
    });
  }, [visible]);

  const toggleFav = useCallback(async (id: string) => {
    setFavIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      AsyncStorage.setItem(FAV_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const filteredSounds = useMemo(() => {
    const tab = TABS.find((t) => t.id === activeTab);
    if (!tab || !tab.categories) return PLAYABLE_SOUNDS;
    return PLAYABLE_SOUNDS.filter((s) => tab.categories!.includes(s.category));
  }, [activeTab]);

  const favSounds = useMemo(() => PLAYABLE_SOUNDS.filter((s) => favIds.has(s.id)), [favIds]);

  const handleGuardar = () => {
    onSelect(localSelected, ambientVolume, sessionVolume);
    onClose();
  };

  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;
  const topPad = (Platform.OS === "web" ? 20 : insets.top) + 8;

  const ambientSound = localSelected ? SOUNDS.find((s) => s.id === localSelected) ?? null : null;
  const ambientImg = localSelected ? getSoundImage(localSelected) : null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={step === "controles" ? () => setStep("pick") : onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#191919" }]} />

        {/* ═══════════════════════════════════════════════════════════════
            PASO 1 — PICKER  (slideAnim=0 → visible; =1 → desliza abajo)
        ═══════════════════════════════════════════════════════════════ */}
        <Animated.View
          pointerEvents={step === "pick" ? "box-none" : "none"}
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, SCREEN_H],
                }),
              }],
            },
          ]}
        >
          {/* Top bar */}
          <View style={[styles.topBar, { paddingTop: topPad }]}>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.cancelBtn}>Cancelar</Text>
            </Pressable>
            <Text style={styles.topTitle}>Sonido Ambiente</Text>
            <View style={{ width: 70 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scroll}
          >
            {/* Sin sonido chip */}
            <Pressable
              style={[styles.noSoundChip, localSelected === null && styles.noSoundChipSelected]}
              onPress={() => { setLocalSelected(null); onPreviewStart?.(null); }}
            >
              <Feather name="volume-x" size={14} color={localSelected === null ? "#F9F9F9" : "#F4F4F4"} />
              <Text style={[styles.noSoundText, localSelected === null && { color: "#F9F9F9" }]}>
                Sin sonido
              </Text>
            </Pressable>

            {/* Favoritos */}
            <Text style={styles.sectionTitle}>Favoritos</Text>
            {favSounds.length > 0 ? (
              <View style={styles.grid}>
                {favSounds.map((sound) => (
                  <SoundCard
                    key={sound.id}
                    sound={sound}
                    selected={localSelected === sound.id}
                    fav={true}
                    onPress={() => { setLocalSelected(sound.id); onPreviewStart?.(sound.id); }}
                    onLongPress={() => setFavPopupSound(sound)}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.favPlaceholder}>
                Presiona un sonido por 1 segundo para agregarlo a favoritos
              </Text>
            )}

            {/* Tabs */}
            <Text style={styles.sectionTitle}>Explorar</Text>
            <View style={styles.tabsGrid}>
              {TABS.map((tab) => {
                const sel = activeTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    style={[
                      styles.tab,
                      sel
                        ? { backgroundColor: "transparent", borderColor: "#FFFFFF" }
                        : { backgroundColor: "transparent", borderColor: "rgba(255,255,255,0.22)" },
                    ]}
                  >
                    <Text style={[styles.tabLabel, sel && { color: "white", fontWeight: "700" }]}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Sounds grid */}
            <View style={styles.grid}>
              {filteredSounds.map((sound) => (
                <SoundCard
                  key={sound.id}
                  sound={sound}
                  selected={localSelected === sound.id}
                  fav={favIds.has(sound.id)}
                  onPress={() => { setLocalSelected(sound.id); onPreviewStart?.(sound.id); }}
                  onLongPress={() => setFavPopupSound(sound)}
                />
              ))}
            </View>
          </ScrollView>

          {/* ── Fav popup ───────────────────────────────────────────────── */}
          {favPopupSound && (
            <Pressable style={styles.popupBackdrop} onPress={() => setFavPopupSound(null)}>
              <Pressable style={styles.popup} onPress={() => {}}>
                {(() => {
                  const img = getSoundImage(favPopupSound.id);
                  const isFav = favIds.has(favPopupSound.id);
                  return (
                    <>
                      <View style={styles.popupThumbWrap}>
                        {img ? (
                          <ExpoImage
                            source={img}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={[StyleSheet.absoluteFill, styles.cardFallback]} />
                        )}
                      </View>
                      <View style={styles.popupBody}>
                        <Text style={styles.popupName} numberOfLines={1}>{favPopupSound.name}</Text>
                        <Pressable
                          style={[styles.popupFavBtn, isFav && styles.popupFavBtnActive]}
                          onPress={() => {
                            toggleFav(favPopupSound.id);
                            setFavPopupSound(null);
                          }}
                        >
                          <Feather name="heart" size={14} color="white" />
                          <Text style={[styles.popupFavText, isFav && styles.popupFavTextActive]}>
                            {isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
                          </Text>
                        </Pressable>
                      </View>
                    </>
                  );
                })()}
              </Pressable>
            </Pressable>
          )}

          {/* ── Sticky footer ───────────────────────────────────────────── */}
          <BlurView
            intensity={60}
            tint="dark"
            style={[styles.footer, { paddingBottom: bottomPad + 12 }]}
          >
            <Pressable
              style={styles.nextBtn}
              onPress={localSelected !== null ? goToControles : undefined}
              disabled={localSelected === null}
            >
              <Text style={[styles.nextBtnText, localSelected === null && styles.nextBtnTextDisabled]}>
                Siguiente
              </Text>
            </Pressable>
          </BlurView>
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════════
            PASO 2 — CONTROLES  (slideAnim=0 → abajo; =1 → visible)
        ═══════════════════════════════════════════════════════════════ */}
        <Animated.View
          pointerEvents={step === "controles" ? "box-none" : "none"}
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [SCREEN_H, 0],
                }),
              }],
            },
          ]}
        >
          {/* Session image background */}
          {session?.image && (
            <ExpoImage
              source={session.image}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0.75)"]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Top bar */}
          <View style={[styles.topBar, { paddingTop: topPad }]}>
            <Pressable style={styles.descartarBtn} onPress={goToPick} hitSlop={8}>
              <Feather name="x" size={16} color="rgba(255,255,255,0.75)" />
              <Text style={styles.descartarText}>Descartar</Text>
            </Pressable>
            <View style={{ width: 70 }} />
          </View>

          {/* Bottom controls panel */}
          <View style={[styles.controlesPanel, { paddingBottom: bottomPad + 16 }]}>
            <Text style={styles.controlesTitulo}>Controles</Text>

            <TrackRow
              image={session?.image ?? null}
              name={session?.title ?? "Sesión"}
              volume={sessionVolume}
              onVolumeChange={(v) => { setSessionVolume(v); onSessionVolumeChange?.(v); }}
              onRemove={null}
            />

            {ambientSound && (
              <TrackRow
                image={ambientImg ?? null}
                name={ambientSound.name}
                volume={ambientVolume}
                onVolumeChange={(v) => { setAmbientVolume(v); onAmbientVolumeChange?.(v); }}
                onRemove={() => {
                  Alert.alert(
                    "Eliminar sonido ambiental",
                    "¿Estás seguro/a de que quieres eliminar este sonido ambiental?",
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Eliminar",
                        style: "destructive",
                        onPress: () => {
                          onPreviewStart?.(null);
                          onRemoveConfirm?.();
                        },
                      },
                    ]
                  );
                }}
              />
            )}

            <Pressable style={styles.guardarBtn} onPress={handleGuardar}>
              <Text style={styles.guardarText}>Guardar</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── TrackRow ──────────────────────────────────────────────────────────────
function TrackRow({
  image,
  name,
  volume,
  onVolumeChange,
  onRemove,
}: {
  image: any;
  name: string;
  volume: number;
  onVolumeChange: (v: number) => void;
  onRemove: (() => void) | null;
}) {
  const trackRef = useRef<View>(null);
  const trackWidth = useRef(0);
  const trackPageX = useRef(0);

  const computeValue = (pageX: number) =>
    Math.max(0, Math.min(1, (pageX - trackPageX.current) / (trackWidth.current || 1)));

  return (
    <View style={styles.trackRow}>
      {/* Thumbnail */}
      <View style={styles.trackThumbWrap}>
        {image ? (
          <ExpoImage source={image} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.08)" }]} />
        )}
        {onRemove && (
          <Pressable style={styles.trackRemoveBtn} onPress={onRemove} hitSlop={6}>
            <Feather name="x" size={10} color="white" />
          </Pressable>
        )}
      </View>

      {/* Name + slider */}
      <View style={styles.trackMain}>
        <Text style={styles.trackName} numberOfLines={1}>{name}</Text>
        <View style={styles.trackSliderRow}>
          <View
            ref={trackRef}
            style={styles.trackSliderHit}
            onLayout={(e) => { trackWidth.current = e.nativeEvent.layout.width; }}
            onStartShouldSetResponder={() => true}
            onResponderGrant={(e) => {
              trackRef.current?.measure((_x, _y, _w, _h, px) => {
                trackPageX.current = px;
                onVolumeChange(computeValue(e.nativeEvent.pageX));
              });
            }}
            onResponderMove={(e) => onVolumeChange(computeValue(e.nativeEvent.pageX))}
          >
            <View style={styles.trackSliderTrack}>
              <View style={[styles.trackSliderFill, { width: `${volume * 100}%` as any }]} />
              <View style={[styles.trackSliderThumb, { left: `${volume * 100}%` as any }]} />
            </View>
          </View>
          <Feather name="volume-2" size={18} color="#F4F4F4" style={{ marginLeft: 8 }} />
        </View>
      </View>
    </View>
  );
}

// ─── SoundCard ─────────────────────────────────────────────────────────────
function SoundCard({
  sound,
  selected,
  fav,
  onPress,
  onLongPress,
}: {
  sound: MixSound;
  selected: boolean;
  fav: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const img = getSoundImage(sound.id);

  return (
    <View style={styles.cardWrap}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={1000}
        style={[styles.card, selected && styles.cardSelected]}
      >
        {/* Thumbnail */}
        {img ? (
          <ExpoImage
            source={img}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            placeholder={BLUR_PLACEHOLDER}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.cardFallback]} />
        )}

        {/* Dark overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.30)"]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Fav indicator (small dot, no button) */}
        {fav && (
          <View style={styles.favDot} pointerEvents="none" />
        )}
      </Pressable>

      {/* Name below the card */}
      <Text style={[styles.cardName, selected && { color: "white", fontWeight: "700" }]} numberOfLines={2}>
        {sound.name}
      </Text>
    </View>
  );
}

const SCREEN_H = Dimensions.get("window").height;
const GRID_H_PAD = 16;
const GRID_GAP = 10;
const NUM_COLS = 3;
const CARD_SIZE = Math.floor(
  (Dimensions.get("window").width - GRID_H_PAD * 2 - GRID_GAP * (NUM_COLS - 1)) / NUM_COLS
) - 5;

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  cancelBtn: {
    fontFamily: "Manrope",
    fontSize: 16,
    color: "#FFFFFF",
    width: 70,
  },
  topTitle: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
  },

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  nextBtn: {
    backgroundColor: "white",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  nextBtnText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(0,0,0,1)",
    letterSpacing: 0.3,
    opacity: 1,
  },
  nextBtnTextDisabled: {
    opacity: 0.25,
  },

  noSoundChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 22,
  },
  noSoundChipSelected: {
    borderColor: "#F9F9F9",
    backgroundColor: "rgba(212,175,55,0.10)",
  },
  noSoundText: {
    fontFamily: "Manrope",
    fontSize: 14,
    color: "#F4F4F4",
  },

  sectionTitle: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.40)",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: 12,
    marginTop: 4,
  },

  favPlaceholder: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: "rgba(255,255,255,0.30)",
    fontStyle: "italic",
    marginBottom: 22,
    lineHeight: 19,
  },

  tabsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabLabel: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: "#F4F4F4",
    fontWeight: "400",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: GRID_GAP,
    rowGap: GRID_GAP,
    marginBottom: 24,
    paddingHorizontal: 8,
  },

  cardWrap: {
    width: CARD_SIZE,
    alignItems: "center",
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "rgba(255,255,255,0.08)",
    position: "relative",
  },
  cardSelected: {
    borderColor: "white",
  },
  cardFallback: {
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  favDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#F9F9F9",
  },

  checkBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F9F9F9",
    alignItems: "center",
    justifyContent: "center",
  },

  cardName: {
    fontFamily: "Manrope",
    fontSize: 11,
    color: "rgba(255,255,255,0.80)",
    textAlign: "center",
    lineHeight: 15,
    marginTop: 6,
  },

  // ── Controles view ──────────────────────────────────────────────────────
  descartarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 110,
  },
  descartarText: {
    fontFamily: "Manrope",
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
  },
  controlesPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#111111",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },
  controlesTitulo: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
    marginBottom: 4,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  trackThumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
    flexShrink: 0,
    position: "relative",
  },
  trackRemoveBtn: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  trackMain: {
    flex: 1,
    gap: 6,
  },
  trackName: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "500",
    color: "white",
  },
  trackSliderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  trackSliderHit: {
    flex: 1,
    height: 28,
    justifyContent: "center",
  },
  trackSliderTrack: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderRadius: 2,
    position: "relative",
  },
  trackSliderFill: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 3,
    backgroundColor: "white",
    borderRadius: 2,
  },
  trackSliderThumb: {
    position: "absolute",
    top: -7,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "white",
    marginLeft: -8,
  },
  guardarBtn: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  guardarText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },

  // ── Fav popup ──────────────────────────────────────────────────────────
  popupBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  popup: {
    width: 260,
    backgroundColor: "#191919",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  popupThumbWrap: {
    width: "100%",
    height: 130,
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  popupBody: {
    padding: 16,
    gap: 12,
  },
  popupName: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },
  popupFavBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.30)",
    backgroundColor: "transparent",
  },
  popupFavBtnActive: {
    borderColor: "rgba(255,255,255,0.30)",
    backgroundColor: "transparent",
  },
  popupFavText: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  popupFavTextActive: {
    color: "white",
  },
});
