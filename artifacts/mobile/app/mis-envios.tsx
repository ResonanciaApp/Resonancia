import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useGetMySubmissions,
  getGetMySubmissionsQueryKey,
  type Submission,
} from "@workspace/api-client-react";

import { SacredBackground } from "@/components/SacredBackground";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const STATUS_META: Record<
  Submission["status"],
  { label: string; icon: keyof typeof Feather.glyphMap; color: string }
> = {
  draft: { label: "Borrador", icon: "edit-3", color: "#c2c2c2" },
  pending: { label: "En revisión", icon: "clock", color: "#dad4ec" },
  published: { label: "Publicado", icon: "check-circle", color: "#5FAE7A" },
  rejected: { label: "Rechazado", icon: "x-circle", color: "#C46A6A" },
};

export default function MisEnviosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { isCreator } = useAuth();
  const q = useGetMySubmissions({
    query: { enabled: isCreator, queryKey: getGetMySubmissionsQueryKey() },
  });
  const submissions = q.data?.submissions ?? [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar hidden />
      <SacredBackground />
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPad + 8,
          paddingBottom: bottomPad + 40,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Mis envíos</Text>
          <Pressable onPress={() => router.push("/crear-contenido" as never)} hitSlop={12}>
            <Feather name="plus" size={22} color={colors.primary} />
          </Pressable>
        </View>

        {!isCreator ? (
          <Empty
            colors={colors}
            icon="lock"
            text="Esta sección es para creadores verificados."
          />
        ) : q.isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : submissions.length === 0 ? (
          <Empty
            colors={colors}
            icon="inbox"
            text="Todavía no enviaste contenido. Tocá + para subir tu primera pieza."
          />
        ) : (
          submissions.map((s) => {
            const meta = STATUS_META[s.status];
            return (
              <View
                key={s.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.cardTop}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {s.title}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: meta.color + "22" }]}>
                    <Feather name={meta.icon} size={12} color={meta.color} />
                    <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {s.categoryLabel} · {s.durationLabel}
                </Text>
                {s.status === "rejected" && s.rejectionReason ? (
                  <View style={[styles.reasonBox, { backgroundColor: "#C46A6A18", borderColor: "#C46A6A44" }]}>
                    <Text style={[styles.reasonLabel, { color: "#C46A6A" }]}>Motivo del rechazo</Text>
                    <Text style={[styles.reasonText, { color: colors.foreground }]}>
                      {s.rejectionReason}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function Empty({
  colors,
  icon,
  text,
}: {
  colors: ReturnType<typeof useColors>;
  icon: keyof typeof Feather.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.empty}>
      <Feather name={icon} size={36} color={colors.mutedForeground} />
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    height: 40,
  },
  screenTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700" },
  loading: { paddingTop: 60, alignItems: "center" },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  cardTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", flex: 1 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: "Manrope", fontSize: 11, fontWeight: "700" },
  cardSub: { fontFamily: "Manrope", fontSize: 13, marginTop: 6 },
  reasonBox: { borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 12 },
  reasonLabel: { fontFamily: "Manrope", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  reasonText: { fontFamily: "Manrope", fontSize: 13, lineHeight: 19, marginTop: 4 },
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32, gap: 14 },
  emptyText: { fontFamily: "Manrope", fontSize: 14, textAlign: "center", lineHeight: 21 },
});
