import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { useColors } from "@/hooks/useColors";
import { type GrupoLocal, useGrupos } from "@/hooks/useGrupos";

// ─── Image gallery (same as crear.tsx) ───────────────────────────────────────
const GALLERY = [
  require("@/assets/images/sessions/session-1.jpg"),
  require("@/assets/images/sessions/session-2.jpg"),
  require("@/assets/images/sessions/session-3.jpg"),
  require("@/assets/images/sessions/session-4.jpg"),
  require("@/assets/images/sessions/session-5.jpg"),
  require("@/assets/images/sessions/session-6.jpg"),
  require("@/assets/images/sessions/session-7.jpg"),
  require("@/assets/images/sessions/session-8.jpg"),
  require("@/assets/images/sessions/session-9.jpg"),
  require("@/assets/images/sessions/session-10.jpg"),
  require("@/assets/images/sessions/session-11.jpg"),
  require("@/assets/images/sessions/session-12.jpg"),
  require("@/assets/images/sessions/session-13.jpg"),
  require("@/assets/images/sessions/session-14.jpg"),
  require("@/assets/images/sessions/session-15.jpg"),
  require("@/assets/images/sessions/session-16.jpg"),
  require("@/assets/images/sessions/session-17.jpg"),
  require("@/assets/images/sessions/session-18.jpg"),
  require("@/assets/images/sessions/session-19.jpg"),
  require("@/assets/images/sessions/session-20.jpg"),
  require("@/assets/images/sessions/session-27.jpg"),
  require("@/assets/images/sessions/session-28.jpg"),
];

// ─── Mock data ───────────────────────────────────────────────────────────────
const GRUPOS_POPULARES = [
  {
    id: "g1",
    name: "Meditación Vipassana",
    tipo: "Círculo público",
    members: 4200,
    gradient: ["#3A5438", "#1E2E1C"] as [string, string],
    icon: "wind" as const,
    color: "#A8C4A8",
  },
  {
    id: "g2",
    name: "Cuencos y Frecuencias",
    tipo: "Círculo público",
    members: 2100,
    gradient: ["#7A5520", "#3E2208"] as [string, string],
    icon: "disc" as const,
    color: "#E8C87A",
  },
  {
    id: "g3",
    name: "Autoestima Saludable",
    tipo: "Círculo público",
    members: 2300,
    gradient: ["#4A3260", "#251633"] as [string, string],
    icon: "sun" as const,
    color: "#C8B4E0",
  },
];

const GRUPOS_POR_TEMA = [
  { label: "Meditación y mindfulness", icon: "wind" as const },
  { label: "Sueño y descanso", icon: "moon" as const },
  { label: "Sonidos y frecuencias", icon: "disc" as const },
  { label: "Espiritualidad", icon: "star" as const },
  { label: "Ansiedad y estrés", icon: "heart" as const },
  { label: "Crecimiento personal", icon: "trending-up" as const },
];

const GRUPOS_UNIDOS = [
  {
    id: "g2",
    name: "Cuencos y Frecuencias",
    lastActivity: "hace 3 días",
    gradient: ["#7A5520", "#3E2208"] as [string, string],
    icon: "disc" as const,
    color: "#E8C87A",
  },
];

const FEED_POSTS = [
  {
    id: "f1",
    author: "Sofía Herrera",
    initials: "SH",
    color: "#E8C87A",
    group: "Meditación Vipassana",
    groupGradient: ["#3A5438", "#1E2E1C"] as [string, string],
    groupIcon: "wind" as const,
    groupColor: "#A8C4A8",
    time: "hace 3 días",
    text: "Ayer tuve una sesión muy profunda. En un momento sentí que el pensamiento se disolvía completamente. ¿Alguien más vivió algo parecido al principio?",
    likes: 12,
    replies: 4,
  },
  {
    id: "f2",
    author: "Luna Vega",
    initials: "LV",
    color: "#C8B4E0",
    group: "Cuencos y Frecuencias",
    groupGradient: ["#7A5520", "#3E2208"] as [string, string],
    groupIcon: "disc" as const,
    groupColor: "#E8C87A",
    time: "hace 7 días",
    text: "Compartí fotos de mi set nuevo 🎶 Cuenco tibetano en FA, dos de cristal en SOL y RE. Tardé 3 años en armarlo y por fin está completo. ¿Alguien más colecciona?",
    likes: 33,
    replies: 9,
  },
];

function formatCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// ─── Group avatar ─────────────────────────────────────────────────────────────
function GroupAvatar({
  gradient,
  icon,
  color,
  size = 52,
}: {
  gradient: [string, string];
  icon: React.ComponentProps<typeof Feather>["name"];
  color: string;
  size?: number;
}) {
  return (
    <LinearGradient
      colors={gradient}
      style={{ width: size, height: size, borderRadius: size * 0.3, alignItems: "center", justifyContent: "center" }}
    >
      <Feather name={icon} size={size * 0.45} color={color} />
    </LinearGradient>
  );
}

// ─── Create group sheet ───────────────────────────────────────────────────────
function CreateGroupSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleSelect = (tipo: "publico" | "privado") => {
    onClose();
    router.push(`/grupo/crear?privado=${tipo === "privado" ? "1" : "0"}` as never);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetOverlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

        <View style={styles.sheetCloseRow}>
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Crear un Grupo</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <View style={[styles.sheetCloseBtn, { backgroundColor: colors.background }]}>
              <Feather name="x" size={16} color={colors.foreground} />
            </View>
          </Pressable>
        </View>

        <Pressable
          onPress={() => handleSelect("publico")}
          style={[styles.sheetOption, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <View style={[styles.sheetOptionIcon, { backgroundColor: "#2A2A2A" }]}>
            <Feather name="users" size={22} color={colors.foreground} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sheetOptionTitle, { color: colors.foreground }]}>Público</Text>
            <Text style={[styles.sheetOptionSub, { color: colors.mutedForeground }]}>
              Cualquiera puede unirse a tu Grupo
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>

        <Pressable
          onPress={() => handleSelect("privado")}
          style={[styles.sheetOption, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <View style={[styles.sheetOptionIcon, { backgroundColor: "#2A2A2A" }]}>
            <Feather name="lock" size={22} color={colors.foreground} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sheetOptionTitle, { color: colors.foreground }]}>Privado</Text>
            <Text style={[styles.sheetOptionSub, { color: colors.mutedForeground }]}>
              Escogés quién se une a tu Grupo
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </Modal>
  );
}

