import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PremiumBadge } from "@/components/PremiumBadge";
import { SacredBackground } from "@/components/SacredBackground";
import { usePremium } from "@/context/PremiumContext";
import { CategoryInfoPanel } from "@/components/CategoryInfoPanel";
import { SessionCard } from "@/components/SessionCard";
import { SESSIONS, type SabiduriaTag } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;

const SABIDURÍA_SESSIONS = SESSIONS.filter((s) => s.categoryId === "sabiduria-dia");

type CategoryDef = {
  tag: SabiduriaTag;
  icon: React.ComponentProps<typeof Feather>["name"];
  image: import("react-native").ImageSourcePropType;
  description: string;
};

const CATEGORIES: CategoryDef[] = [
  { tag: "Silencio Interior",            icon: "moon",     image: require("@/assets/images/sessions/sab-silencio-interior.jpg"),  description: "Encuentra el espacio entre los pensamientos" },
  { tag: "Aceptación y flujo",           icon: "droplet",  image: require("@/assets/images/sessions/sab-aceptacion-flujo.jpg"),   description: "Suelta y deja que la vida fluya" },
  { tag: "Atención plena",               icon: "eye",      image: require("@/assets/images/sessions/sab-atencion-plena.jpg"),     description: "Presencia total en el momento que es" },
  { tag: "Observo mi oscuridad",         icon: "feather",  image: require("@/assets/images/sessions/sab-oscuridad.jpg"),          description: "Mira sin etiquetar, siente sin resistir" },
  { tag: "Condicionamiento y creencias", icon: "layers",   image: require("@/assets/images/sessions/sab-condicionamiento.jpg"),   description: "Despierta los patrones que te limitan" },
];

