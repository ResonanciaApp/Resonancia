import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

import { useGetTopMessage } from "@workspace/api-client-react";
import { SacredBackground } from "@/components/SacredBackground";
import { useUserProfile } from "@/context/UserProfileContext";
import { usePlayer } from "@/context/PlayerContext";
import { getSessionById, SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

const PURPLE_GRAD: [string, string] = ["#5C1A3A", "#3A0D22"];
const PURPLE = "#D4709A";

const SETTINGS: { icon: FeatherIconName; label: string; sub: string }[] = [
  { icon: "bell", label: "Recordatorios Diarios", sub: "Define tu horario de práctica" },
  { icon: "moon", label: "Temporizador de Sueño", sub: "Detener al finalizar la sesión" },
  { icon: "download", label: "Biblioteca Sin Conexión", sub: "Descarga para escuchar offline" },
  { icon: "volume-2", label: "Calidad de Audio", sub: "Alta fidelidad · Sin pérdidas" },
  { icon: "globe", label: "Idioma", sub: "Español" },
  { icon: "shield", label: "Privacidad", sub: "Tus datos, protegidos" },
  { icon: "info", label: "Acerca de RESONANCE", sub: "Versión 1.0.0" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites, elapsed, playSession, currentSession, isPlaying } = usePlayer();
  const {
    username,
    lastName,
    location,
    description,
    photoUri,
    earnedCrowns,
    sentMessageIds,
    updateProfile,
    setPhotoUri,
    checkAndAwardCrown,
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
      setPhotoUri(result.assets[0].uri);
    }
  };

  // ── Rewards ───────────────────────────────────────────────────────────────
  const { data: topData } = useGetTopMessage({
    query: { refetchInterval: 5 * 60_000, queryKey: ["top-message"] },
  });
  const topMessage = topData?.message ?? null;
  const isTopOwner = topMessage !== null && sentMessageIds.includes(topMessage.id);

  useEffect(() => {
    if (topMessage?.id != null) checkAndAwardCrown(topMessage.id);
  }, [topMessage?.id]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalMinutes = Math.floor(elapsed / 60);
  const favCount = favorites.length;

  const stats = [
    { label: "Sesiones", value: SESSIONS.length.toString(), icon: "disc" as FeatherIconName },
    { label: "Minutos", value: totalMinutes > 0 ? totalMinutes.toString() : "—", icon: "clock" as FeatherIconName },
    { label: "Guardadas", value: favCount.toString(), icon: "heart" as FeatherIconName },
  ];

  // ── Favorite sessions ─────────────────────────────────────────────────────
  const favSessions = favorites
    .map((id) => getSessionById(id))
    .filter(Boolean);

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
        </View>

        {/* ── Profile Card ── */}
        <View style={[styles.profileCard, { borderColor: "rgba(198,155,79,0.2)" }]}>
          <LinearGradient
            colors={["rgba(198,155,79,0.1)", "rgba(60,36,21,0.5)"]}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          />

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
            style={({ pressed }) => [styles.editBtn, { borderColor: "rgba(198,155,79,0.4)", opacity: pressed ? 0.75 : 1 }]}
          >
            <Feather name="edit-2" size={13} color={colors.primary} />
            <Text style={[styles.editBtnText, { color: colors.primary }]}>Editar Detalles</Text>
          </Pressable>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={stat.icon} size={18} color={colors.accent} style={styles.statIcon} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Premium Banner ── */}
        <View style={[styles.premiumBanner, { borderColor: "rgba(198,155,79,0.3)" }]}>
          <LinearGradient
            colors={["rgba(198,155,79,0.15)", "rgba(36,22,15,0.8)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          />
          <View style={styles.premiumLeft}>
            <Text style={[styles.premiumTitle, { color: colors.foreground }]}>RESONANCE Premium</Text>
            <Text style={[styles.premiumSub, { color: colors.mutedForeground }]}>
              Accede a todas las sesiones, modo offline y más
            </Text>
          </View>
          <View style={[styles.premiumBadge, { backgroundColor: colors.primary }]}>
            <Feather name="star" size={14} color={colors.primaryForeground} />
          </View>
        </View>

        {/* ── Favoritos ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mis Favoritos</Text>
          {favSessions.length === 0 ? (
            <View style={[styles.emptyFav, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                    { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
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

        {/* ── Mensajes del Alma — Recompensas ── */}
        <View style={[styles.rewardsCard, { borderColor: "rgba(212,112,154,0.25)" }]}>
          <LinearGradient
            colors={PURPLE_GRAD}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <View style={styles.rewardsHeader}>
            <View style={styles.rewardsHeaderLeft}>
              <View style={styles.rewardsIconBg}>
                <Feather name="award" size={16} color="#FFD6EB" />
              </View>
              <View>
                <Text style={styles.rewardsTitle}>Mensajes del Alma</Text>
                <Text style={styles.rewardsSub}>Voz más resonada del día</Text>
              </View>
            </View>
            {earnedCrowns > 0 && (
              <View style={styles.crownsBadge}>
                <Text style={styles.crownsEmoji}>👑</Text>
                <Text style={styles.crownsCount}>{earnedCrowns}</Text>
              </View>
            )}
          </View>
          {topMessage ? (
            <View style={{ marginBottom: 14 }}>
              {isTopOwner && (
                <View style={styles.ownerBanner}>
                  <Text style={styles.ownerEmoji}>👑</Text>
                  <Text style={styles.ownerText}>¡Tu voz resonó más hoy!</Text>
                </View>
              )}
              <View style={[styles.topMessageCard, { borderColor: isTopOwner ? `${PURPLE}60` : "rgba(255,214,235,0.15)" }]}>
                <Text style={styles.topMessageText}>"{topMessage.content}"</Text>
                <View style={styles.topMessageMeta}>
                  <Feather name="heart" size={11} color={PURPLE} />
                  <Text style={styles.topMessageLikes}>{topMessage.likes} me gusta</Text>
                  {isTopOwner && (
                    <View style={styles.tuMensajeBadge}>
                      <Text style={styles.tuMensajeText}>tu mensaje</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noTopMessage}>
              <Text style={styles.noTopText}>Aún no hay mensajes hoy.</Text>
              <Text style={styles.noTopHint}>¡Sé el primero en compartir desde el corazón!</Text>
            </View>
          )}
          <View style={styles.rewardsFooter}>
            <Feather name="star" size={11} color="rgba(255,214,235,0.5)" />
            <Text style={styles.rewardsFooterText}>
              {earnedCrowns === 0
                ? "Comparte y logra tener el mensaje más amado del día para ganar coronas"
                : `Has ganado ${earnedCrowns} ${earnedCrowns === 1 ? "corona" : "coronas"} por ser la voz más resonada`}
            </Text>
          </View>
        </View>

        {/* ── Settings ── */}
        <View style={styles.settingsSection}>
          <Text style={[styles.settingsTitle, { color: colors.mutedForeground }]}>AJUSTES</Text>
          {SETTINGS.map((item, i) => (
            <View
              key={item.label}
              style={[styles.settingRow, { borderBottomColor: colors.border, borderBottomWidth: i < SETTINGS.length - 1 ? 1 : 0 }]}
            >
              <View style={[styles.settingIconBg, { backgroundColor: colors.card }]}>
                <Feather name={item.icon} size={16} color={colors.accent} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.settingSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.border} />
            </View>
          ))}
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

  header: { marginBottom: 20 },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5 },

  // Profile card
  profileCard: {
    borderRadius: 24,
    borderWidth: 1,
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
    backgroundColor: "#C69B4F",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#18110C",
  },
  userName: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 12 },
  bioText: { fontSize: 13, lineHeight: 19, textAlign: "center", paddingHorizontal: 8, fontStyle: "italic" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 6,
  },
  editBtnText: { fontSize: 13, fontWeight: "600" },

  // Stats
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 16, alignItems: "center" },
  statIcon: { marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: "700", marginBottom: 2 },
  statLabel: { fontSize: 11, letterSpacing: 0.5 },

  // Premium
  premiumBanner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 24,
    gap: 14,
  },
  premiumLeft: { flex: 1 },
  premiumTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  premiumSub: { fontSize: 12, lineHeight: 17 },
  premiumBadge: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  // Favoritos
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  emptyFav: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  emptyFavText: { fontSize: 13, lineHeight: 20, textAlign: "center" },
  favRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 12,
    marginBottom: 10,
  },
  favImg: { width: 52, height: 52, borderRadius: 10 },
  favInfo: { flex: 1 },
  favTitle: { fontSize: 14, fontWeight: "600", marginBottom: 3 },
  favSub: { fontSize: 12 },

  // Rewards
  rewardsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 24,
    padding: 18,
  },
  rewardsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  rewardsHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rewardsIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  rewardsTitle: { color: "#FFD6EB", fontSize: 14, fontWeight: "700" },
  rewardsSub: { color: "rgba(255,214,235,0.65)", fontSize: 11, marginTop: 1 },
  crownsBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  crownsEmoji: { fontSize: 13 },
  crownsCount: { color: "#FFD6EB", fontSize: 13, fontWeight: "700" },
  ownerBanner: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  ownerEmoji: { fontSize: 16 },
  ownerText: { color: "#FFD6EB", fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
  topMessageCard: { borderWidth: 1, borderRadius: 14, padding: 14, backgroundColor: "rgba(0,0,0,0.25)" },
  topMessageText: { color: "rgba(255,214,235,0.9)", fontSize: 13, lineHeight: 20, fontStyle: "italic", marginBottom: 8 },
  topMessageMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  topMessageLikes: { color: PURPLE, fontSize: 11, fontWeight: "600", flex: 1 },
  tuMensajeBadge: { backgroundColor: `${PURPLE}30`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  tuMensajeText: { color: PURPLE, fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  noTopMessage: { paddingVertical: 12, alignItems: "center", gap: 4, marginBottom: 8 },
  noTopText: { color: "rgba(255,214,235,0.7)", fontSize: 13 },
  noTopHint: { color: "rgba(255,214,235,0.45)", fontSize: 11, textAlign: "center" },
  rewardsFooter: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderTopWidth: 1, borderTopColor: "rgba(255,214,235,0.12)", paddingTop: 12 },
  rewardsFooterText: { color: "rgba(255,214,235,0.5)", fontSize: 11, lineHeight: 16, flex: 1 },

  // Settings
  settingsSection: { marginBottom: 32 },
  settingsTitle: { fontSize: 11, letterSpacing: 1.5, fontWeight: "700", marginBottom: 12 },
  settingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 14 },
  settingIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: "500", marginBottom: 2 },
  settingSub: { fontSize: 12 },

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
