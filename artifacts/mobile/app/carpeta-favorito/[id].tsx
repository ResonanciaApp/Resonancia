import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradientFill } from "@/components/GoldGradient";
import React, { useState } from "react";
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

import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { usePlayer } from "@/context/PlayerContext";
import { SESSIONS } from "@/data/sessions";
import { SessionCard } from "@/components/SessionCard";
import { FavoriteActionsSheet } from "@/components/FavoriteActionsSheet";

const BG = ["#230610", "#16040A"] as const;
const GOLD = "#BE8744";
const TEXT = "#FAF0EE";
const MUTED = "#c2c2c2";

export default function CarpetaFavoritoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { favFolders, deleteFavFolder, renameFavFolder, removeFromFavFolder } = useFoldersPlaylists();
  const { favorites } = usePlayer();

  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [actionsItemId, setActionsItemId] = useState<string | null>(null);

  const folder = favFolders.find((f) => f.id === id);

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

  const folderSessions = folder.sessionIds
    .map((sid) => SESSIONS.find((s) => s.id === sid))
    .filter(Boolean) as typeof SESSIONS;

  const handleDelete = () => {
    Alert.alert(
      "Eliminar carpeta",
      `¿Eliminar "${folder.name}"? Los favoritos no se borrarán.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => { deleteFavFolder(folder.id); router.back(); } },
      ]
    );
  };

  const handleRename = () => {
    if (!nameInput.trim()) { setRenaming(false); return; }
    renameFavFolder(folder.id, nameInput.trim());
    setRenaming(false);
  };

  return (
    <LinearGradient style={styles.root} colors={BG} locations={[0, 0.5, 1]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="chevron-left" size={26} color={TEXT} />
        </Pressable>
        {renaming ? (
          <TextInput
            style={styles.renameInput}
            value={nameInput}
            onChangeText={setNameInput}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleRename}
            onBlur={handleRename}
            selectTextOnFocus
          />
        ) : (
          <Text style={styles.headerName} numberOfLines={1}>{folder.name}</Text>
        )}
        <Pressable
          style={styles.iconBtn}
          hitSlop={10}
          onPress={() => {
            Alert.alert(folder.name, "Opciones", [
              { text: "Cambiar nombre", onPress: () => { setNameInput(folder.name); setRenaming(true); } },
              { text: "Eliminar carpeta", style: "destructive", onPress: handleDelete },
              { text: "Cancelar", style: "cancel" },
            ]);
          }}
        >
          <Feather name="more-horizontal" size={22} color={TEXT} />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPad + 40, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {folderSessions.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Esta carpeta está vacía</Text>
            <Text style={styles.emptySub}>Mueve favoritos aquí desde Tu biblioteca.</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 15, gap: 9 }}>
            {folderSessions.map((s) => (
              <View key={s.id} style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <SessionCard
                    session={s}
                    horizontal
                    thumbWidth={65}
                    thumbHeight={64}
                    thumbRadius={6}
                    showDuration={false}
                    onLongPress={() => setActionsItemId(s.id)}
                  />
                </View>
                <Pressable
                  onPress={() => removeFromFavFolder(folder.id, s.id)}
                  hitSlop={10}
                  style={styles.removeBtn}
                >
                  <Feather name="x" size={16} color={MUTED} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <FavoriteActionsSheet
        itemId={actionsItemId}
        itemKind={actionsItemId ? "session" : null}
        visible={actionsItemId !== null}
        onClose={() => setActionsItemId(null)}
      />
    </LinearGradient>
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
    flex: 1,
    color: TEXT,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  renameInput: {
    flex: 1,
    color: TEXT,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: GOLD,
    paddingVertical: 2,
    padding: 0,
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 180,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySub: {
    color: MUTED,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  removeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
});
