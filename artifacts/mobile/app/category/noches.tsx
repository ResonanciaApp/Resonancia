import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryInfoPanel } from "@/components/CategoryInfoPanel";
import { SessionCard } from "@/components/SessionCard";
import { SESSIONS } from "@/data/sessions";
import type { Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const ICON_COLOR = "#C87BB5";

const NOCHES_SESSIONS = SESSIONS.filter((s) => s.categoryId === "noches");

const matchTag = (s: Session, tag: string) =>
  (s as Session & { meditationTag?: string }).meditationTag === tag ||
  (s as Session & { soundTag?: string }).soundTag === tag ||
  (s as Session & { ancestralTag?: string }).ancestralTag === tag ||
  ((s as Session & { themeTag?: string[] }).themeTag?.includes(tag) ?? false);

type SubDef = {
  tag: string;
  icon: string;
  family: "Feather" | "MaterialCommunityIcons";
  description: string;
};

const SUBCATEGORIES: SubDef[] = [
  { tag: "Guiadas",                 icon: "mic",       family: "Feather",                description: "Voces que te acompañan al dormir" },
  { tag: "Música",                  icon: "music",     family: "Feather",                description: "Melodías suaves para descansar" },
  { tag: "Sonidos de la Naturaleza", icon: "leaf",     family: "MaterialCommunityIcons", description: "Bosque, lluvia y mar para soltar" },
  { tag: "Yoga Nidra",              icon: "meditation", family: "MaterialCommunityIcons", description: "Relajación profunda y consciente" },
  { tag: "Música Ambient",          icon: "waveform",  family: "MaterialCommunityIcons", description: "Atmósferas envolventes y etéreas" },
  { tag: "Sonidos Ancestrales",     icon: "bowl-mix",  family: "MaterialCommunityIcons", description: "Cuencos y frecuencias para el descanso" },
];

function SubIcon({ sub, size }: { sub: SubDef; size: number }) {
  return sub.family === "MaterialCommunityIcons" ? (
    <MaterialCommunityIcons
      name={sub.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
      size={size}
      color={ICON_COLOR}
    />
  ) : (
    <Feather
      name={sub.icon as React.ComponentProps<typeof Feather>["name"]}
      size={size}
      color={ICON_COLOR}
    />
  );
}

export default function NochesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredSessions = useMemo(() => {
    if (!selectedTag) return NOCHES_SESSIONS;
    return NOCHES_SESSIONS.filter((s) => matchTag(s, selectedTag));
  }, [selectedTag]);

  const countByTag = useMemo(() => {
    const map: Record<string, number> = {};
    for (const sub of SUBCATEGORIES) {
      map[sub.tag] = NOCHES_SESSIONS.filter((s) => matchTag(s, sub.tag)).length;
    }
    return map;
  }, []);

  const selectedSub = SUBCATEGORIES.find((c) => c.tag === selectedTag);

  return (
    <View style={[styles.root, { backgroundColor: "#0B0F14" }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={["#0B0F14", "#0B0F14"]} style={StyleSheet.absoluteFill} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 + bottomPad, paddingTop: topPad + 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: H_PAD }]}>
          <Pressable
            onPress={() => {
              if (selectedTag) setSelectedTag(null);
              else router.back();
            }}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={styles.catIconCircle}>
            <Feather name="moon" size={44} color={ICON_COLOR} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>
            {selectedTag ?? "Noches"}
          </Text>
          <Text style={[styles.pageSub, { color: "#EDE1D3" }]}>
            {selectedTag
              ? selectedSub?.description ?? ""
              : "Prepara tu cuerpo y mente para el descanso"}
          </Text>
        </View>

        {/* ── SUBCATEGORY LIST view ── */}
        {!selectedTag && (
          <>
            <View style={[styles.catList, { paddingHorizontal: H_PAD }]}>
              {SUBCATEGORIES.map((sub, idx) => {
                const isLast = idx === SUBCATEGORIES.length - 1;
                return (
                  <Pressable
                    key={sub.tag}
                    onPress={() => setSelectedTag(sub.tag)}
                    style={({ pressed }) => [
                      styles.catRow,
                      !isLast && { borderBottomWidth: 1, borderBottomColor: "rgba(182,149,95,0.1)" },
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <View style={styles.iconCircle}>
                      <SubIcon sub={sub} size={22} />
                    </View>
                    <Text style={[styles.catName, { color: colors.foreground }]}>{sub.tag}</Text>
                    <View style={styles.catRight}>
                      <Text style={[styles.catCount, { color: colors.foreground }]}>
                        {countByTag[sub.tag] ?? 0}
                      </Text>
                      <Feather name="chevron-right" size={17} color={colors.foreground} />
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <CategoryInfoPanel
              accentColor={ICON_COLOR}
              heading="¿Por qué cuidar tus noches?"
              items={[
                {
                  icon: "moon",
                  title: "Un ritual de cierre",
                  body: "Una rutina suave antes de dormir le avisa a tu cuerpo que es hora de soltar. La mente se calma y el sueño llega con más facilidad.",
                },
                {
                  icon: "volume-2",
                  title: "El sonido que relaja",
                  body: "Voces guía, música y sonidos de la naturaleza reducen la rumiación mental y acompañan la transición al descanso profundo.",
                },
                {
                  icon: "activity",
                  title: "Descanso reparador",
                  body: "Dormir mejor mejora tu memoria, tu ánimo y tu energía. El descanso no es un lujo: es la base de tu bienestar.",
                },
              ]}
              quote="El descanso también es una forma de cuidarte."
              whyItems={[
                { icon: "moon", text: "Porque un buen día empieza la noche anterior." },
                { icon: "heart", text: "Porque mereces dormir en paz, sin pantallas ni prisa." },
              ]}
            />
          </>
        )}

        {/* ── SESSIONS LIST view ── */}
        {selectedTag && (
          <View style={{ paddingHorizontal: H_PAD }}>
            {filteredSessions.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Feather name="moon" size={40} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Próximamente</Text>
              </View>
            ) : (
              filteredSessions.map((s) => <SessionCard key={s.id} session={s} horizontal />)
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: { alignItems: "center", marginBottom: 28, paddingTop: 4 },
  backBtn: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  catIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 6,
    textAlign: "center",
  },
  pageSub: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  catList: {},
  catRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 14 },
  iconCircle: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  catName: { flex: 1, fontSize: 15, fontWeight: "600", letterSpacing: 0.1 },
  catRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  catCount: { fontSize: 13, fontWeight: "500" },
  emptyWrap: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, textAlign: "center" },
});
