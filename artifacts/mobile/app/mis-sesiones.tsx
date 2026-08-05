/**
 * Pantalla "Mis sesiones" — lista completa de sesiones en vivo
 * reservadas por el usuario (próximas + pasadas).
 * Acceso: cajón de navegación / link "Ver todas" desde Inicio.
 */
import { Feather } from "@expo/vector-icons";
import { GhostPill } from "@/components/GhostPill";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useBackOverride } from "@/context/BackOverrideContext";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image as ExpoImage } from "expo-image";

import {
  getGetMyLiveSessionsQueryKey,
  useGetMyLiveSessions,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getGuide } from "@/data/guides";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { LiveSessionCard } from "@/components/LiveSessionCard";
import {
  type LiveSessionItem,
  canEnterLiveSession,
  formatLiveSessionDate,
} from "@/hooks/useLiveSessions";

// ── Paleta ────────────────────────────────────────────────────────────────────
const WARM_BLACK = "#1B060F";
const PRIMARY_GOLD = "#dad4ec";
const FOREGROUND = "#F9F9F9";
const MUTED = "#F4F4F4";
const BORDER = "rgba(255,255,255,0.1)";

export default function MisSesionesScreen() {
  const goBack = useBackOverride();
  const insets = useSafeAreaInsets();
  const { theme: sceneTheme } = useSceneTheme();
  const { isSignedIn, isRegistered, authLoading } = useAuth();
  const authenticated = isSignedIn || isRegistered;

  const { data, isLoading, refetch, isRefetching } = useGetMyLiveSessions({
    query: {
      queryKey: getGetMyLiveSessionsQueryKey(),
      enabled: !!authenticated,
      staleTime: 2 * 60_000,
    },
  });

  const now = Date.now();
  const all = (data?.sessions ?? []) as LiveSessionItem[];

  const upcoming = all
    .filter(
      (s) =>
        s.status !== "cancelled" &&
        s.status !== "completed" &&
        new Date(s.scheduledAt).getTime() > now
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );

  const past = all
    .filter(
      (s) =>
        s.status === "completed" ||
        (s.status !== "cancelled" && new Date(s.scheduledAt).getTime() <= now)
    )
    .sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );

  const handleEnter = useCallback((s: LiveSessionItem) => {
    router.push({
      pathname: "/sesion-vivo/[id]" as never,
      params: {
        id: String(s.id),
        roomUrl: s.dailyRoomUrl ?? "",
        guideDisplayName: s.guideDisplayName ?? "",
      },
    } as never);
  }, []);

  const topPad = insets.top + 8;
  const bottomPad = insets.bottom + 24;

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <LinearGradient colors={sceneTheme.gradient} style={StyleSheet.absoluteFill} />

      {/* Floating back */}
      <View style={{ position: "absolute", left: 16, top: topPad + 8, zIndex: 10 }} pointerEvents="box-none">
        <GhostPill>
          <Pressable onPress={goBack ?? (() => router.back())} hitSlop={10} style={{ paddingHorizontal: 12, paddingVertical: 8, alignItems: "center", justifyContent: "center" }}>
            <Feather name="arrow-left" size={16} color="#FFFFFF" />
          </Pressable>
        </GhostPill>
      </View>

      {/* Page title */}
      <Text style={{ fontSize: 30, fontWeight: "700", color: FOREGROUND, letterSpacing: 0.3, paddingHorizontal: 20, paddingTop: topPad + 60, marginBottom: 8 }}>Mis sesiones</Text>

      {/* Contenido */}
      {authLoading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color={PRIMARY_GOLD} size="large" />
        </View>
      ) : !authenticated ? (
        <View style={styles.emptyContainer}>
          <Feather name="lock" size={40} color={MUTED} />
          <Text style={styles.emptyTitle}>Inicia sesión</Text>
          <Text style={styles.emptyText}>
            Necesitas una cuenta para ver tus sesiones reservadas.
          </Text>
          <Pressable
            style={styles.authBtn}
            onPress={() => router.push("/registro" as never)}
          >
            <LinearGradient
              colors={["#884D80", "#884D80"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.authBtnText}>Crear cuenta</Text>
          </Pressable>
        </View>
      ) : isLoading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color={PRIMARY_GOLD} size="large" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: bottomPad + 24,
            paddingTop: 8,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={PRIMARY_GOLD}
            />
          }
        >
          {/* Próximas */}
          <Text style={styles.sectionLabel}>Próximas</Text>
          {upcoming.length === 0 ? (
            <View style={styles.emptySection}>
              <Feather name="calendar" size={28} color={MUTED} />
              <Text style={styles.emptyText}>No tienes sesiones próximas.</Text>
              <Text style={[styles.emptyText, { fontSize: 12, marginTop: 4 }]}>
                Busca un guiador y reserva tu primera sesión.
              </Text>
            </View>
          ) : (
            upcoming.map((s) => (
              <View key={s.id} style={styles.cardWrap}>
                <LiveSessionCard session={s} onEnter={handleEnter} />
              </View>
            ))
          )}

          {/* Pasadas */}
          {past.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 32 }]}>
                Pasadas
              </Text>
              {past.map((s) => (
                <PastSessionRow key={s.id} session={s} />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ── Fila de sesión pasada ─────────────────────────────────────────────────────
function PastSessionRow({ session }: { session: LiveSessionItem }) {
  const guide = getGuide(session.guideId);
  const dateStr = formatLiveSessionDate(session.scheduledAt);
  const isCompleted = session.status === "completed";

  return (
    <View style={pastStyles.row}>
      <ExpoImage
        source={guide.photo as never}
        style={pastStyles.photo}
        contentFit="cover"
        placeholder={BLUR_PLACEHOLDER}
        transition={IMAGE_TRANSITION}
      />
      <View style={{ flex: 1 }}>
        <Text style={pastStyles.name} numberOfLines={1}>
          {session.guideDisplayName ?? guide.name}
        </Text>
        <Text style={pastStyles.date} numberOfLines={1}>
          {dateStr}
        </Text>
      </View>
      <View
        style={[
          pastStyles.badge,
          { backgroundColor: isCompleted ? "rgba(92,184,92,0.12)" : "transparent", overflow: "hidden" },
        ]}
      >
        {!isCompleted && (
          <>
          </>
        )}
        <Text
          style={[
            pastStyles.badgeText,
            { color: isCompleted ? "#5CB85C" : MUTED },
          ]}
        >
          {isCompleted ? "Completada" : "Pasada"}
        </Text>
      </View>
    </View>
  );
}

const pastStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  photo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  name: { color: FOREGROUND, fontSize: 13, fontFamily: "Manrope", fontWeight: "600" },
  date: { color: MUTED, fontSize: 11, fontFamily: "Manrope", marginTop: 2 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontFamily: "Manrope" },
});

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: FOREGROUND,
    fontSize: 17,
    fontFamily: "Manrope", fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  sectionLabel: {
    color: FOREGROUND,
    fontSize: 13,
    fontFamily: "Manrope", fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    opacity: 0.6,
    marginBottom: 12,
    marginTop: 8,
  },
  cardWrap: { marginBottom: 12 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    gap: 12,
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  emptyTitle: {
    color: FOREGROUND,
    fontSize: 18,
    fontFamily: "Manrope", fontWeight: "600",
  },
  emptyText: {
    color: MUTED,
    fontSize: 14,
    fontFamily: "Manrope",
    textAlign: "center",
    lineHeight: 20,
  },
  authBtn: {
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  authBtnText: {
    color: WARM_BLACK,
    fontSize: 15,
    fontFamily: "Manrope", fontWeight: "600",
  },
});
