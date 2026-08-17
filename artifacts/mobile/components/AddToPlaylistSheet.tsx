import { Feather } from "@expo/vector-icons";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradient, GoldGradientFill } from "@/components/GoldGradient";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";

type Props = {
  visible: boolean;
  sessionId: string;
  onClose: () => void;
};

type Step = "list" | "create";

export function AddToPlaylistSheet({ visible, sessionId, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const { playlists, createPlaylist, addToPlaylist, removeFromPlaylist, isInPlaylist } =
    useFoldersPlaylists();

  const [step, setStep] = useState<Step>("list");
  const [newName, setNewName] = useState("");

  const handleClose = () => {
    setStep("list");
    setNewName("");
    onClose();
  };

  const handleToggle = (playlistId: string) => {
    if (isInPlaylist(playlistId, sessionId)) {
      removeFromPlaylist(playlistId, sessionId);
    } else {
      addToPlaylist(playlistId, sessionId);
    }
  };

  const overlay = useCategoryOverlayOptional();
  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const pl = createPlaylist(name, sessionId);
    handleClose();
    if (overlay) overlay.openCategory(`/playlist/${pl.id}`);
    else router.push(`/playlist/${pl.id}` as never);
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <LinearGradient
          colors={theme.gradient as unknown as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
        />
        {/* ── Paso: Lista de playlists ── */}
        {step === "list" && (
          <>
            {/* Header */}
            <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
              <Pressable onPress={handleClose} style={styles.iconBtn}>
                <Feather name="x" size={22} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.topTitle, { color: colors.foreground }]}>
                Seleccionar una Playlist
              </Text>
              <View style={styles.iconBtn} />
            </View>

            {/* Body */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollContent}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {playlists.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <View style={[styles.emptyIcon, { backgroundColor: "rgba(212,175,55,0.10)" }]}>
                    <Feather name="list" size={36} color={colors.primary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                    Todavía no tenés ningún ritual
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                    Crea tu primer ritual para organizar y reproducir sesiones en secuencia.
                  </Text>
                </View>
              ) : (
                playlists.map((pl) => {
                  const inIt = isInPlaylist(pl.id, sessionId);
                  return (
                    <Pressable
                      key={pl.id}
                      onPress={() => handleToggle(pl.id)}
                      style={({ pressed }) => [
                        styles.row,
                        { borderBottomColor: "rgba(61,14,22,0.40)", opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <View style={[styles.playlistIcon, { backgroundColor: "rgba(212,175,55,0.12)" }]}>
                        <Feather name="list" size={18} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rowLabel, { color: colors.foreground }]} numberOfLines={1}>
                          {pl.name}
                        </Text>
                        <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
                          {pl.sessionIds.length === 0
                            ? "Vacía"
                            : `${pl.sessionIds.length} sesión${pl.sessionIds.length !== 1 ? "es" : ""}`}
                        </Text>
                      </View>
                      {inIt ? (
                        <Feather name="check-circle" size={22} color={colors.primary} />
                      ) : (
                        <Feather name="circle" size={22} color="rgba(255,255,255,0.25)" />
                      )}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            {/* Bottom: crear playlist */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
              <Pressable
                onPress={() => setStep("create")}
                style={({ pressed }) => [styles.createRow, { opacity: pressed ? 0.75 : 1 }]}
              >
                <View style={[styles.plusCircle, { backgroundColor: "#FFFFFF" }]}>
                  <Feather name="plus" size={18} color="#1B060F" />
                </View>
                <Text style={[styles.createLabel, { color: colors.foreground }]}>
                  Crear una Playlist
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* ── Paso: Crear playlist ── */}
        {step === "create" && (
          <View style={{ flex: 1, paddingHorizontal: 20 }}>
            <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
              <Pressable onPress={() => setStep("list")} style={styles.iconBtn}>
                <Feather name="arrow-left" size={22} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.topTitle, { color: colors.foreground }]}>
                Nombre de la Playlist
              </Text>
              <Pressable onPress={handleClose} style={styles.iconBtn}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Ej: Para el sueño, Mañanas…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, {
                color: colors.foreground,
                borderColor: "rgba(61,14,22,0.40)",
                backgroundColor: "rgba(74,12,12,0.08)",
              }]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              maxLength={40}
            />

            <Text style={[styles.inputHint, { color: colors.mutedForeground }]}>
              Los rituales se reproducen en secuencia automáticamente, una sesión tras otra.
            </Text>

            <Pressable
              onPress={handleCreate}
              disabled={!newName.trim()}
              style={({ pressed }) => [
                styles.createBtn,
                {
                  backgroundColor: newName.trim() ? undefined : "rgba(212,175,55,0.30)",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              {newName.trim() ? <GoldGradientFill /> : null}
              <Text style={[styles.createBtnLabel, { color: "#1B060F" }]}>
                Crear Playlist
              </Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(61,14,22,0.40)",
  },
  topTitle: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    flexGrow: 1,
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubtitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  playlistIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "600",
  },
  rowMeta: {
    fontFamily: "Manrope",
    fontSize: 13,
    marginTop: 2,
  },

  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(61,14,22,0.40)",
  },
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 8,
  },
  plusCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  createLabel: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "600",
  },

  input: {
    fontFamily: "Manrope",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
    marginTop: 20,
  },
  inputHint: {
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 24,
  },
  createBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    overflow: "hidden",
    alignItems: "center",
  },
  createBtnLabel: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
  },
});
