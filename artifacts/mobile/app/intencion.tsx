import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { useIntencion } from "@/context/IntencionContext";
import { useColors } from "@/hooks/useColors";

const IDEAS: string[] = [
  "Escucharme con más atención",
  "Vivir el presente sin distracciones",
  "Agradecer tres momentos del día",
  "Respirar profundo antes de reaccionar",
  "Conectar con mi cuerpo a través del sonido",
  "Soltar lo que no puedo controlar",
  "Elegir la calma antes que la prisa",
  "Ser amable conmigo mismo/a",
  "Meditar al menos 10 minutos hoy",
  "Hablar con honestidad y desde el amor",
  "Hacer una cosa a la vez con plena atención",
  "Recibir el día con gratitud y apertura",
];

type Tab = "ideas" | "guardados" | "favoritos";

const TAB_LABELS: Record<Tab, string> = {
  ideas: "Ideas",
  guardados: "Guardados",
  favoritos: "Favoritos",
};

export default function IntencionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 56 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [text, setText] = useState("");
  const [tab, setTab] = useState<Tab>("ideas");
  const inputRef = useRef<TextInput>(null);

  const { savedEntries, favorites, addSaved, removeSaved, addFavorite, removeFavorite, isFavorite } =
    useIntencion();

  function handleIdeaTap(idea: string) {
    setText(idea);
    inputRef.current?.focus();
  }

  function handleSave() {
    const trimmed = text.trim();
    if (!trimmed) return;
    addSaved(trimmed);
    setText("");
    setTab("guardados");
  }

  function handleHeartInSaved(entryText: string) {
    addFavorite(entryText);
    setTab("favoritos");
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <SacredBackground />

        {/* ── Header ── */}
        <View style={[styles.topBar, { paddingTop: topPad + 6 }]}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            hitSlop={8}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        {/* ── Input area ── */}
        <View style={styles.inputSection}>
          <Text style={[styles.hoyLabel, { color: colors.mutedForeground }]}>Hoy voy a...</Text>

          <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}>
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              placeholder="Establece tu intención aquí"
              placeholderTextColor={colors.mutedForeground + "80"}
              style={[styles.input, { color: colors.foreground }]}
              multiline
              autoFocus={false}
              selectionColor={colors.primary}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />

            {text.trim().length > 0 && (
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={styles.saveBtnText}>Guardar</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Tabs ── */}
        <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
          {(["ideas", "guardados", "favoritos"] as Tab[]).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={styles.tabBtn}>
              <Text style={[styles.tabLabel, { color: tab === t ? colors.primary : colors.mutedForeground }]}>
                {TAB_LABELS[t]}
              </Text>
              {tab === t && <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />}
            </Pressable>
          ))}
        </View>

        {/* ── Content ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 + bottomPad }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* IDEAS */}
          {tab === "ideas" && (
            <View style={styles.ideasGrid}>
              {IDEAS.map((idea) => (
                <Pressable
                  key={idea}
                  onPress={() => handleIdeaTap(idea)}
                  style={({ pressed }) => [
                    styles.ideaChip,
                    {
                      backgroundColor: text === idea ? colors.primary + "22" : colors.card,
                      borderColor: text === idea ? colors.primary + "66" : colors.border,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={
                      text === idea
                        ? ["rgba(199,156,88,0.08)", "rgba(199,156,88,0.04)"]
                        : ["transparent", "transparent"]
                    }
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={[styles.ideaText, { color: text === idea ? colors.primary : colors.foreground }]}>
                    {idea}
                  </Text>
                  <Feather
                    name="arrow-up-left"
                    size={13}
                    color={text === idea ? colors.primary : colors.mutedForeground}
                    style={styles.ideaArrow}
                  />
                </Pressable>
              ))}
            </View>
          )}

          {/* GUARDADOS — expiran en 24hrs */}
          {tab === "guardados" && (
            savedEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="clock" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nada guardado aún</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Las intenciones guardadas duran 24 horas.{"\n"}Toca el ♥ para pasarlas a Favoritos.
                </Text>
              </View>
            ) : (
              <View style={styles.savedList}>
                {savedEntries.map((entry) => (
                  <View
                    key={entry.text + entry.savedAt}
                    style={[styles.savedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Pressable style={styles.savedCardLeft} onPress={() => handleIdeaTap(entry.text)}>
                      <Text style={[styles.hoyLabelSmall, { color: colors.mutedForeground }]}>
                        Hoy voy a...
                      </Text>
                      <Text style={[styles.savedText, { color: colors.foreground }]}>{entry.text}</Text>
                      <Text style={[styles.expiryLabel, { color: colors.mutedForeground }]}>
                        Expira en {Math.max(0, Math.ceil((entry.savedAt + 24 * 60 * 60 * 1000 - Date.now()) / (60 * 60 * 1000)))}h
                      </Text>
                    </Pressable>
                    <View style={styles.savedActions}>
                      <Pressable
                        onPress={() => handleHeartInSaved(entry.text)}
                        hitSlop={8}
                        style={[styles.actionBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}
                      >
                        <Feather name="heart" size={15} color={colors.primary} />
                      </Pressable>
                      <Pressable
                        onPress={() => removeSaved(entry.text)}
                        hitSlop={8}
                        style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                      >
                        <Feather name="trash-2" size={14} color={colors.mutedForeground} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )
          )}

          {/* FAVORITOS — permanentes */}
          {tab === "favoritos" && (
            favorites.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="heart" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sin favoritos aún</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  En Guardados, toca el ♥ para guardar una{"\n"}intención aquí de forma permanente.
                </Text>
              </View>
            ) : (
              <View style={styles.savedList}>
                {favorites.map((fav) => (
                  <View
                    key={fav}
                    style={[styles.savedCard, { backgroundColor: colors.card, borderColor: colors.primary + "30" }]}
                  >
                    <Pressable style={styles.savedCardLeft} onPress={() => handleIdeaTap(fav)}>
                      <Text style={[styles.hoyLabelSmall, { color: colors.mutedForeground }]}>
                        Hoy voy a...
                      </Text>
                      <Text style={[styles.savedText, { color: colors.foreground }]}>{fav}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => removeFavorite(fav)}
                      hitSlop={8}
                      style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <Feather name="trash-2" size={14} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )
          )}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  inputSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  hoyLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  inputCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    minHeight: 110,
    justifyContent: "space-between",
  },
  input: {
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 26,
    minHeight: 60,
  },
  saveBtn: {
    alignSelf: "flex-end",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 10,
  },
  saveBtnText: { fontSize: 13, fontWeight: "700", color: "#141B26" },

  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    marginBottom: 2,
  },
  tabBtn: {
    paddingVertical: 12,
    marginRight: 24,
    position: "relative",
  },
  tabLabel: { fontSize: 14, fontWeight: "600" },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 2,
  },

  ideasGrid: { gap: 10 },
  ideaChip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  ideaText: { flex: 1, fontSize: 14, lineHeight: 20 },
  ideaArrow: { marginLeft: 8 },

  emptyState: {
    alignItems: "center",
    paddingTop: 48,
    gap: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyText: { fontSize: 13, lineHeight: 20, textAlign: "center" },

  savedList: { gap: 12 },
  savedCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  savedCardLeft: { flex: 1 },
  hoyLabelSmall: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  savedText: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  expiryLabel: { fontSize: 11 },
  savedActions: { flexDirection: "column", gap: 8 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