// ─── Tab: Ojear ───────────────────────────────────────────────────────────────
function TabOjear({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Grupos populares */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Grupos populares</Text>
          <Pressable>
            <Text style={[styles.verTodos, { color: colors.primary }]}>Ver todos</Text>
          </Pressable>
        </View>
        {GRUPOS_POPULARES.map((g) => (
          <Pressable
            key={g.id}
            onPress={() => router.push(`/grupo/${g.id}` as never)}
            style={({ pressed }) => [
              styles.popularRow,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <GroupAvatar gradient={g.gradient} icon={g.icon} color={g.color} size={54} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.popularTipo, { color: colors.mutedForeground }]}>{g.tipo}</Text>
              <Text style={[styles.popularName, { color: colors.foreground }]} numberOfLines={1}>
                {g.name}
              </Text>
              <Text style={[styles.popularMembers, { color: colors.mutedForeground }]}>
                {formatCount(g.members)} miembros
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>

      {/* Grupos por tema */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 8 }]}>
          Grupos por tema
        </Text>
        {GRUPOS_POR_TEMA.map((t) => (
          <Pressable
            key={t.label}
            style={({ pressed }) => [
              styles.temaRow,
              { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={[styles.temaIconBg, { backgroundColor: colors.card }]}>
              <Feather name={t.icon} size={16} color={colors.primary} />
            </View>
            <Text style={[styles.temaLabel, { color: colors.foreground }]}>{t.label}</Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Avatar for a local grupo ────────────────────────────────────────────────
function LocalGrupoAvatar({ grupo, size = 54 }: { grupo: GrupoLocal; size?: number }) {
  const initial = (grupo.nombre[0] ?? "G").toUpperCase();
  if (grupo.imageIdx !== null && grupo.imageIdx < GALLERY.length) {
    return (
      <Image
        source={GALLERY[grupo.imageIdx]}
        style={{ width: size, height: size, borderRadius: size * 0.3 }}
      />
    );
  }
  return (
    <LinearGradient colors={["#2D4A3E", "#152820"]} style={{ width: size, height: size, borderRadius: size * 0.3, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#EDE1D3", fontSize: size * 0.38, fontWeight: "700" }}>{initial}</Text>
    </LinearGradient>
  );
}

// ─── Tab: Mis Grupos ──────────────────────────────────────────────────────────
function TabMisGrupos({
  colors,
  onCreatePress,
  gruposCreados,
}: {
  colors: ReturnType<typeof useColors>;
  onCreatePress: () => void;
  gruposCreados: GrupoLocal[];
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Grupos que gestiono */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Grupos que gestiono</Text>
          <Pressable onPress={onCreatePress} hitSlop={8}>
            <View style={[styles.addBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="plus" size={20} color={colors.foreground} />
            </View>
          </Pressable>
        </View>

        {gruposCreados.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No gestionás ningún grupo todavía.{"\n"}¿Te apasiona algún tema? Crea un grupo público o privado hoy.
            </Text>
          </View>
        ) : (
          gruposCreados.map((g) => (
            <Pressable
              key={g.id}
              onPress={() => router.push(`/grupo/${g.id}` as never)}
              style={({ pressed }) => [
                styles.unitoRow,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <LocalGrupoAvatar grupo={g} size={54} />
              <View style={{ flex: 1 }}>
                <View style={styles.grupoNameRow}>
                  <Text style={[styles.popularName, { color: colors.foreground }]} numberOfLines={1}>
                    {g.nombre}
                  </Text>
                  <View style={[styles.adminBadge, { backgroundColor: colors.primary + "22" }]}>
                    <Text style={[styles.adminBadgeText, { color: colors.primary }]}>ADMIN</Text>
                  </View>
                </View>
                <Text style={[styles.popularMembers, { color: colors.mutedForeground }]}>
                  {g.privado ? "Privado" : "Público"} · Sin publicaciones aún
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))
        )}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Grupos unidos */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>
          Grupos a los que me he unido
        </Text>
        {GRUPOS_UNIDOS.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Aún no te has unido a ningún grupo.
          </Text>
        ) : (
          GRUPOS_UNIDOS.map((g) => (
            <Pressable
              key={g.id}
              onPress={() => router.push(`/grupo/${g.id}` as never)}
              style={({ pressed }) => [
                styles.unitoRow,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <GroupAvatar gradient={g.gradient} icon={g.icon} color={g.color} size={54} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.popularName, { color: colors.foreground }]} numberOfLines={1}>
                  {g.name}
                </Text>
                <Text style={[styles.popularMembers, { color: colors.mutedForeground }]}>
                  Última publicación {g.lastActivity}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// ─── Tab: Mi tablón ───────────────────────────────────────────────────────────
function TabTablon({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [liked, setLiked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}>
      {FEED_POSTS.map((post) => (
        <View
          key={post.id}
          style={[styles.feedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          {/* Post header */}
          <View style={styles.feedHeader}>
            <View style={[styles.feedAvatar, { backgroundColor: post.color + "30" }]}>
              <Text style={[styles.feedInitials, { color: post.color }]}>{post.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.feedAuthor, { color: colors.foreground }]}>{post.author}</Text>
              <View style={styles.feedMeta}>
                <GroupAvatar gradient={post.groupGradient} icon={post.groupIcon} color={post.groupColor} size={16} />
                <Text style={[styles.feedGroup, { color: colors.primary }]} numberOfLines={1}>
                  {post.group}
                </Text>
                <Text style={[styles.feedTime, { color: colors.mutedForeground }]}>· {post.time}</Text>
              </View>
            </View>
            <Pressable hitSlop={8}>
              <Feather name="more-horizontal" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Post body */}
          <Text style={[styles.feedText, { color: colors.foreground }]}>{post.text}</Text>
          {post.text.length > 180 && (
            <Text style={[styles.leerMas, { color: colors.primary }]}>Leer más</Text>
          )}

          {/* Post actions */}
          <View style={[styles.feedActions, { borderTopColor: colors.border }]}>
            <Pressable onPress={() => toggle(post.id)} style={styles.feedAction}>
              <Feather name="heart" size={16} color={liked.has(post.id) ? "#D4709A" : colors.mutedForeground} />
              <Text style={[styles.feedActionText, { color: liked.has(post.id) ? "#D4709A" : colors.mutedForeground }]}>
                {post.likes + (liked.has(post.id) ? 1 : 0)}
              </Text>
            </Pressable>
            <Pressable style={styles.feedAction}>
              <Feather name="message-circle" size={16} color={colors.mutedForeground} />
              <Text style={[styles.feedActionText, { color: colors.mutedForeground }]}>{post.replies}</Text>
            </Pressable>
            <Pressable style={styles.feedAction}>
              <Feather name="more-horizontal" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
type TabType = "ojear" | "misgrupos" | "tablon";

export default function GruposScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [tab, setTab] = useState<TabType>("ojear");
  const [showCreate, setShowCreate] = useState(false);
  const { grupos: gruposCreados } = useGrupos();

  const TABS: { key: TabType; label: string }[] = [
    { key: "ojear", label: "Ojear" },
    { key: "misgrupos", label: "Mis Grupos" },
    { key: "tablon", label: "Mi tablón" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      {/* Fixed header */}
      <View style={[styles.fixedHeader, { paddingTop: topPad }]}>
        <View style={[styles.headerRow, { paddingHorizontal: 20 }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Grupos</Text>
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[
                styles.tabItem,
                tab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: tab === t.key ? colors.foreground : colors.mutedForeground },
                  tab === t.key && { fontWeight: "700" },
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {tab === "ojear" && <TabOjear colors={colors} />}
        {tab === "misgrupos" && (
          <TabMisGrupos colors={colors} onCreatePress={() => setShowCreate(true)} gruposCreados={gruposCreados} />
        )}
        {tab === "tablon" && <TabTablon colors={colors} />}
      </View>

      <CreateGroupSheet visible={showCreate} onClose={() => setShowCreate(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fixedHeader: { zIndex: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", height: 44 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 10, marginTop: 2 },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    marginTop: 4,
  },
  tabItem: { paddingVertical: 11, marginRight: 28, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabText: { fontSize: 15 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

  // Sections
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  verTodos: { fontSize: 14, fontWeight: "600" },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },

  // Popular rows
  popularRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  popularTipo: { fontSize: 11, marginBottom: 2 },
  popularName: { fontSize: 14, fontWeight: "700" },
  popularMembers: { fontSize: 12, marginTop: 2 },

  // Tema rows
  temaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  temaIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  temaLabel: { flex: 1, fontSize: 15 },

  // Mis Grupos
  emptyBox: { borderWidth: 1, borderRadius: 14, padding: 16, borderStyle: "dashed" },
  emptyText: { fontSize: 14, lineHeight: 22 },
  divider: { height: 1, marginBottom: 24 },
  unitoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },

  grupoNameRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  adminBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  adminBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },

  // Feed / tablón
  feedCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  feedHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  feedAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  feedInitials: { fontSize: 14, fontWeight: "700" },
  feedAuthor: { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  feedMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  feedGroup: { fontSize: 12, fontWeight: "600", flex: 1 },
  feedTime: { fontSize: 12 },
  feedText: { fontSize: 14, lineHeight: 22 },
  leerMas: { fontSize: 14, fontWeight: "600", marginTop: -6 },
  feedActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
  },
  feedAction: { flexDirection: "row", alignItems: "center", gap: 5 },
  feedActionText: { fontSize: 13 },

  // Sheet
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
    gap: 14,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  sheetCloseRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { fontSize: 20, fontWeight: "700" },
  sheetCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sheetOptionIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  sheetOptionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  sheetOptionSub: { fontSize: 13 },
});
