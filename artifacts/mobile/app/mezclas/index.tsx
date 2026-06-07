import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MixActionsSheet } from "@/components/MixActionsSheet";
import { MiniPlayer } from "@/components/MiniPlayer";
import { SacredBackground } from "@/components/SacredBackground";
import { getSoundImage } from "@/config/sound-images";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { usePremium } from "@/context/PremiumContext";
import { type MixCategory, MIX_CATEGORIES } from "@/data/mix-categories";
import { useColors } from "@/hooks/useColors";
import { useLoadMix } from "@/hooks/useLoadMix";

const BG_GRADIENT = ["#090D20", "#080A18", "#06070F"] as const;
const FG      = "#EDE1D3";
const MUTED   = "#7A8FA8";
const GOLD    = "#BE9650";
const BORDER  = "#1E2733";
const THUMB   = 44;
const SHIFT   = 26;
const MAX_STACK = 2;

// ── Íconos de categoría ──────────────────────────────────────────────
function MoonIcon({ color, size = 26 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" fill={color} />
    </Svg>
  );
}

function ZenStonesIcon({ color, size = 26 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Ellipse cx="15"   cy="23.5" rx="8"   ry="4.2" fill={color} opacity={0.95} />
      <Ellipse cx="15.6" cy="16.5" rx="5.8" ry="3.3" fill={color} opacity={0.85} />
      <Ellipse cx="14.8" cy="10.8" rx="3.8" ry="2.6" fill={color} opacity={0.75} />
    </Svg>
  );
}

