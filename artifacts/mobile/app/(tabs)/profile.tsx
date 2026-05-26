import { Feather } from "@expo/vector-icons";
import { File as FSFile, Paths } from "expo-file-system";
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

import { SacredBackground } from "@/components/SacredBackground";
import { useUserProfile } from "@/context/UserProfileContext";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";

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

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites, elapsed, history } = usePlayer();
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
      label: "Favoritos",
      value: favorites.length.toString(),
      icon: "heart",
      href: "/(tabs)/favorites",
    },
  ];

  // ── Menu items (replaces favorites list) ─────────────────────────────────
  const menuPrimary: { label: string; icon: FeatherIconName; href: string }[] = [
    { label: "Membresía", icon: "star", href: "/membresia" },
    { label: "Top 10 Comunidad", icon: "trending-up", href: "/comunidad-top10" },
    { label: "Amigos", icon: "users", href: "/amigos" },
    { label: "Grupos", icon: "message-circle", href: "/grupos" },
  ];
  const menuSecondary: { label: string; icon: FeatherIconName; href: string }[] = [
    { label: "Invitar a un amigo", icon: "user-plus", href: "/invitar" },
    { label: "Ayuda", icon: "help-circle", href: "/ayuda" },
    { label: "Configuraciones", icon: "settings", href: "/configuraciones" },
  ];

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
                    { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  {content}
                </Pressable>
              );
            }
            return (
              <View
                key={stat.label}
                style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                {content}
              </View>
            );
          })}
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

        {/* ── Menú ── */}
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {menuPrimary.map((item, idx) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.href as never)}
              style={({ pressed }) => [
                styles.menuRow,
                idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Feather name={item.icon} size={18} color={colors.accent} />
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Feather name="chevron-right" size={16} color={colors.border} />
            </Pressable>
          ))}
        </View>

        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 14 }]}>
          {menuSecondary.map((item, idx) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.href as never)}
              style={({ pressed }) => [
                styles.menuRow,
                idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Feather name={item.icon} size={18} color={colors.accent} />
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Feather name="chevron-right" size={16} color={colors.border} />
            </Pressable>
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

  // Menu
  menuCard: {
    borderRadius: 18,
    borderWidth: 1,
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
