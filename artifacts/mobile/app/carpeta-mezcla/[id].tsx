import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradientFill } from "@/components/GoldGradient";
import React, { useState } from "react";
import {
  Alert,
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

import { type MixFolder, useMixer } from "@/context/MixerContext";
import { useMixerPanel } from "@/context/MixerPanelContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useLoadMix } from "@/hooks/useLoadMix";
import { MixActionsSheet } from "@/components/MixActionsSheet";
import { MixCover } from "@/app/mi-mezcla/[id]";
import { EqualizerBars } from "@/components/EqualizerBars";

const BG_FALLBACK = ["#340D1A", "#190913"] as const;
const GOLD = "#F9F9F9";
const TEXT = "#FAF0EE";
const MUTED = "#c2c2c2";
const SHEET_BG = "#1B060F";

export default function CarpetaMezclaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { theme: sceneTheme, activeSceneId } = useSceneTheme();
  const BG = activeSceneId === "tibet" ? sceneTheme.gradient : BG_FALLBACK;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const {
    mixFolders,
    presets: allMixes,
    deleteMixFolder,
    addMixToFolder,
    removeMixFromFolder,
    addMixFolderToFolder,
    removeMixFolderFromFolder,
    createMixFolder,
    loadedPresetId,
    isPlaying: mixerPlaying,
    openSheet,
    deletePreset,
    duplicatePreset,
  } = useMixer();
  const { openMixer } = useMixerPanel();
  const loadMix = useLoadMix();

  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [nombreCarpetaVisible, setNombreCarpetaVisible] = useState(false);
  const [mixMenuPreset, setMixMenuPreset] = useState<(typeof allMixes)[number] | null>(null);
  const [folderMenuTarget, setFolderMenuTarget] = useState<MixFolder | null>(null);

  const folder = mixFolders.find((f) => f.id === id);

  if (!folder) {
    return (
      <LinearGradient colors={BG} style={styles.root}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Feather name="folder" size={48} color={MUTED} style={{ marginBottom: 16 }} />
          <Text style={{ color: MUTED, fontSize: 16 }}>Carpeta no encontrada</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 24 }}>
            <Text style={{ color: GOLD, fontSize: 15 }}>← Volver</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const folderMixIds = folder.presetIds ?? [];
  const folderMixes = folderMixIds
    .map((mid) => allMixes.find((m) => m.id === mid))
    .filter(Boolean) as typeof allMixes;

  const subFolderIds = folder.subFolderIds ?? [];
  const subFolders = subFolderIds
    .map((fid) => mixFolders.find((f) => f.id === fid))
    .filter(Boolean) as typeof mixFolders;

  const availableMixes = allMixes.filter((m) => !folderMixIds.includes(m.id));

  const handleCreateSubFolder = (name: string) => {
    const sub = createMixFolder(name);
    addMixFolderToFolder(folder.id, sub.id);
    setNombreCarpetaVisible(false);
    router.push(`/carpeta-mezcla/${sub.id}` as never);
  };

  return (
    <LinearGradient style={styles.root} colors={BG} locations={[0, 0.5, 1]}>
      <StatusBar hidden />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <BackPill onPress={() => router.back()} size={28} bgColor="rgba(255,255,255,0.10)" iconOffsetX={-1} style={{ marginLeft: 10 }} />
        <Text style={styles.headerName} numberOfLines={1}>{folder.name}</Text>
        <Pressable
          style={styles.iconBtn}
          hitSlop={10}
          onPress={() => setFolderMenuTarget(folder)}
        >
          <Feather name="more-horizontal" size={22} color={TEXT} />
        </Pressable>
        <Pressable style={styles.iconBtn} hitSlop={10} onPress={() => setAddSheetVisible(true)}>
          <Feather name="plus" size={22} color={TEXT} />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPad + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {subFolders.length === 0 && folderMixes.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Esta carpeta está vacía</Text>
            <Text style={styles.emptySub}>Agrega mezclas o carpetas desde Tu biblioteca.</Text>
          </View>
        ) : (
          <View style={{ paddingTop: 12 }}>
            {/* Subcarpetas */}
            {subFolders.map((sub) => (
              <Pressable
                key={sub.id}
                style={({ pressed }) => [styles.playlistRow, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => router.push(`/carpeta-mezcla/${sub.id}` as never)}
                onLongPress={() => setFolderMenuTarget(sub)}
                delayLongPress={600}
              >
                <View style={styles.plCover}>
                  <Feather name="folder" size={18} color={GOLD} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.plName} numberOfLines={1}>{sub.name}</Text>
                  <Text style={styles.plMeta}>
                    Carpeta · {(sub.subFolderIds ?? []).length + (sub.presetIds ?? []).length} elemento{(sub.subFolderIds ?? []).length + (sub.presetIds ?? []).length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <Pressable
                  onPress={() => removeMixFolderFromFolder(folder.id, sub.id)}
                  hitSlop={10}
                  style={styles.removePlBtn}
                >
                  <Feather name="x" size={16} color={MUTED} />
                </Pressable>
              </Pressable>
            ))}

            {/* Mezclas */}
            {folderMixes.map((mix) => {
              const isPlayingThis = loadedPresetId === mix.id && mixerPlaying;
              return (
                <Pressable
                  key={mix.id}
                  style={({ pressed }) => [styles.playlistRow, { opacity: pressed ? 0.8 : 1 }]}
                  onPress={() => { if (loadedPresetId === mix.id) { openSheet(); } else if (loadMix(mix)) { openSheet(); } }}
                  onLongPress={() => setMixMenuPreset(mix)}
                  delayLongPress={600}
                >
                  <MixCover mix={mix} size={52} radius={6} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.plName} numberOfLines={1}>{mix.name}</Text>
                    {isPlayingThis ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <EqualizerBars color={GOLD} size="sm" />
                        <Text style={[styles.plMeta, { color: GOLD }]}>Reproduciendo</Text>
                      </View>
                    ) : (
                      <Text style={styles.plMeta}>
                        {mix.sounds.length} sonido{mix.sounds.length !== 1 ? "s" : ""}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => removeMixFromFolder(folder.id, mix.id)}
                    hitSlop={10}
                    style={styles.removePlBtn}
                  >
                    <Feather name="x" size={16} color={MUTED} />
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add sheet */}
      <AddSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        availableMixes={availableMixes}
        onAddMix={(mixId) => { addMixToFolder(folder.id, mixId); setAddSheetVisible(false); }}
        onNuevaMezcla={() => { setAddSheetVisible(false); openMixer(); router.navigate("/(tabs)/musica" as never); }}
        onNuevaCarpeta={() => { setAddSheetVisible(false); setTimeout(() => setNombreCarpetaVisible(true), 250); }}
      />

      {/* Naming modal */}
      <NamingModal
        visible={nombreCarpetaVisible}
        title="Ponle un nombre a la carpeta"
        defaultName={`Mi carpeta n.° ${mixFolders.length + 1}`}
        onClose={() => setNombreCarpetaVisible(false)}
        onCreate={handleCreateSubFolder}
      />

      <MixActionsSheet
        mix={mixMenuPreset}
        visible={mixMenuPreset !== null}
        onClose={() => setMixMenuPreset(null)}
        onEdit={(mix) => router.push(`/mi-mezcla/${mix.id}` as never)}
        onDuplicate={(mix) => { setMixMenuPreset(null); duplicatePreset(mix.id); }}
        onDelete={(mix) => deletePreset(mix.id)}
      />

      <MixActionsSheet
        mix={null}
        folder={folderMenuTarget}
        visible={folderMenuTarget !== null}
        onClose={() => setFolderMenuTarget(null)}
        onDuplicate={() => {}}
        onDelete={() => {}}
        onDeleteFolder={(f) => {
          deleteMixFolder(f.id);
          if (f.id === folder.id) router.back();
        }}
      />
    </LinearGradient>
  );
}

// ─── Add sheet ────────────────────────────────────────────────────────────────
function AddSheet({
  visible, onClose, availableMixes, onAddMix, onNuevaMezcla, onNuevaCarpeta,
}: {
  visible: boolean;
  onClose: () => void;
  availableMixes: ReturnType<typeof useMixer>["presets"];
  onAddMix: (mixId: string) => void;
  onNuevaMezcla: () => void;
  onNuevaCarpeta: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { activeSceneId } = useSceneTheme();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: bottomPad, maxHeight: "70%", backgroundColor: "#2d4081" }]}>
        <View style={styles.sheetHandle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Pressable
            style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.75 : 1 }]}
            onPress={onNuevaMezcla}
          >
            <View style={styles.sheetIconWrap}>
              <MaterialCommunityIcons name="tune-variant" size={22} color="#f9f9f9" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetItemTitle}>Crea una mezcla</Text>
              <Text style={styles.sheetItemSub}>Ve al Mezclador para armar una nueva</Text>
            </View>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.75 : 1 }]}
            onPress={onNuevaCarpeta}
          >
            <View style={styles.sheetIconWrap}>
              <Feather name="folder" size={22} color="#f9f9f9" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetItemTitle}>Nueva carpeta</Text>
              <Text style={styles.sheetItemSub}>Crea una subcarpeta dentro de esta</Text>
            </View>
          </Pressable>
          {availableMixes.length === 0 ? (
            <Text style={[styles.sheetItemSub, { paddingHorizontal: 20, paddingVertical: 16 }]}>
              No tienes otras mezclas para agregar.
            </Text>
          ) : (
            availableMixes.map((mix) => (
              <Pressable
                key={mix.id}
                style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.75 : 1 }]}
                onPress={() => onAddMix(mix.id)}
              >
                <MixCover mix={mix} size={44} radius={6} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetItemTitle} numberOfLines={1}>{mix.name}</Text>
                  <Text style={styles.sheetItemSub}>
                    {mix.sounds.length} sonido{mix.sounds.length !== 1 ? "s" : ""}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Naming modal ─────────────────────────────────────────────────────────────
