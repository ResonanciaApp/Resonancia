import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
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
import { SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

// Purple palette from Mensajes del Alma
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
  const { favorites, elapsed } = usePlayer();
  const {
    username,
    photoUri,
    earnedCrowns,
    sentMessageIds,
    setUsername,
    setPhotoUri,
    checkAndAwardCrown,
  } = useUserProfile();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Username editing
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(username);
  const nameRef = useRef<TextInput>(null);

  const startEdit = () => {
    setNameInput(username);
    setEditingName(true);
    setTimeout(() => nameRef.current?.focus(), 80);
  };
  const confirmName = () => {
    setUsername(nameInput);
    setEditingName(false);
  };

  // Photo picker
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

  // Rewards — top message
  const { data: topData } = useGetTopMessage({
    query: { refetchInterval: 5 * 60_000, queryKey: ["top-message"] },
  });
  const topMessage = topData?.message ?? null;
  const isTopOwner = topMessage !== null && sentMessageIds.includes(topMessage.id);

  useEffect(() => {
    if (topMessage?.id != null) {
      checkAndAwardCrown(topMessage.id);
    }
  }, [topMessage?.id]);

  const totalMinutes = Math.floor(elapsed / 60);
  const favCount = favorites.length;
  const sessionCount = SESSIONS.length;

  const stats = [
    { label: "Sesiones", value: sessionCount.toString(), icon: "disc" as FeatherIconName },
    { label: "Minutos", value: totalMinutes > 0 ? totalMinutes.toString() : "—", icon: "clock" as FeatherIconName },
    { label: "Guardadas", value: favCount.toString(), icon: "heart" as FeatherIconName },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 160 + bottomPad,
          paddingTop: topPad + 12,
          paddingHorizontal: 20,
        }}
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
              <Image
                source={{ uri: photoUri }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
                <Feather name="user" size={28} color={colors.primary} />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Feather name="camera" size={11} color="#fff" />
            </View>
          </Pressable>

          {/* Username */}
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                ref={nameRef}
                value={nameInput}
                onChangeText={setNameInput}
                onSubmitEditing={confirmName}
                style={[styles.nameInput, { color: colors.foreground, borderColor: colors.primary }]}
                maxLength={32}
                returnKeyType="done"
                selectTextOnFocus
              />
              <Pressable onPress={confirmName} style={[styles.nameConfirmBtn, { backgroundColor: colors.primary }]}>
                <Feather name="check" size={14} color="#18110C" />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={startEdit} style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.foreground }]}>{username}</Text>
              <Feather name="edit-2" size={13} color={colors.mutedForeground} style={{ marginLeft: 6, marginTop: 3 }} />
            </Pressable>
          )}

          <Text style={[styles.userSub, { color: colors.mutedForeground }]}>
            Viaje Resonance · Casa del Cuenco
          </Text>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather name={stat.icon} size={18} color={colors.accent} style={styles.statIcon} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Mensajes del Alma — Recompensas ── */}
        <View style={[styles.rewardsCard, { borderColor: "rgba(212,112,154,0.25)" }]}>
          <LinearGradient
            colors={PURPLE_GRAD}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          {/* Header */}
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

          {/* Top message */}
          {topMessage ? (
            <View style={styles.topMessageBlock}>
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

          {/* Crowns summary */}
          <View style={styles.rewardsFooter}>
            <Feather name="star" size={11} color="rgba(255,214,235,0.5)" />
            <Text style={styles.rewardsFooterText}>
              {earnedCrowns === 0
                ? "Aún no has ganado coronas — comparte y logra tener el mensaje más amado del día"
                : `Has ganado ${earnedCrowns} ${earnedCrowns === 1 ? "corona" : "coronas"} por ser la voz más resonada`}
            </Text>
          </View>
        </View>

        {/* ── Premium Banner ── */}
        <View style={[styles.premiumBanner, { borderColor: "rgba(198,155,79,0.3)" }]}>
          <LinearGradient
            colors={["rgba(198,155,79,0.15)", "rgba(36,22,15,0.8)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
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

        {/* ── Settings ── */}
        <View style={styles.settingsSection}>
          <Text style={[styles.settingsTitle, { color: colors.mutedForeground }]}>AJUSTES</Text>
          {SETTINGS.map((item, i) => (
            <View
              key={item.label}
              style={[
                styles.settingRow,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth: i < SETTINGS.length - 1 ? 1 : 0,
                },
              ]}
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
    </View>
  );
}

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
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 14,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
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
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
  },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
    width: "100%",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  nameInput: {
    fontSize: 18,
    fontWeight: "600",
    borderBottomWidth: 1.5,
    paddingHorizontal: 8,
    paddingBottom: 4,
    textAlign: "center",
    flex: 1,
    maxWidth: 200,
  },
  nameConfirmBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  userSub: {
    fontSize: 12,
    textAlign: "center",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  statIcon: { marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: "700", marginBottom: 2 },
  statLabel: { fontSize: 11, letterSpacing: 0.5 },

  // Rewards
  rewardsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 20,
    padding: 18,
  },
  rewardsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  rewardsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rewardsIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  rewardsTitle: {
    color: "#FFD6EB",
    fontSize: 14,
    fontWeight: "700",
  },
  rewardsSub: {
    color: "rgba(255,214,235,0.65)",
    fontSize: 11,
    marginTop: 1,
  },
  crownsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  crownsEmoji: { fontSize: 13 },
  crownsCount: {
    color: "#FFD6EB",
    fontSize: 13,
    fontWeight: "700",
  },

  // Top message
  topMessageBlock: { marginBottom: 14 },
  ownerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  ownerEmoji: { fontSize: 16 },
  ownerText: {
    color: "#FFD6EB",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  topMessageCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  topMessageText: {
    color: "rgba(255,214,235,0.9)",
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
    marginBottom: 8,
  },
  topMessageMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  topMessageLikes: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  tuMensajeBadge: {
    backgroundColor: `${PURPLE}30`,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tuMensajeText: {
    color: PURPLE,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  noTopMessage: { paddingVertical: 12, alignItems: "center", gap: 4, marginBottom: 8 },
  noTopText: { color: "rgba(255,214,235,0.7)", fontSize: 13 },
  noTopHint: { color: "rgba(255,214,235,0.45)", fontSize: 11, textAlign: "center" },

  rewardsFooter: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,214,235,0.12)",
    paddingTop: 12,
  },
  rewardsFooterText: {
    color: "rgba(255,214,235,0.5)",
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },

  // Premium
  premiumBanner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 28,
    gap: 14,
  },
  premiumLeft: { flex: 1 },
  premiumTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  premiumSub: { fontSize: 12, lineHeight: 17 },
  premiumBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  // Settings
  settingsSection: { marginBottom: 32 },
  settingsTitle: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  settingIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: "500", marginBottom: 2 },
  settingSub: { fontSize: 12 },

  footer: {
    textAlign: "center",
    fontSize: 11,
    letterSpacing: 0.5,
    paddingBottom: 16,
  },
});