export default function SabiduriaDiaScreen() {
  const colors = useColors();
  const { isPremium } = usePremium();
  const insets = useSafeAreaInsets();

  const [selectedTag, setSelectedTag] = useState<SabiduriaTag | null>(null);
  const [query, setQuery] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredSessions = useMemo(() => {
    let list = SABIDURÍA_SESSIONS;
    if (selectedTag) list = list.filter((s) => s.sabiduriaTag === selectedTag);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) => s.title.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedTag, query]);

  const countByTag = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      map[cat.tag] = SABIDURÍA_SESSIONS.filter((s) => s.sabiduriaTag === cat.tag).length;
    }
    return map;
  }, []);

  const selectedCat = CATEGORIES.find((c) => c.tag === selectedTag);

  const nuevasSessions = useMemo(
    () => [...SABIDURÍA_SESSIONS].sort((a, b) => parseInt(b.id) - parseInt(a.id)).slice(0, 8),
    []
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />
      <LinearGradient
        colors={["rgba(240,168,92,0.18)", "rgba(240,168,92,0.05)", "rgba(240,168,92,0.12)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)" }]}
        pointerEvents="none"
      />

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
              if (selectedTag) {
                setSelectedTag(null);
                setQuery("");
              } else {
                router.back();
              }
            }}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={[styles.catIconCircle, { backgroundColor: "#2E2417", borderColor: "transparent" }]}>
            <Feather name="sun" size={22} color="#E6D6B3" />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>
            {selectedTag ?? "3 Minutos de Sabiduría"}
          </Text>
          <Text style={[styles.pageSub, { color: "#F0CC82" }]}>
            {selectedTag
              ? selectedCat?.description ?? ""
              : "Una semilla de consciencia cada día"}
          </Text>
        </View>

        {/* ── CATEGORY LIST ── */}
        {!selectedTag && (
          <>
            <View style={[styles.catList, { paddingHorizontal: H_PAD }]}>
              {CATEGORIES.map((cat, idx) => {
                const isLast = idx === CATEGORIES.length - 1;
                return (
                  <Pressable
                    key={cat.tag}
                    onPress={() => setSelectedTag(cat.tag)}
                    style={({ pressed }) => [
                      styles.catRow,
                      !isLast && { borderBottomWidth: 1, borderBottomColor: "rgba(182,149,95,0.1)" },
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <Image source={cat.image} style={styles.iconCircle} contentFit="cover" placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} />
                    <Text style={[styles.catName, { color: colors.foreground }]}>{cat.tag}</Text>
                    <View style={styles.catRight}>
                      <Text style={[styles.catCount, { color: "#F0CC82" }]}>
                        {countByTag[cat.tag] ?? 0}
                      </Text>
                      <Feather name="chevron-right" size={18} color="#F0CC82" />
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <CategoryInfoPanel
              accentColor="#F0CC82"
              heading="¿Qué son los 3 Minutos de Sabiduría?"
              items={[
                {
                  icon: "sun",
                  title: "Una semilla por día",
                  body: "Cada jornada trae una enseñanza breve para reflexionar, integrar y llevar en el corazón durante toda la jornada.",
                },
                {
                  icon: "book-open",
                  title: "Filosofías universales",
                  body: "Desde el budismo hasta el estoicismo, conectamos con la sabiduría atemporal de la humanidad en pocas palabras.",
                },
                {
                  icon: "trending-up",
                  title: "Crecimiento gradual",
                  body: "No se trata de leer, sino de sentir. Una idea bien integrada cambia más que mil leídas a la ligera.",
                },
              ]}
              quote="La sabiduría no es saber más, es vivir mejor con lo que ya sabés."
              whyItems={[
                { icon: "star", text: "Porque el crecimiento real sucede en pequeños momentos de conciencia." },
                { icon: "compass", text: "Porque todos necesitamos un norte cuando la vida se nubla." },
              ]}
            />
          </>
        )}

        {/* ── SESSIONS LIST ── */}
        {selectedTag && (
          <>
            <View style={[{ paddingHorizontal: H_PAD, marginBottom: 16 }]}>
              <View style={[styles.searchBar, { backgroundColor: "rgba(76,60,32,0.55)", borderColor: "transparent" }]}>
                <Feather name="search" size={16} color="#F0CC82" style={{ marginRight: 8 }} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar..."
                  placeholderTextColor="#F0CC82"
                  style={[styles.searchInput, { color: colors.foreground }]}
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <Pressable onPress={() => setQuery("")} hitSlop={8}>
                    <Feather name="x" size={14} color="#F0CC82" />
                  </Pressable>
                )}
              </View>
            </View>

            <View style={{ paddingHorizontal: H_PAD }}>
              {filteredSessions.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Feather name="search" size={32} color="#F0CC82" style={{ marginBottom: 12 }} />
                  <Text style={[styles.emptyText, { color: "#F0CC82" }]}>
                    Sin resultados{query ? ` para "${query}"` : ""}
                  </Text>
                </View>
              ) : (
                filteredSessions.map((session) => {
                  const locked = !!session.isPremium && !isPremium;
                  return (
                  <Pressable
                    key={session.id}
                    onPress={() => router.push((locked ? "/membresia" : `/session/${session.id}`) as never)}
                    style={({ pressed }) => [
                      styles.card,
                      { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "transparent", opacity: pressed ? 0.82 : 1 },
                    ]}
                  >
                    <View>
                    <Image
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      source={session.image as any}
                      style={styles.cardImage}
                      placeholder={BLUR_PLACEHOLDER}
                      transition={IMAGE_TRANSITION}
                    />
                    <PremiumBadge session={session} />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
                        {session.title}
                      </Text>
                      <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {session.subtitle}
                      </Text>
                      <View style={styles.metaRow}>
                        <Feather name="clock" size={11} color={colors.mutedForeground} />
                        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                          {" "}{session.durationLabel}
                        </Text>
                      </View>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.border} style={{ marginRight: 14 }} />
                  </Pressable>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: { alignItems: "center", marginBottom: 28, paddingTop: 4 },
  backBtn: { alignSelf: "flex-start", width: 40, height: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  catIconCircle: { width: 56, height: 56, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  pageTitle: { fontSize: 26, fontWeight: "700", letterSpacing: 0.2, marginBottom: 6, textAlign: "center" },
  pageSub: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  catList: {},
  catRow: { flexDirection: "row", alignItems: "center", paddingVertical: 18, gap: 16 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  catName: { flex: 1, fontSize: 17, fontWeight: "600", letterSpacing: 0.1 },
  catRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  catCount: { fontSize: 14, fontWeight: "500" },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 12 : 10 },
  searchInput: { flex: 1, fontSize: 14, padding: 0, margin: 0 },
  card: { flexDirection: "row", alignItems: "center", borderRadius: 18, borderWidth: 1, overflow: "hidden", marginBottom: 12, height: 96 },
  cardImage: { width: 108, height: 96, resizeMode: "cover" },
  cardContent: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, justifyContent: "center" },
  cardTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20, marginBottom: 2 },
  cardSub: { fontSize: 11, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 11 },
  emptyWrap: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, textAlign: "center" },
  nuevasSection: { marginTop: 32, marginBottom: 8 },
  nuevasHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: H_PAD, marginBottom: 14 },
  nuevasTitle: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
  verTodas: { fontSize: 13, fontWeight: "600" },
  nuevasCarousel: { paddingLeft: H_PAD, paddingRight: 12, gap: 12 },
});
