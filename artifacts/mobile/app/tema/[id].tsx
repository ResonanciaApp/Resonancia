import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { SessionActionsSheet } from "@/components/SessionActionsSheet";
import { SessionRow } from "@/components/SessionRow";
import { SESSIONS, type Session } from "@/data/sessions";
import { getTemaById } from "@/data/temas";
import { useColors } from "@/hooks/useColors";
const H_PAD = 20;

export default function TemaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [actionsSession, setActionsSession] = useState<Session | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const tema = getTemaById(id ?? "");
  if (!tema) return null;

  const sessions = tema.themeTagMatch
    ? SESSIONS.filter(
        (s) =>
          Array.isArray(s.themeTag) &&
          s.themeTag.includes(tema.themeTagMatch as never),
      )
    : [];

  const displaySessions =
    sessions.length > 0
      ? sessions
      : SESSIONS.filter((s) => s.isFeatured || s.isNew).slice(0, 10);

  return (
    <View style={[styles.root, { backgroundColor: "#090F17" }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      {/* Back button */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backBtn,
            {
              backgroundColor: colors.card,
              borderColor: "rgba(182,149,95,0.2)",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 120 }}
      >
        {/* Hero: icon + title + description */}
        <View style={styles.hero}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${tema.color}22` },
            ]}
          >
            <MaterialCommunityIcons
              name={tema.icon}
              size={44}
              color={tema.color}
            />
          </View>

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

        {/* Divider */}
        <View
          style={[
            styles.divider,
            { backgroundColor: "rgba(182,149,95,0.12)" },
          ]}
        />

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
      </ScrollView>

      <SessionActionsSheet
        session={actionsSession}
        visible={actionsSession !== null}
        onClose={() => setActionsSession(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  header: {
    position: "absolute",
    top: 0,
    left: H_PAD,
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  hero: {
    alignItems: "center",
    paddingTop: 96,
    paddingHorizontal: H_PAD,
    paddingBottom: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
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
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  empty: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