// ── Stack de imágenes ────────────────────────────────────────────────
function SoundStack({ sounds }: { sounds: { id: string }[] }) {
  const colors = useColors();
  const visible = sounds.slice(0, MAX_STACK);
  const stackWidth = THUMB + Math.max(0, visible.length - 1) * SHIFT;
  return (
    <View style={[styles.stackWrap, { width: stackWidth }]}>
      {visible.map((s, i) => {
        const img = getSoundImage(s.id);
        return (
          <View key={s.id} style={[styles.stackThumb, { left: i * SHIFT, zIndex: i }]}>
            {img ? (
              <Image source={img} style={styles.stackThumbImg} resizeMode="cover" />
            ) : (
              <View style={[styles.stackThumbImg, { backgroundColor: "rgba(182,149,95,0.15)" }]}>
                <Feather name="music" size={14} color={colors.primary} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ── Pantalla principal ───────────────────────────────────────────────
export default function MezclasIndexScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const { presets, deletePreset, duplicatePreset, loadedPresetId, isPlaying, stopAll } = useMixer();
  const loadMix   = useLoadMix();
  const { isPremium } = usePremium();

  const [activeTab, setActiveTab] = useState<MixCategory>("dormir");
  const [menuMix,   setMenuMix]   = useState<MixPreset | null>(null);

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useFocusEffect(
    useCallback(() => {
      return () => { stopAll(); };
    }, [stopAll]),
  );

  const tabMixes = useMemo(
    () => presets.filter((p) => p.category === activeTab),
    [presets, activeTab],
  );

  const handleDuplicate = (mix: MixPreset) => {
    const countInCategory = presets.filter((p) => p.category === mix.category).length;
    if (!isPremium && countInCategory >= 1) {
      Alert.alert(
        "Mezclas ilimitadas con Premium",
        "En la versión gratuita podés guardar 1 mezcla por categoría. Hacete Premium para duplicar y guardar todas las que quieras.",
        [
          { text: "Ahora no", style: "cancel" },
          { text: "Ver Premium", onPress: () => router.push("/membresia" as never) },
        ],
      );
      return;
    }
    duplicatePreset(mix.id);
  };

  const renderMix = (mix: MixPreset) => {
    const isPlayingThis = loadedPresetId === mix.id && isPlaying;
    return (
      <Pressable
        key={mix.id}
        onPress={() => loadMix(mix)}
        style={styles.mixRow}
      >
        <SoundStack sounds={mix.sounds} />

        <View style={styles.mixInfo}>
          <Text style={[styles.mixName, { color: colors.foreground }]} numberOfLines={1}>
            {mix.name}
          </Text>
          {isPlayingThis ? (
            <View style={styles.playingRow}>
              <Feather name="bar-chart-2" size={12} color={colors.primary} />
              <Text style={[styles.mixMeta, { color: colors.primary }]}>Reproduciendo</Text>
            </View>
          ) : (
            <Text style={[styles.mixMeta, { color: colors.mutedForeground }]}>
              {mix.sounds.length} sonido{mix.sounds.length !== 1 ? "s" : ""}
            </Text>
          )}
        </View>

        {isPlayingThis && (
          <Feather name="bar-chart-2" size={18} color={colors.primary} style={{ marginRight: 2 }} />
        )}

        <View onStartShouldSetResponder={() => true}>
          <Pressable onPress={() => setMenuMix(mix)} hitSlop={12} style={styles.menuBtn}>
            <Feather name="more-vertical" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <LinearGradient colors={BG_GRADIENT} style={styles.root} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <View style={[styles.inner, { paddingTop: topPad + 16 }]}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Feather name="chevron-left" size={20} color={FG} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Mis Mezclas</Text>
            <Text style={styles.pageSub}>Mezclas guardadas</Text>
          </View>
        </View>

        {/* ── Tab bar — subrayados ── */}
        <View style={styles.tabRow}>
          {MIX_CATEGORIES.map((cat) => {
            const sel = activeTab === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setActiveTab(cat.id)}
                style={styles.tabBlock}
                accessibilityRole="tab"
                accessibilityState={{ selected: sel }}
              >
                <Text style={[styles.tabLabel, { color: sel ? "#FFFFFF" : MUTED, fontWeight: sel ? "700" : "500" }]}>
                  {cat.label}
                </Text>
                {sel && <View style={styles.tabUnderline} />}
              </Pressable>
            );
          })}
        </View>

        {/* ── Lista de mezclas ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 + bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {tabMixes.length > 0 ? (
            tabMixes.map(renderMix)
          ) : (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Todavía no guardaste mezclas en esta categoría.
            </Text>
          )}
        </ScrollView>
      </View>

      <MixActionsSheet
        mix={menuMix}
        visible={menuMix !== null}
        onClose={() => setMenuMix(null)}
        onDuplicate={(mix) => { setMenuMix(null); handleDuplicate(mix); }}
        onDelete={(mix) => deletePreset(mix.id)}
      />

      <View style={[styles.miniPlayerFloat, { bottom: 16 + bottomPad }]}>
        <MiniPlayer />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1 },
  inner: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  pageTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.4, color: FG },
  pageSub:   { fontSize: 13, color: MUTED, marginTop: 2 },

  // Tab bar
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 16,
  },
  tabBlock: {
    flex: 1,
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 10,
    gap: 4,
  },
  tabLabel: { fontSize: 15, letterSpacing: 0.1 },
  tabUnderline: {
    height: 2,
    width: "60%",
    backgroundColor: "#5F598C",
    borderRadius: 1,
    marginTop: 2,
  },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  emptyText:     { fontSize: 13, lineHeight: 19 },

  // Mix row
  mixRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  mixInfo:    { flex: 1, minWidth: 0 },
  mixName:    { fontSize: 15, fontWeight: "700" },
  mixMeta:    { fontSize: 12, marginTop: 3 },
  playingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  menuBtn:    { width: 32, height: 32, alignItems: "center", justifyContent: "center" },

  // Sound stack
  stackWrap: { height: THUMB, position: "relative", flexShrink: 0 },
  stackThumb: {
    position: "absolute",
    width: THUMB, height: THUMB,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  stackThumbImg: {
    width: THUMB, height: THUMB,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // Mini player
  miniPlayerFloat: { position: "absolute", left: 0, right: 0 },
});
