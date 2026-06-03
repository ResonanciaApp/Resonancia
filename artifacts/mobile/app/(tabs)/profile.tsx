import { Feather } from "@expo/vector-icons";
import { File as FSFile, Paths } from "expo-file-system";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { useUserProfile } from "@/context/UserProfileContext";
import { usePlayer } from "@/context/PlayerContext";
import { useMixer } from "@/context/MixerContext";
import { useColors } from "@/hooks/useColors";
import { getSessionById } from "@/data/sessions";
import { usePremium } from "@/context/PremiumContext";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];


function resizeImageForWeb(uri: string, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("no ctx")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = reject;
    img.src = uri;
  });
}

/** Local day key (year-month-day) using device time, for streak grouping */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Count consecutive active days ending today or yesterday */
function computeStreak(events: { playedAt: string }[]): number {
  if (events.length === 0) return 0;
  const days = new Set(events.map((e) => dayKey(new Date(e.playedAt))));
  const today = new Date();
  const todayKey = dayKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yKey = dayKey(yesterday);

  let cursor: Date;
  if (days.has(todayKey)) cursor = today;
  else if (days.has(yKey)) cursor = yesterday;
  else return 0;

  let count = 0;
  const walk = new Date(cursor);
  while (days.has(dayKey(walk))) {
    count++;
    walk.setDate(walk.getDate() - 1);
  }
  return count;
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites, elapsed, history, statEvents, currentSession, isPlaying } = usePlayer();
  const { presets } = useMixer();
  const { isPremium } = usePremium();
  const {
    username,
    lastName,
    location,
    description,
    photoUri,
    updateProfile,
    setPhotoUri,
  } = useUserProfile();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // ── Edit modal state ──────────────────────────────────────────────────────
  const [editVisible, setEditVisible] = useState(false);
  const [editNombre, setEditNombre] = useState(username);
  const [editApellido, setEditApellido] = useState(lastName);
  const [editLocation, setEditLocationLocal] = useState(location);
  const [editDesc, setEditDesc] = useState(description);

  const openEdit = () => {
    setEditNombre(username);
    setEditApellido(lastName);
    setEditLocationLocal(location);
    setEditDesc(description);
    setEditVisible(true);
  };

  const saveEdit = () => {
    updateProfile({
      username: editNombre,
      lastName: editApellido,
      location: editLocation,
      description: editDesc,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditVisible(false);
  };

  // ── Photo picker ──────────────────────────────────────────────────────────
  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso necesario", "Necesitamos acceso a tu galería para cambiar la foto.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const tempUri = result.assets[0].uri;
      if (Platform.OS === "web") {
        try {
          const dataUrl = await resizeImageForWeb(tempUri, 320);
          setPhotoUri(dataUrl);
        } catch {
          setPhotoUri(tempUri);
        }
      } else {
        try {
          const ext = tempUri.split(".").pop()?.split("?")[0] ?? "jpg";
          const src = new FSFile(tempUri);
          const dest = new FSFile(Paths.document, `profile_photo.${ext}`);
          src.copy(dest);
          setPhotoUri(dest.uri);
        } catch {
          setPhotoUri(tempUri);
        }
      }
    }
  };


  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalMinutes = Math.floor(elapsed / 60);

  const stats: {
    label: string;
    value: string;
    icon: FeatherIconName;
    href?: string;
  }[] = [
    {
      label: "Recientes",
      value: history.length.toString(),
      icon: "clock",
      href: "/recientes",
    },
    {
      label: "Minutos",
      value: totalMinutes > 0 ? totalMinutes.toString() : "—",
      icon: "activity",
    },
    {
      label: "Mezclas",
      value: presets.length.toString(),
      icon: "sliders",
      href: "/musica",
    },
  ];

  // ── Favorite sessions ─────────────────────────────────────────────────────
  const favSessions = favorites
    .map((id) => getSessionById(id))
    .filter(Boolean);

  // ── Activity summary (week minutes, top category, top session, streak) ──────
  const activity = useMemo(() => {
    const weekCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let weeklyMinutes = 0;
    const categoryCount = new Map<string, number>();
    const sessionCount = new Map<string, number>();

    for (const e of statEvents) {
      if (new Date(e.playedAt).getTime() >= weekCutoff) {
        weeklyMinutes += e.minutes;
      }
      categoryCount.set(e.categoryLabel, (categoryCount.get(e.categoryLabel) ?? 0) + 1);
      sessionCount.set(e.sessionId, (sessionCount.get(e.sessionId) ?? 0) + 1);
    }

    let topCategory: string | null = null;
    let topCategoryN = 0;
    for (const [label, n] of categoryCount) {
      if (n > topCategoryN) {
        topCategoryN = n;
        topCategory = label;
      }
    }

    let topSessionId: string | null = null;
    let topSessionN = 0;
    for (const [id, n] of sessionCount) {
      if (n > topSessionN) {
        topSessionN = n;
        topSessionId = id;
      }
    }

    const topSession = topSessionId ? getSessionById(topSessionId) : null;
    const streak = computeStreak(statEvents);

    return {
      weeklyMinutes: Math.round(weeklyMinutes),
      topCategory,
      topSession,
      streak,
      hasData: statEvents.length > 0,
    };
  }, [statEvents]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: topPad + 12, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Perfil</Text>
          <Pressable
            onPress={() => router.push("/configuraciones" as never)}
            hitSlop={10}
            style={({ pressed }) => [
              styles.settingsBtn,
              { backgroundColor: colors.card, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Feather name="settings" size={18} color={colors.foreground} />
          </Pressable>
        </View>

        {/* ── Profile Card ── */}
        <View style={[styles.profileCard, { backgroundColor: "rgba(255,255,255,0.05)" }]}>

          {/* Avatar */}
          <Pressable onPress={pickPhoto} style={styles.avatarWrapper}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
                <Feather name="user" size={28} color={colors.primary} />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Feather name="camera" size={11} color="#fff" />
            </View>
          </Pressable>

          {/* Name + details */}
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {username}{lastName ? ` ${lastName}` : ""}
          </Text>

          {location ? (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={12} color={colors.mutedForeground} />
              <Text style={[styles.locationText, { color: colors.mutedForeground }]}>{location}</Text>
            </View>
          ) : null}

          {description ? (
            <Text style={[styles.bioText, { color: colors.mutedForeground }]}>{description}</Text>
          ) : null}

          {/* Editar Detalles button */}
          <Pressable
            onPress={openEdit}
            style={({ pressed }) => [styles.editBtn, { opacity: pressed ? 0.75 : 1 }]}
          >
            <Feather name="edit-2" size={13} color={colors.primary} />
            <Text style={[styles.editBtnText, { color: colors.primary }]}>Editar Detalles</Text>
          </Pressable>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          {stats.map((stat) => {
            const content = (
              <>
                <Feather name={stat.icon} size={18} color={colors.accent} style={styles.statIcon} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
              </>
            );
            if (stat.href) {
              return (
                <Pressable
                  key={stat.label}
                  onPress={() => router.push(stat.href as never)}
                  style={({ pressed }) => [
                    styles.statCard,
                    { backgroundColor: "#090E17", opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  {content}
                </Pressable>
              );
            }
            return (
              <View
                key={stat.label}
                style={[styles.statCard, { backgroundColor: "#090E17" }]}
              >
                {content}
              </View>
            );
          })}
        </View>

        {/* ── Racha ── */}
        <View style={[styles.streakCard, { backgroundColor: "#090E17" }]}>
          <View style={styles.streakFlame}>
            <Text style={styles.streakEmoji}>{activity.streak > 0 ? "🔥" : "✨"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.streakValue, { color: colors.foreground }]}>
              {activity.streak > 0
                ? `${activity.streak} día${activity.streak !== 1 ? "s" : ""} seguidos`
                : "Comienza tu racha"}
            </Text>
            <Text style={[styles.streakSub, { color: colors.mutedForeground }]}>
              {activity.streak > 0
                ? "Sigue así, no pierdas tu constancia"
                : "Escucha una sesión hoy para empezar"}
            </Text>
          </View>
        </View>

        {/* ── Mi viaje ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mi viaje</Text>
          {activity.hasData ? (
            <View style={[styles.journeyCard, { backgroundColor: "#090E17" }]}>
              <View style={styles.journeyRow}>
                <Feather name="clock" size={16} color={colors.accent} />
                <Text style={[styles.journeyLabel, { color: colors.mutedForeground }]}>Minutos esta semana</Text>
                <Text style={[styles.journeyValue, { color: colors.foreground }]}>{activity.weeklyMinutes}</Text>
              </View>
              <View style={[styles.journeyDivider, { backgroundColor: colors.border }]} />
              <View style={styles.journeyRow}>
                <Feather name="heart" size={16} color={colors.accent} />
                <Text style={[styles.journeyLabel, { color: colors.mutedForeground }]}>Sesión favorita</Text>
                <Text style={[styles.journeyValue, { color: colors.foreground }]} numberOfLines={1}>
                  {activity.topSession?.title ?? "—"}
                </Text>
              </View>
              <View style={[styles.journeyDivider, { backgroundColor: colors.border }]} />
              <View style={styles.journeyRow}>
                <Feather name="bar-chart-2" size={16} color={colors.accent} />
                <Text style={[styles.journeyLabel, { color: colors.mutedForeground }]}>Categoría más escuchada</Text>
                <Text style={[styles.journeyValue, { color: colors.foreground }]} numberOfLines={1}>
                  {activity.topCategory ?? "—"}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.emptyFav, { backgroundColor: "#090E17" }]}>
              <Feather name="compass" size={22} color={"rgba(198,155,79,0.3)"} />
              <Text style={[styles.emptyFavText, { color: colors.mutedForeground }]}>
                Tu viaje empieza con la primera sesión.{"\n"}Aquí verás tus minutos, sesión favorita y más.
              </Text>
            </View>
          )}
        </View>

        {/* ── Mis herramientas ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mis herramientas</Text>
          <View style={[styles.journeyCard, { backgroundColor: "#090E17" }]}>
            <Pressable
              onPress={() => router.push("/diario" as never)}
              style={({ pressed }) => [styles.journeyRow, { opacity: pressed ? 0.75 : 1 }]}
            >
              <Feather name="feather" size={16} color={colors.accent} />
              <Text style={[styles.journeyLabel, { color: colors.foreground }]}>Mi Diario</Text>
              <Feather name="chevron-right" size={16} color={colors.border} />
            </Pressable>
            <View style={[styles.journeyDivider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={() => router.push("/respiracion" as never)}
              style={({ pressed }) => [styles.journeyRow, { opacity: pressed ? 0.75 : 1 }]}
            >
              <Feather name="wind" size={16} color={colors.accent} />
              <Text style={[styles.journeyLabel, { color: colors.foreground }]}>Ejercicios de respiración</Text>
              <Feather name="chevron-right" size={16} color={colors.border} />
            </Pressable>
          </View>
        </View>

        {/* ── Membresía ── */}
        <Pressable
          onPress={() => router.push("/membresia" as never)}
          style={({ pressed }) => [
            styles.membershipRow,
            {
              backgroundColor: isPremium ? "transparent" : colors.card,
              borderColor: isPremium ? "#A97A34" : colors.border,
              opacity: pressed ? 0.85 : 1,
              overflow: "hidden",
            },
          ]}
        >
          {isPremium && (
            <LinearGradient
              colors={["#1B4A38", "#0A2018"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
            />
          )}
          {isPremium ? (
            <Image
              source={require("../../assets/images/estrella-premium.png")}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
            />
          ) : (
            <Feather name="user" size={18} color={colors.mutedForeground} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.membershipPlan, { color: isPremium ? "#EDE7DA" : colors.foreground }]}>
              {isPremium ? "Plan Premium" : "Plan Free"}
            </Text>
            <Text style={[styles.membershipSub, { color: isPremium ? "#D5C8B2" : colors.mutedForeground }]}>
              {isPremium ? "Acceso completo activo" : "Acceso limitado al catálogo"}
            </Text>
          </View>
          <Text style={[styles.membershipAction, { color: isPremium ? "#C69B4F" : colors.primary }]}>
            {isPremium ? "Gestionar" : "Mejorar"}
          </Text>
          <Feather name="chevron-right" size={16} color={isPremium ? "#C69B4F" : colors.primary} />
        </Pressable>

        {!isPremium && (
          <Pressable onPress={() => router.push("/membresia" as never)} style={styles.premiumBanner}>
            <LinearGradient
              colors={["#0D261D", "#06150F"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            />
            <View style={styles.premiumGlow} />
            <View style={styles.premiumLeft}>
              <View style={styles.premiumTitleRow}>
                <Image source={require("../../assets/images/estrella-premium.png")} style={{ width: 13, height: 13, marginRight: 6 }} contentFit="contain" />
                <Text style={[styles.premiumTitle, { color: "#EDE7DA" }]}>Prueba Premium</Text>
              </View>
              <Text style={[styles.premiumSub, { color: "#D5C8B2", marginBottom: 10 }]}>
                Lleva tu relajación al siguiente nivel y accede a:
              </Text>
              {[
                { icon: "headphones", text: "+500 meditaciones" },
                { icon: "music",      text: "+50 Música y sonidos relajantes" },
                { icon: "users",      text: "Muro general de la comunidad" },
              ].map((f) => (
                <View key={f.text} style={styles.premiumFeatureRow}>
                  <Feather name={f.icon as never} size={11} color="#C69B4F" />
                  <Text style={[styles.premiumFeatureText, { color: "#D5C8B2" }]}>{f.text}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.premiumBadge, { backgroundColor: "#17352A", borderColor: "#A97A34" }]}>
              <Image source={require("../../assets/images/estrella-premium.png")} style={{ width: 20, height: 20 }} contentFit="contain" />
            </View>
          </Pressable>
        )}

        {/* ── Favoritos ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mis Favoritos</Text>
          {favSessions.length === 0 ? (
            <View style={[styles.emptyFav, { backgroundColor: "#090E17" }]}>
              <Feather name="heart" size={22} color={"rgba(198,155,79,0.3)"} />
              <Text style={[styles.emptyFavText, { color: colors.mutedForeground }]}>
                Aún no has guardado sesiones.{"\n"}Toca ❤️ en cualquier sesión para guardarla aquí.
              </Text>
            </View>
          ) : (
            favSessions.map((s) => {
              if (!s) return null;
              const playing = currentSession?.id === s.id && isPlaying;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => router.push(`/session/${s.id}` as never)}
                  style={({ pressed }) => [
                    styles.favRow,
                    { backgroundColor: "rgba(255,255,255,0.05)", opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Image source={s.image as never} style={styles.favImg} contentFit="cover" />
                  <View style={styles.favInfo}>
                    <Text style={[styles.favTitle, { color: colors.foreground }]} numberOfLines={1}>{s.title}</Text>
                    <Text style={[styles.favSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {s.categoryLabel} · {s.durationLabel}
                    </Text>
                  </View>
                  {playing ? (
                    <Feather name="volume-2" size={16} color={colors.primary} />
                  ) : (
                    <Feather name="chevron-right" size={16} color={colors.border} />
                  )}
                </Pressable>
              );
            })
          )}
        </View>

        <Text style={[styles.footer, { color: colors.border }]}>
          RESONANCE · Sonidos que te regresan a ti mismo.
        </Text>
      </ScrollView>

      {/* ── Edit Details Modal ── */}
      <Modal
        visible={editVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalRoot, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Modal header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
            <Pressable onPress={() => setEditVisible(false)} hitSlop={12}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Editar Detalles</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.modalForm}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ModalField
              label="Nombre"
              value={editNombre}
              onChangeText={setEditNombre}
              placeholder="Tu nombre"
              colors={colors}
            />
            <ModalField
              label="Apellido"
              value={editApellido}
              onChangeText={setEditApellido}
              placeholder="Tu apellido"
              colors={colors}
            />
            <ModalField
              label="Locación"
              value={editLocation}
              onChangeText={setEditLocationLocal}
              placeholder="Ciudad, País"
              colors={colors}
              icon="map-pin"
            />
            <ModalField
              label="Descripción"
              value={editDesc}
              onChangeText={setEditDesc}
              placeholder="Cuéntanos un poco sobre ti..."
              colors={colors}
              multiline
            />

            <Pressable
              onPress={saveEdit}
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
              ]}
            >
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Guardar</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Modal field component ────────────────────────────────────────────────────

function ModalField({ label, value, onChangeText, placeholder, colors, icon, multiline }: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  icon?: React.ComponentProps<typeof Feather>["name"];
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[
        styles.fieldBox,
        { borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.04)" },
        multiline && { minHeight: 90, alignItems: "flex-start" },
      ]}>
        {icon && <Feather name={icon} size={15} color={colors.mutedForeground} style={{ marginTop: multiline ? 2 : 0 }} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.fieldInput, { color: colors.foreground }, multiline && { textAlignVertical: "top", paddingTop: 2 }]}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          returnKeyType={multiline ? "default" : "next"}
        />
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  header: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Profile card
  profileCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 20,
    gap: 6,
  },
  avatarWrapper: { position: "relative", marginBottom: 8 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#B6955F",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#060A0F",
  },
  userName: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 12 },
  bioText: { fontSize: 13, lineHeight: 19, textAlign: "center", paddingHorizontal: 8, fontStyle: "italic" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 6,
  },
  editBtnText: { fontSize: 13, fontWeight: "600" },

  // Stats
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 18, padding: 16, alignItems: "center" },
  statIcon: { marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: "700", marginBottom: 2 },
  statLabel: { fontSize: 11, letterSpacing: 0.5 },

  // Racha
  streakCard: {
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  streakFlame: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(198,155,79,0.12)" },
  streakEmoji: { fontSize: 22 },
  streakValue: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  streakSub: { fontSize: 12 },

  // Mi viaje
  journeyCard: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 4 },
  journeyRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  journeyLabel: { flex: 1, fontSize: 13 },
  journeyValue: { fontSize: 14, fontWeight: "600", maxWidth: "45%", textAlign: "right" },
  journeyDivider: { height: StyleSheet.hairlineWidth, opacity: 0.5 },

  // Membresía
  membershipRow: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  membershipPlan: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  membershipSub: { fontSize: 12 },
  membershipAction: { fontSize: 13, fontWeight: "600" },

  // Premium
  premiumBanner: {
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(169,122,52,0.45)",
  },
  premiumGlow: {
    position: "absolute",
    top: -20,
    left: -20,
    width: 100,
    height: 60,
    borderRadius: 50,
    backgroundColor: "rgba(35,66,54,0.5)",
  },
  premiumLeft: { flex: 1 },
  premiumTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  premiumTitle: { fontSize: 15, fontWeight: "700" },
  premiumSub: { fontSize: 12, lineHeight: 17 },
  premiumFeatureRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  premiumFeatureText: { fontSize: 11, lineHeight: 16 },
  premiumBadge: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  // Favoritos
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  emptyFav: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  emptyFavText: { fontSize: 13, lineHeight: 20, textAlign: "center" },
  favRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 10,
    gap: 12,
    marginBottom: 10,
  },
  favImg: { width: 52, height: 52, borderRadius: 10 },
  favInfo: { flex: 1 },
  favTitle: { fontSize: 14, fontWeight: "600", marginBottom: 3 },
  favSub: { fontSize: 12 },

  // Menu
  menuCard: {
    borderRadius: 18,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500" },

  footer: { textAlign: "center", fontSize: 11, letterSpacing: 1, marginBottom: 8 },

  // Edit modal
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  modalForm: { padding: 24, gap: 20, paddingBottom: 60 },

  // Modal fields
  fieldWrap: { gap: 7 },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  fieldInput: { flex: 1, fontSize: 15, backgroundColor: "transparent" },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  saveBtnText: { fontSize: 16, fontWeight: "700" },
});
