import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { GhostPill } from "@/components/GhostPill";
import { router, useLocalSearchParams } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SessionActionsSheet } from "@/components/SessionActionsSheet";
import { SessionRow } from "@/components/SessionRow";
import { SESSIONS, type Session } from "@/data/sessions";
import { getTemaById } from "@/data/temas";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
const H_PAD = 20;
const STICKY_START = 180;
const STICKY_END   = 300;

export default function TemaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { theme: activeTheme } = useSceneTheme();
  const [actionsSession, setActionsSession] = useState<Session | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [STICKY_START, STICKY_END],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const tema = getTemaById(id ?? "");
  if (!tema) return null;

  const sessions = SESSIONS.filter((s) => {
    // Etiquetas Nivel 2 (admin): match por label exacto del tema.
    if (Array.isArray(s.temaTag) && s.temaTag.includes(tema.label)) return true;
    // Fallback legacy: match por themeTag (Etiquetas Nivel 1).
    return (
      !!tema.themeTagMatch?.length &&
      Array.isArray(s.themeTag) &&
      s.themeTag.some((t) => tema.themeTagMatch!.includes(t))
    );
  });

  const displaySessions =
    sessions.length > 0
      ? sessions
      : SESSIONS.filter((s) => s.isFeatured || s.isNew).slice(0, 10);

  return (
    <LinearGradient
      style={styles.root}
      colors={activeTheme.gradient}
    >
      <StatusBar hidden />

      {/* ── STICKY HEADER (fades in on scroll) ── */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            paddingTop: topPad,
            backgroundColor: "#210911",
            borderBottomColor: "rgba(212,175,55,0.15)",
            opacity: headerOpacity,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.stickyInner} pointerEvents="box-none">
          <GhostPill>
            <Pressable onPress={() => router.back()} hitSlop={10} style={styles.pillBtn}>
              <Feather name="arrow-left" size={16} color="#FFFFFF" />
            </Pressable>
          </GhostPill>
          <Text style={[styles.stickyTitle, { color: colors.foreground }]} numberOfLines={1}>
            {tema.label}
          </Text>
          <GhostPill>
            <Pressable hitSlop={10} style={styles.pillBtn} onPress={() => Alert.alert(tema.label, tema.description ?? "")}>
              <Feather name="info" size={16} color="rgba(255,255,255,0.85)" />
            </Pressable>
          </GhostPill>
        </View>
      </Animated.View>

      {/* ── Floating back button (always visible, on top of hero area) ── */}
      <View style={[styles.floatingBack, { top: topPad + 8 }]} pointerEvents="box-none">
        <GhostPill>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [styles.pillBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="arrow-left" size={16} color="#FFFFFF" />
          </Pressable>
        </GhostPill>
      </View>

      <Animated.ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 120 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Hero: icon + title + description */}
        <View style={[styles.hero, { paddingTop: topPad + 56 }]}>
          {tema.image != null ? (
            <ExpoImage
              source={tema.image}
              style={styles.heroIcon}
              contentFit="contain"
            />
          ) : (
            <MaterialCommunityIcons
              name={tema.icon}
              size={56}
              color={tema.color}
            />
          )}

          <Text style={[styles.title, { color: colors.foreground }]}>
            {tema.label}
          </Text>

          <Text
            style={[styles.description, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {tema.description}
          </Text>
        </View>

        {/* Session list */}
        <View style={styles.list}>
          {displaySessions.map((s) => (
            <SessionRow
              key={s.id}
              session={s}
              style={styles.row}
              onActionsPress={() => setActionsSession(s)}
            />
          ))}

          {displaySessions.length === 0 && (
            <View style={styles.empty}>
              <Feather
                name="inbox"
                size={32}
                color={colors.mutedForeground}
                style={{ marginBottom: 12 }}
              />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Proximamente
              </Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      <SessionActionsSheet
        session={actionsSession}
        visible={actionsSession !== null}
        onClose={() => setActionsSession(null)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  // Sticky header
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
  },
  stickyInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
    paddingTop: 10,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  stickyTitle: {
    fontFamily: "Manrope",
    fontSize: 22,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 8,
  },

  // Floating back (always visible on hero)
  floatingBack: {
    position: "absolute",
    left: H_PAD,
    zIndex: 10,
  },

  hero: {
    alignItems: "center",
    paddingHorizontal: H_PAD,
    paddingBottom: 32,
  },
  heroIcon: {
    width: 64,
    height: 64,
    marginBottom: 20,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 300,
  },

  divider: {
    height: 1,
    marginHorizontal: H_PAD,
    marginBottom: 8,
  },

  list: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
  },
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(61,14,22,0.40)",
  },

  empty: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
  },
});
