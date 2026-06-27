import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SOUNDS, type MixSound, type SoundCategoryId } from "@/data/sounds";

const FAV_KEY = "@ambient_fav_sounds";

type TabId = "todos" | "naturaleza" | "ancestrales" | "digital" | "voces" | "bpm";

const TABS: { id: TabId; label: string; categories: SoundCategoryId[] | null }[] = [
  { id: "todos",        label: "Todos",     categories: null },
  { id: "naturaleza",   label: "Naturales", categories: ["animales","bosque","mar","fuego","desierto"] },
  { id: "ancestrales",  label: "Sagrados",  categories: ["cuencos_tibetanos","cuencos_cuarzo","gongs","campanas_viento","vientos","cantos","percusion"] },
  { id: "digital",      label: "Digital",   categories: ["solfeggio","ruidos","frecuencias"] },
  { id: "voces",        label: "Voces",     categories: ["mantras"] },
  { id: "bpm",          label: "BPM",       categories: ["bpm"] },
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

function SoundIcon({ sound, size = 26, color = "rgba(255,255,255,0.90)" }: { sound: MixSound; size?: number; color?: string }) {
  if (sound.iconSet === "ionicons") {
    return <Ionicons name={sound.icon as any} size={size} color={color} />;
  }
  return <Feather name={sound.icon as any} size={size} color={color} />;
}

export function AmbientSoundPickerSheet({ visible, selectedSoundId, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabId>("todos");
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!visible) return;
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

  const handleSelect = (soundId: string | null) => {
    onSelect(soundId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <LinearGradient colors={["#2E0510", "#1B060F"]} style={StyleSheet.absoluteFill} />

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
          contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 24 : insets.bottom) + 32 }]}
        >
          {/* Sin sonido chip */}
          <Pressable
            style={[styles.noSoundChip, selectedSoundId === null && styles.noSoundChipSelected]}
            onPress={() => handleSelect(null)}
          >
            <Feather name="volume-x" size={14} color={selectedSoundId === null ? "#D4AF37" : "rgba(255,255,255,0.65)"} />
            <Text style={[styles.noSoundText, selectedSoundId === null && { color: "#D4AF37" }]}>
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
                    selected={selectedSoundId === sound.id}
                    fav={favIds.has(sound.id)}
                    onPress={() => handleSelect(sound.id)}
                    onToggleFav={() => toggleFav(sound.id)}
                  />
                ))}
              </View>
            </>
          )}

          {/* Tabs */}
          <Text style={styles.sectionTitle}>Explorar</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}
          >
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
          </ScrollView>

          {/* Sounds grid */}
          <View style={styles.grid}>
            {filteredSounds.map((sound) => (
              <SoundCard
                key={sound.id}
                sound={sound}
                selected={selectedSoundId === sound.id}
                fav={favIds.has(sound.id)}
                onPress={() => handleSelect(sound.id)}
                onToggleFav={() => toggleFav(sound.id)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function SoundCard({
  sound,
  selected,
  fav,
  onPress,
  onToggleFav,
}: {
  sound: MixSound;
  selected: boolean;
  fav: boolean;
  onPress: () => void;
  onToggleFav: () => void;
}) {
  return (
    <Pressable style={[styles.card, selected && styles.cardSelected]} onPress={onPress}>
      {/* Fav toggle */}
      <Pressable
        style={styles.favBtn}
        onPress={(e) => { e.stopPropagation(); onToggleFav(); }}
        hitSlop={6}
      >
        <Feather name="heart" size={12} color={fav ? "#D4AF37" : "rgba(255,255,255,0.35)"} />
      </Pressable>

      {/* Icon */}
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <SoundIcon sound={sound} size={24} color={selected ? "#D4AF37" : "rgba(255,255,255,0.85)"} />
      </View>

      {/* Name */}
      <Text style={[styles.cardName, selected && { color: "#D4AF37" }]} numberOfLines={2}>
        {sound.name}
      </Text>

      {/* Selected check */}
      {selected && (
        <View style={styles.checkBadge}>
          <Feather name="check" size={10} color="#1B060F" />
        </View>
      )}
    </Pressable>
  );
}

const CARD_SIZE = 100;

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
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
    marginTop: 4,
  },

  tabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 16,
    paddingRight: 8,
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
    gap: 10,
    marginBottom: 24,
  },
  card: {
    width: CARD_SIZE,
    alignItems: "center",
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
    position: "relative",
  },
  cardSelected: {
    borderColor: "#D4AF37",
    backgroundColor: "rgba(212,175,55,0.10)",
  },

  favBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
  },

  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    marginTop: 8,
  },
  iconWrapSelected: {
    backgroundColor: "rgba(212,175,55,0.15)",
  },

  cardName: {
    fontSize: 11,
    color: "rgba(255,255,255,0.80)",
    textAlign: "center",
    lineHeight: 14,
  },

  checkBadge: {
    position: "absolute",
    top: -4,
    left: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
  },
});
