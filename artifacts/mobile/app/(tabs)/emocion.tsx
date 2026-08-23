import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSceneTheme } from "@/context/SceneThemeContext";
import { MOODS, type MoodId } from "@/data/moods";

const GOLD = "#F9F9F9";
const MUTED = "rgba(244,244,244,0.62)";
const SURFACE = "rgba(255,255,255,0.065)";
const SURFACE_STRONG = "rgba(255,255,255,0.10)";

export default function EmocionScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const [draft, setDraft] = useState("");
  const [selectedMood, setSelectedMood] = useState<MoodId | null>(null);
  const topPad = Platform.OS === "web" ? 66 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 126 : insets.bottom + 118;

  return (
    <LinearGradient colors={theme.gradient} style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 18, paddingBottom: bottomPad }]}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>TU ESPACIO PERSONAL</Text>
            <Text style={styles.title}>Emoción</Text>
            <Text style={styles.subtitle}>Un momento para escucharte y encontrar lo que necesitas.</Text>
          </View>
          <View style={styles.headerEmoji}>
            <Text style={styles.headerEmojiText}>🙂</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.assistantIcon}>
                <Feather name="star" size={16} color={GOLD} />
              </View>
              <Text style={styles.sectionTitle}>Conversamos contigo</Text>
            </View>
            <View style={styles.comingSoonPill}>
              <Text style={styles.comingSoonText}>PRÓXIMAMENTE</Text>
            </View>
          </View>
          <Text style={styles.sectionDescription}>
            Este será tu espacio para recibir sesiones sugeridas según lo que estés viviendo.
          </Text>

          <View style={styles.chatCard}>
            <View style={styles.assistantRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarMark}>R</Text>
              </View>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <Text style={styles.messageText}>Hola, estoy aquí para acompañarte. ¿Cómo ha estado tu día?</Text>
              </View>
            </View>

            <View style={[styles.messageBubble, styles.userBubble]}>
              <Text style={styles.messageText}>Me cuesta desconectarme al final del día.</Text>
            </View>

            <View style={styles.assistantRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarMark}>R</Text>
              </View>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <Text style={styles.messageText}>
                  Podré recomendarte una práctica suave para cerrar el día con más calma.
                </Text>
              </View>
            </View>

            <View style={styles.composer}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Escribe cómo te sientes…"
                placeholderTextColor="rgba(244,244,244,0.42)"
                style={styles.composerInput}
                multiline
                maxLength={240}
              />
              <View style={styles.sendButton}>
                <Feather name="arrow-up" size={18} color="#121019" />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.moodIcon}>
              <Feather name="heart" size={16} color={GOLD} />
            </View>
            <Text style={styles.sectionTitle}>Expresa tu emoción</Text>
          </View>
          <Text style={styles.sectionDescription}>Elige lo que más se acerque a este momento.</Text>

          <View style={styles.moodsGrid}>
            {MOODS.map((mood) => {
              const selected = selectedMood === mood.id;
              return (
                <Pressable
                  key={mood.id}
                  onPress={() => setSelectedMood(mood.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Emoción: ${mood.label}`}
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.moodCard,
                    selected && styles.moodCardSelected,
                    { opacity: pressed ? 0.78 : 1 },
                  ]}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[styles.moodLabel, selected && styles.moodLabelSelected]} numberOfLines={1}>
                    {mood.label}
                  </Text>
                  {selected && <Feather name="check" size={13} color={GOLD} style={styles.moodCheck} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 19 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 34,
    gap: 18,
  },
  eyebrow: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.3,
    color: "rgba(249,249,249,0.64)",
    marginBottom: 6,
  },
  title: {
    fontFamily: "Manrope",
    color: GOLD,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  subtitle: {
    maxWidth: 275,
    marginTop: 7,
    fontFamily: "Manrope",
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
  },
  headerEmoji: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  headerEmojiText: { fontSize: 30 },
  section: { marginBottom: 34 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  assistantIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,249,249,0.13)",
  },
  moodIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,249,249,0.13)",
  },
  sectionTitle: {
    fontFamily: "Manrope",
    color: GOLD,
    fontSize: 19,
    fontWeight: "700",
  },
  comingSoonPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: "rgba(249,249,249,0.12)",
  },
  comingSoonText: {
    color: "rgba(249,249,249,0.78)",
    fontFamily: "Manrope",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.75,
  },
  sectionDescription: {
    marginTop: 9,
    color: MUTED,
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 19,
  },
  chatCard: {
    marginTop: 17,
    borderRadius: 24,
    padding: 15,
    gap: 11,
    overflow: "hidden",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  assistantRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingRight: 28,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,249,249,0.18)",
  },
  avatarMark: {
    color: GOLD,
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "800",
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  assistantBubble: {
    flex: 1,
    borderBottomLeftRadius: 4,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "82%",
    borderBottomRightRadius: 4,
    backgroundColor: "rgba(249,249,249,0.19)",
  },
  messageText: {
    color: "rgba(255,255,255,0.90)",
    fontFamily: "Manrope",
    fontSize: 12.5,
    lineHeight: 18,
  },
  composer: {
    minHeight: 50,
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  composerInput: {
    flex: 1,
    maxHeight: 72,
    paddingVertical: 7,
    color: GOLD,
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 18,
  },
  sendButton: {
    width: 36,
    height: 36,
    marginLeft: 8,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GOLD,
  },
  moodsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 17,
  },
  moodCard: {
    width: "31.8%",
    minHeight: 106,
    paddingHorizontal: 7,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  moodCardSelected: {
    backgroundColor: SURFACE_STRONG,
    borderColor: "rgba(249,249,249,0.60)",
  },
  moodEmoji: {
    fontFamily: "Manrope",
    fontSize: 29,
    lineHeight: 35,
    marginBottom: 7,
  },
  moodLabel: {
    color: MUTED,
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  moodLabelSelected: { color: GOLD },
  moodCheck: {
    position: "absolute",
    top: 9,
    right: 9,
  },
});