function NamingModal({
  visible, title, defaultName, onClose, onCreate,
}: {
  visible: boolean; title: string; defaultName: string;
  onClose: () => void; onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const inputRef = React.useRef<TextInput>(null);

  React.useEffect(() => {
    if (visible) setName(defaultName);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = () => {
    onCreate(name.trim() || defaultName);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      onShow={() => setTimeout(() => inputRef.current?.focus(), 80)}
    >
      <View style={styles.nameOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.nameCard, { backgroundColor: "#2d4081" }]}>
          <Pressable style={styles.nameCloseBtn} onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={TEXT} />
          </Pressable>
          <Text style={styles.nameCardTitle}>{title}</Text>
          <View style={styles.nameInputWrap}>
            <TextInput
              ref={inputRef}
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              placeholderTextColor={MUTED}
            />
          </View>
          <Pressable
            style={({ pressed }) => [styles.nameCreateBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleCreate}
          >
            <GoldGradientFill />
            <Text style={styles.nameCreateBtnText}>Crear</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerName: {
    fontFamily: "Manrope",
    flex: 1,
    color: TEXT,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 180,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySub: {
    fontFamily: "Manrope",
    color: MUTED,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  // Row
  playlistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(61,14,22,0.40)",
  },
  plCover: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "rgba(212,175,55,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  plName: { fontFamily: "Manrope", color: TEXT, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  plMeta: { fontFamily: "Manrope", color: MUTED, fontSize: 12, marginTop: 2 },
  removePlBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },

  // Sheet
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 6,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginBottom: 8,
    marginTop: 4,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  sheetIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetItemTitle: { fontFamily: "Manrope", color: TEXT, fontSize: 16, fontWeight: "700" },
  sheetItemSub: { fontFamily: "Manrope", color: "#f4f4f4", fontSize: 13, marginTop: 2 },

  // Naming modal
  nameOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  nameCard: {
    width: "100%",
    backgroundColor: "#190913",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.15)",
  },
  nameCloseBtn: { alignSelf: "flex-end", marginBottom: 8 },
  nameCardTitle: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  nameInputWrap: {
    width: "100%",
    backgroundColor: "rgba(74,12,12,0.08)",
    borderRadius: 10,
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 28,
  },
  nameInput: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    padding: 0,
  },
  nameCreateBtn: {
    overflow: "hidden",
    borderRadius: 30,
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  nameCreateBtnText: {
    fontFamily: "Manrope",
    color: "#1B060F",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
