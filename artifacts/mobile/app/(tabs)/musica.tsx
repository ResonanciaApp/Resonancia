import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import {
  Alert,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MixerPanel } from "@/components/MixerPanel";
import { SacredBackground } from "@/components/SacredBackground";
import { getSoundImage } from "@/config/sound-images";
import { usePremium } from "@/context/PremiumContext";
import { MAX_ACTIVE_SOUNDS, useMixer } from "@/context/MixerContext";
import { MIX_CATEGORIES } from "@/data/mix-categories";
import {
  type MixSound,
  SOUND_CATEGORIES,
  getSoundsByCategory,
  hasSoundFile,
} from "@/data/sounds";
import { useColors } from "@/hooks/useColors";

export default function MiMusicaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();
  const { isActive, toggleSound, stopAll } = useMixer();

  // Al salir de esta pantalla, detener la mezcla (no debe seguir sonando fuera del mezclador).
  useFocusEffect(
    useCallback(() => {
      return () => {
        stopAll();
      };
    }, [stopAll]),
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSoundPress = (sound: MixSound) => {
    if (!hasSoundFile(sound.id)) return; // "Próximamente"
    if (sound.isPremium && !isPremium) {
      router.push("/membresia" as never);
      return;
    }
    if (!isActive(sound.id)) {
      const ok = toggleSound(sound.id);
      if (!ok) {
        Alert.alert(
          "Límite alcanzado",
          `Podés mezclar hasta ${MAX_ACTIVE_SOUNDS} sonidos a la vez. Quitá uno para agregar otro.`,
        );
      }
    } else {
      toggleSound(sound.id);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 200 + bottomPad,
          paddingTop: topPad + 12,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Mi Música</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Tus mezclas, organizadas por momento
          </Text>
        </View>

        {/* ── Categorías de mezclas ── */}
        <View style={styles.catRow}>
          {MIX_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => router.push(`/mezclas/${cat.id}` as never)}
              style={[styles.catCard, { backgroundColor: "rgba(237,225,211,0.06)", borderColor: colors.border }]}
            >
              <View style={[styles.catIconWrap, { backgroundColor: "rgba(237,225,211,0.08)" }]}>
                <Feather name={cat.icon} size={22} color={colors.accent} />
              </View>
              <Text style={[styles.catLabel, { color: colors.foreground }]} numberOfLines={2}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Mezclador ── */}
        <View style={styles.mixerHeader}>
          <Text style={[styles.pageTitle, { color: colors.foreground, fontSize: 24 }]}>
            Crea tu música
          </Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Acá aparecerán los sonidos que selecciones
          </Text>
        </View>

        {/* ── Mezcla activa ── */}
        <MixerPanel />

        {/* ── Biblioteca de sonidos ── */}
        <View style={styles.allSoundsHeader}>
          <Text style={[styles.pageTitle, { color: colors.foreground, fontSize: 24 }]}>
            Todos los sonidos
          </Text>
        </View>
        {SOUND_CATEGORIES.map((cat) => {
          const sounds = getSoundsByCategory(cat.id);
          if (sounds.length === 0) return null;
          return (
            <View key={cat.id} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{cat.label}</Text>
              <View style={styles.grid}>
                {sounds.map((sound) => {
                  const available = hasSoundFile(sound.id);
                  const active = isActive(sound.id);
                  const locked = sound.isPremium && !isPremium;
                  const image = getSoundImage(sound.id);

                  const overlay = (
                    <>
                      {/* Degradado para legibilidad del texto */}
                      <LinearGradient
                        colors={
                          active
                            ? ["rgba(198,155,79,0.10)", "rgba(24,17,12,0.20)", "rgba(24,17,12,0.85)"]
                            : ["rgba(24,17,12,0)", "rgba(24,17,12,0.12)", "rgba(24,17,12,0.82)"]
                        }
                        locations={[0, 0.55, 1]}
                        style={styles.cardOverlay}
                      />

                      {locked && (
                        <View style={styles.lockBadge}>
                          <Feather name="star" size={9} color="#18110C" />
                        </View>
                      )}

                      {active && (
                        <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                          <Feather name="check" size={11} color={colors.primaryForeground} />
                        </View>
                      )}

                      <View style={styles.cardContent}>
                        <Text style={styles.soundName} numberOfLines={1}>
                          {sound.name}
                        </Text>
                        {!available && <Text style={styles.soonText}>Próximamente</Text>}
                      </View>
                    </>
                  );

                  return (
                    <Pressable
                      key={sound.id}
                      onPress={() => handleSoundPress(sound)}
                      disabled={!available}
                      style={[
                        styles.soundCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: active ? colors.primary : "rgba(0,0,0,0.25)",
                          borderWidth: active ? 2 : StyleSheet.hairlineWidth,
                        },
                      ]}
                    >
                      {image ? (
                        <ImageBackground
                          source={image}
                          style={styles.cardImage}
                          imageStyle={[styles.cardImageInner, { opacity: available ? 1 : 0.4 }]}
                        >
                          {overlay}
                        </ImageBackground>
                      ) : (
                        <View style={styles.cardImage}>{overlay}</View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: { marginBottom: 20 },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  pageSub: { fontSize: 13, lineHeight: 18 },

  // Secciones
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: "700", letterSpacing: 0.3, marginBottom: 10 },

  // Categorías de mezclas
  catRow: { flexDirection: "row", gap: 10, marginBottom: 26 },
  catCard: {
    flex: 1,
    height: 110,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  catIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    textAlign: "center",
  },
  mixerHeader: { marginBottom: 18 },
  allSoundsHeader: { marginTop: 8, marginBottom: 14 },

  // Grilla de sonidos
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  soundCard: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardImage: { flex: 1, justifyContent: "flex-end" },
  cardImageInner: { borderRadius: 16 },
  cardOverlay: { ...StyleSheet.absoluteFillObject },
  cardContent: { padding: 8 },
  soundName: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  soonText: {
    fontSize: 9,
    letterSpacing: 0.2,
    color: "rgba(237,225,211,0.85)",
    marginTop: 2,
  },
  lockBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#D6A85B",
    alignItems: "center",
    justifyContent: "center",
  },
  activeBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
