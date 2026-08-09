import { Feather } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
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
import { SessionCard } from "@/components/SessionCard";
import { SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

export default function MeditaTiempoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 56 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { min, max, label } = useLocalSearchParams<{ min: string; max: string; label: string }>();

  const minDur = Number(min ?? 0);
  const maxDur = Number(max ?? 9999);

  const sessions = SESSIONS.filter((s) => s.duration >= minDur && s.duration <= maxDur);

  const pageTitle = label ? `Medita ${label}` : "Sesiones";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar hidden />
      <SacredBackground />

      {/* Header */}
      <View style={[styles.topBar, { paddingTop: topPad + 6 }]}>
        <BackPill onPress={() => router.back()} size={28} bgColor="rgba(255,255,255,0.10)" iconOffsetX={-1} />
        <View style={styles.titleWrap}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>{pageTitle}</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            {sessions.length} sesión{sessions.length !== 1 ? "es" : ""} disponible{sessions.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Sessions */}
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 + bottomPad, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {sessions.length > 0 ? (
          sessions.map((s) => <SessionCard key={s.id} session={s} horizontal />)
        ) : (
          <View style={styles.empty}>
            <Feather name="clock" size={40} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Sin sesiones por ahora
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Pronto habrá contenido para este tiempo
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  titleWrap: { flex: 1 },
  pageTitle: { fontFamily: "Manrope", fontSize: 24, fontWeight: "700", letterSpacing: 0.3 },
  pageSub: { fontFamily: "Manrope", fontSize: 12, marginTop: 2 },

  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "600" },
  emptySub: { fontFamily: "Manrope", fontSize: 13, textAlign: "center" },
});
