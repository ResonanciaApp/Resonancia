import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image as ExpoImage } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import { SOUNDS, type MixSound, type SoundCategoryId } from "@/data/sounds";
import { BLUR_PLACEHOLDER } from "@/constants/imagePlaceholder";

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

type Props = {
  visible: boolean;
  selectedSoundId: string | null;
  onClose: () => void;
  onSelect: (soundId: string | null) => void;
};

export function AmbientSoundPickerSheet({ visible, selectedSoundId, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabId>("todos");
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [localSelected, setLocalSelected] = useState<string | null>(selectedSoundId);
  const [favPopupSound, setFavPopupSound] = useState<MixSound | null>(null);

  // Reset local selection whenever the sheet opens
  useEffect(() => {
    if (!visible) return;
    setLocalSelected(selectedSoundId);
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
    if (!tab || !tab.categories) return SOUNDS;
    return SOUNDS.filter((s) => tab.categories!.includes(s.category));
  }, [activeTab]);

  const favSounds = useMemo(() => SOUNDS.filter((s) => favIds.has(s.id)), [favIds]);

  const handleConfirm = () => {
    onSelect(localSelected);
    onClose();
  };

  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#191919" }]} />

        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: (Platform.OS === "web" ? 20 : insets.top) + 8 }]}>
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
            onPress={() => setLocalSelected(null)}
          >
            <Feather name="volume-x" size={14} color={localSelected === null ? "#D4AF37" : "rgba(255,255,255,0.65)"} />
            <Text style={[styles.noSoundText, localSelected === null && { color: "#D4AF37" }]}>
              Sin sonido
            </Text>
          </Pressable>

          {/* Favoritos */}
          {favSounds.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Favoritos</Text>
              <View style={styles.grid}>
                {favSounds.map((sound) => (
                  <SoundCard
                    key={sound.id}
                    sound={sound}
                    selected={localSelected === sound.id}
                    fav={true}
                    onPress={() => setLocalSelected(sound.id)}
                    onLongPress={() => setFavPopupSound(sound)}
                  />
                ))}
              </View>
            </>
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
                      ? { backgroundColor: TAB_COLORS[tab.id], borderColor: TAB_COLORS[tab.id] }
                      : { backgroundColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.12)" },
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
                onPress={() => setLocalSelected(sound.id)}
                onLongPress={() => setFavPopupSound(sound)}
              />
            ))}
          </View>
        </ScrollView>

        {/* ── Fav popup ─────────────────────────────────────────────────── */}
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
                        <Feather name="heart" size={14} color={isFav ? "#1B060F" : "#D4AF37"} />
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

        {/* ── Sticky footer ─────────────────────────────────────────────── */}
        <BlurView
          intensity={60}
          tint="dark"
          style={[styles.footer, { paddingBottom: bottomPad + 12 }]}
        >
          <Pressable
            style={styles.nextBtn}
            onPress={localSelected !== null ? handleConfirm : undefined}
            disabled={localSelected === null}
          >
            <Text style={[styles.nextBtnText, localSelected === null && styles.nextBtnTextDisabled]}>
              Siguiente
            </Text>
          </Pressable>
        </BlurView>
      </View>
    </Modal>
  );
}

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

const GRID_H_PAD = 16;
const GRID_GAP = 10;
const NUM_COLS = 3;
const CARD_SIZE = Math.floor(
  (Dimensions.get("window").width - GRID_H_PAD * 2 - GRID_GAP * (NUM_COLS - 1)) / NUM_COLS
);

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
    fontSize: 16,
    color: "#D4AF37",
    width: 70,
  },
  topTitle: {
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
    borderColor: "#D4AF37",
    backgroundColor: "rgba(212,175,55,0.10)",
  },
  noSoundText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.40)",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: 12,
    marginTop: 4,
  },

  tabsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: GRID_GAP,
    rowGap: GRID_GAP,
    marginBottom: 24,
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
    backgroundColor: "#D4AF37",
  },

  checkBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
  },

  cardName: {
    fontSize: 11,
    color: "rgba(255,255,255,0.80)",
    textAlign: "center",
    lineHeight: 15,
    marginTop: 6,
  },

  popupBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  popup: {
    width: 260,
    backgroundColor: "#2E0510",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  popupThumbWrap: {
    width: "100%",
    height: 130,
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  popupBody: {
    padding: 16,
    gap: 12,
  },
  popupName: {
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
    borderColor: "#D4AF37",
    backgroundColor: "transparent",
  },
  popupFavBtnActive: {
    backgroundColor: "#D4AF37",
    borderColor: "#D4AF37",
  },
  popupFavText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#D4AF37",
  },
  popupFavTextActive: {
    color: "#1B060F",
  },
});
