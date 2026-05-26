import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { useUserProfile } from "@/context/UserProfileContext";
import { useColors } from "@/hooks/useColors";
import { formatRelativeTime, useGrupoPosts } from "@/hooks/useGrupoPosts";
import { type GrupoLocal, useGrupos } from "@/hooks/useGrupos";

// ─── Gallery (must match crear.tsx) ───────────────────────────────────────────
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

// ─── Seed data (demo groups) ─────────────────────────────────────────────────
const SEED_GRUPOS: Record<string, {
  name: string; description: string; moderator: string; modColor: string; modInitials: string;
  members: number; icon: React.ComponentProps<typeof Feather>["name"];
  color: string; gradient: [string, string];
  rules: string[];
  memberList: { name: string; role: string; color: string; initials: string; active: boolean }[];
  posts: {
    id: string; author: string; initials: string; color: string;
    time: string; text: string; likes: number; replies: number; pinned?: boolean;
  }[];
}> = {
  "g1": {
    name: "Meditación Vipassana",
    description: "Práctica y diálogo sobre la meditación de visión profunda",
    moderator: "Sofía Herrera",
    modColor: "#E8C87A",
    modInitials: "SH",
    members: 234,
    icon: "wind",
    color: "#EDD9B8",
    gradient: ["#BF9B70", "#6B4E28"],
    rules: ["Respetar todas las experiencias sin juzgar", "No dar consejos no solicitados", "Mantener el espacio sagrado"],
    memberList: [
      { name: "Sofía Herrera", role: "Moderadora", color: "#E8C87A", initials: "SH", active: true },
      { name: "Martín Paz", role: "Miembro", color: "#A8C4A8", initials: "MP", active: true },
      { name: "Luna Vega", role: "Miembro", color: "#C8B4E0", initials: "LV", active: false },
      { name: "Carlos Medina", role: "Miembro", color: "#EDD9B8", initials: "CM", active: true },
      { name: "Valentina Ríos", role: "Miembro", color: "#D4709A", initials: "VR", active: false },
    ],
    posts: [
      { id: "p1", author: "Sofía Herrera", initials: "SH", color: "#E8C87A", time: "Hoy · 09:15", text: "📌 Recordatorio: esta semana comenzamos el ciclo de 10 días de práctica en silencio. Pueden compartir su experiencia aquí cada noche. ¿Quiénes se suman?", likes: 18, replies: 7, pinned: true },
      { id: "p2", author: "Martín Paz", initials: "MP", color: "#A8C4A8", time: "Hoy · 08:40", text: "Ayer tuve una sesión muy profunda. En un momento sentí que el pensamiento se disolvía completamente. ¿Alguien más vivió algo parecido al principio?", likes: 12, replies: 4 },
      { id: "p3", author: "Valentina Ríos", initials: "VR", color: "#D4709A", time: "Ayer · 22:10", text: "¿Alguien tiene recomendaciones para retiros de Vipassana en Argentina? Estoy buscando algo en la segunda mitad del año 🙏", likes: 8, replies: 11 },
      { id: "p4", author: "Carlos Medina", initials: "CM", color: "#EDD9B8", time: "Ayer · 18:30", text: "Comparto este artículo sobre los efectos de Vipassana en la neuroplasticidad cerebral. Fascinante lo que la ciencia está descubriendo.", likes: 24, replies: 3 },
    ],
  },
  "g2": {
    name: "Cuencos y Frecuencias",
    description: "Todo sobre cuencos tibetanos, de cristal y terapia de sonido",
    moderator: "Casa del Cuenco",
    modColor: "#B6955F",
    modInitials: "CC",
    members: 567,
    icon: "disc",
    color: "#E8C87A",
    gradient: ["#7A5520", "#3E2208"],
    rules: ["Compartir con generosidad y apertura", "Incluir fuente cuando sea posible", "Cero spam comercial"],
    memberList: [
      { name: "Casa del Cuenco", role: "Moderador", color: "#B6955F", initials: "CC", active: true },
      { name: "Sofía Herrera", role: "Miembro", color: "#E8C87A", initials: "SH", active: true },
      { name: "Luna Vega", role: "Miembro", color: "#C8B4E0", initials: "LV", active: true },
      { name: "Pablo Torres", role: "Miembro", color: "#8AAAD4", initials: "PT", active: false },
      { name: "Ana Quiroga", role: "Miembro", color: "#EDD9B8", initials: "AQ", active: true },
      { name: "Tomás Blanco", role: "Miembro", color: "#A8C4A8", initials: "TB", active: false },
    ],
    posts: [
      { id: "p1", author: "Casa del Cuenco", initials: "CC", color: "#B6955F", time: "Hoy · 11:00", text: "📌 Nueva sesión disponible en la app: 'El Lago de Cristal' — cuencos de cuarzo en sol mayor para la claridad mental. ¡A escucharla y compartir qué sienten! 🎶", likes: 41, replies: 12, pinned: true },
      { id: "p2", author: "Luna Vega", initials: "LV", color: "#C8B4E0", time: "Hoy · 09:30", text: "Compartí unas fotos de mi set nuevo 🎶 Cuenco tibetano en FA, dos de cristal en SOL y RE. Tardé 3 años en armarlo y por fin está completo. ¿Alguien más colecciona?", likes: 33, replies: 9 },
      { id: "p3", author: "Pablo Torres", initials: "PT", color: "#8AAAD4", time: "Ayer · 20:15", text: "Pregunta para los que practican: ¿cada cuánto hacen sesiones personales en casa? Yo estoy tratando de instalar una rutina diaria de 20 minutos.", likes: 15, replies: 14 },
      { id: "p4", author: "Ana Quiroga", initials: "AQ", color: "#EDD9B8", time: "Ayer · 16:00", text: "Descubrí que el cuenco en nota SI tiene un efecto increíble cuando trabajo con el chakra corona en clientes. ¿Alguien más trabaja en sesiones terapéuticas?", likes: 19, replies: 6 },
      { id: "p5", author: "Sofía Herrera", initials: "SH", color: "#E8C87A", time: "Lunes · 12:00", text: "Para los que están empezando: este es el orden de notas que uso en mis baños de cuencos. DO → RE → MI → FA → SOL → LA → SI. Cada nota corresponde a un chakra. 🙏", likes: 52, replies: 18 },
    ],
  },
  "g3": {
    name: "Sueños Lúcidos",
    description: "Técnicas y experiencias de lucidez onírica",
    moderator: "Luna Vega",
    modColor: "#C8B4E0",
    modInitials: "LV",
    members: 189,
    icon: "moon",
    color: "#C8B4E0",
    gradient: ["#4A3260", "#251633"],
    rules: ["Describir sueños con detalle", "No interpretar los sueños de otros sin permiso", "Respetar la intimidad del espacio onírico"],
    memberList: [
      { name: "Luna Vega", role: "Moderadora", color: "#C8B4E0", initials: "LV", active: true },
      { name: "Sofía Herrera", role: "Miembro", color: "#E8C87A", initials: "SH", active: false },
      { name: "Tomás Blanco", role: "Miembro", color: "#8AAAD4", initials: "TB", active: true },
    ],
    posts: [
      { id: "p1", author: "Luna Vega", initials: "LV", color: "#C8B4E0", time: "Hoy · 07:00", text: "📌 Técnica de la semana: WILD (Wake Initiated Lucid Dream). Despertarse a las 5am, estar despierto 30 min, volver a dormir con intención. Quien lo pruebe que lo cuente aquí 🌙", likes: 28, replies: 8, pinned: true },
      { id: "p2", author: "Tomás Blanco", initials: "TB", color: "#8AAAD4", time: "Hoy · 06:45", text: "¡Anoche lo logré por primera vez! 🌙 Me di cuenta que estaba soñando cuando vi mis manos y tenían 7 dedos. Estuve lúcido unos 3 minutos antes de despertar de la emoción jaja", likes: 37, replies: 15 },
      { id: "p3", author: "Sofía Herrera", initials: "SH", color: "#E8C87A", time: "Ayer · 23:30", text: "Sueño de anoche: estaba en un templo en las nubes. Un anciano me entregó un cuenco de oro y dijo 'el sonido que buscas viene de adentro'. Al despertar me quedó una paz enorme.", likes: 22, replies: 5 },
    ],
  },
  "g4": {
    name: "Camino del Alma",
    description: "Reflexiones sobre espiritualidad, propósito y vida consciente",
    moderator: "Martín Paz",
    modColor: "#A8C4A8",
    modInitials: "MP",
    members: 421,
    icon: "sun",
    color: "#F0CC82",
    gradient: ["#C49A52", "#7A5C20"],
    rules: ["Compartir desde el corazón", "No hay respuestas correctas ni incorrectas", "Escuchar antes de responder"],
    memberList: [
      { name: "Martín Paz", role: "Moderador", color: "#A8C4A8", initials: "MP", active: true },
      { name: "Ana Quiroga", role: "Miembro", color: "#EDD9B8", initials: "AQ", active: true },
      { name: "Valentina Ríos", role: "Miembro", color: "#D4709A", initials: "VR", active: false },
      { name: "Carlos Medina", role: "Miembro", color: "#EDD9B8", initials: "CM", active: true },
    ],
    posts: [
      { id: "p1", author: "Martín Paz", initials: "MP", color: "#A8C4A8", time: "Hoy · 08:00", text: "📌 Pregunta de la semana: ¿qué práctica cotidiana te ha transformado más profundamente en los últimos 6 meses? Compartan sin filtros 🙏", likes: 31, replies: 19, pinned: true },
      { id: "p2", author: "Ana Quiroga", initials: "AQ", color: "#EDD9B8", time: "Hoy · 07:30", text: "Gracias por el espacio 🙏 Quiero compartir que después de 6 meses de práctica diaria con Resonancia, mi relación con el silencio cambió completamente. Ya no lo temo.", likes: 44, replies: 8 },
      { id: "p3", author: "Valentina Ríos", initials: "VR", color: "#D4709A", time: "Ayer · 19:00", text: "Una pregunta que me hago últimamente: ¿el propósito se descubre o se construye? ¿Qué piensan ustedes?", likes: 27, replies: 16 },
    ],
  },
};

// ─── View-model unified type ─────────────────────────────────────────────────
type ViewPost = {
  id: string;
  author: string;
  initials: string;
  color: string;
  time: string;
  text: string;
  likes: number;
  replies: number;
  pinned?: boolean;
  isLocal?: boolean;
};

type ViewModel = {
  id: string;
  name: string;
  description: string;
  moderator: string;
  modColor: string;
  modInitials: string;
  members: number;
  icon: React.ComponentProps<typeof Feather>["name"];
  color: string;
  gradient: [string, string];
  rules: string[];
  memberList: { name: string; role: string; color: string; initials: string; active: boolean }[];
  posts: ViewPost[];
  isAdmin: boolean;
  isLocalGroup: boolean;
  imageSrc: number | null;
  inviteCode?: string;
  privado?: boolean;
};

const DEFAULT_RULES_LOCAL = [
  "Compartir desde el respeto y la escucha",
  "No spam ni contenido comercial",
  "Mantener el espacio sagrado y seguro",
];

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
}

function buildLocalViewModel(
  g: GrupoLocal,
  userName: string,
  localPosts: ReturnType<typeof useGrupoPosts>["posts"],
): ViewModel {
  const userInitials = initialsFrom(userName);
  const userColor = "#B6955F";

  // welcome aparece arriba (pinned); el resto, más recientes después.
  const welcome = localPosts.find((p) => p.id === "welcome");
  const rest = localPosts.filter((p) => p.id !== "welcome");
  const ordered = welcome ? [welcome, ...rest] : rest;

  const realPosts: ViewPost[] = ordered.map((p) => ({
    id: p.id,
    author: p.author,
    initials: p.initials,
    color: p.color,
    time: p.id === "welcome" ? "Mensaje de bienvenida" : formatRelativeTime(p.createdAt),
    text: p.text,
    likes: p.likes,
    replies: p.replies,
    isLocal: true,
    pinned: p.id === "welcome",
  }));

  return {
    id: g.id,
    name: g.nombre,
    description: g.descripcion || "Un nuevo espacio en RESONANCIA.",
    moderator: userName,
    modColor: userColor,
    modInitials: userInitials,
    members: 1,
    icon: "users",
    color: "#B6955F",
    gradient: ["#B6955F", "#3E2208"],
    rules: DEFAULT_RULES_LOCAL,
    memberList: [
      { name: `${userName} (vos)`, role: "Admin", color: userColor, initials: userInitials, active: true },
    ],
    posts: realPosts,
    isAdmin: true,
    isLocalGroup: true,
    imageSrc: g.imageIdx !== null && g.imageIdx < GALLERY.length ? GALLERY[g.imageIdx] : null,
    inviteCode: g.inviteCode,
    privado: g.privado,
  };
}

function buildSeedViewModel(seedId: string, seed: typeof SEED_GRUPOS[string]): ViewModel {
  return {
    id: seedId,
    ...seed,
    posts: seed.posts.map((p) => ({ ...p })),
    isAdmin: false,
    isLocalGroup: false,
    imageSrc: null,
  };
}

type TabType = "discusion" | "miembros" | "info";

export default function GrupoDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<TabType>("discusion");
  const [compose, setCompose] = useState("");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const { username } = useUserProfile();
  const userName = username || "Explorador de Sonido";

  const { grupos, deleteGrupo, reload: reloadGrupos } = useGrupos();
  const localGrupo = useMemo(() => grupos.find((g) => g.id === id), [grupos, id]);

  const { posts: localPosts, addPost, ensureWelcomePost, togglePostLike, deletePost, reload: reloadPosts } = useGrupoPosts(
    localGrupo ? localGrupo.id : undefined,
  );

  const openPostMenu = useCallback(
    (postId: string, postAuthor: string, postText: string, groupName: string) => {
      Alert.alert(
        "Opciones",
        undefined,
        [
          {
            text: "Compartir",
            onPress: async () => {
              try {
                await Share.share({
                  message: `${postAuthor} en ${groupName}:\n\n${postText}\n\n— Compartido desde RESONANCIA`,
                });
              } catch {}
            },
          },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => {
              Alert.alert(
                "Eliminar publicación",
                "¿Seguro que quieres eliminar esta publicación? Esta acción no se puede deshacer.",
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Eliminar", style: "destructive", onPress: () => deletePost(postId) },
                ],
              );
            },
          },
          { text: "Cancelar", style: "cancel" },
        ],
      );
    },
    [deletePost],
  );

  // Sembrar el post de bienvenida como un post real (con id="welcome")
  // para que se le pueda dar Me gusta, comentar y compartir.
  useEffect(() => {
    if (!localGrupo || !localGrupo.bienvenida?.trim()) return;
    ensureWelcomePost({
      author: userName,
      initials: initialsFrom(userName),
      color: "#B6955F",
      text: localGrupo.bienvenida,
    });
  }, [localGrupo, userName, ensureWelcomePost]);

  useFocusEffect(
    useCallback(() => {
      reloadGrupos();
      reloadPosts();
    }, [reloadGrupos, reloadPosts]),
  );

  const grupo: ViewModel | null = useMemo(() => {
    if (localGrupo) return buildLocalViewModel(localGrupo, userName, localPosts);
    if (id && SEED_GRUPOS[id]) return buildSeedViewModel(id, SEED_GRUPOS[id]);
    return null;
  }, [localGrupo, userName, localPosts, id]);

  const toggleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      const willLike = !next.has(postId);
      if (willLike) next.add(postId);
      else next.delete(postId);
      // Persistir cambio de likes en el post (solo para grupos locales)
      if (grupo?.isLocalGroup) {
        togglePostLike(postId, willLike);
      }
      return next;
    });
  };

  const handleSend = () => {
    const text = compose.trim();
    if (!text || !grupo?.isLocalGroup) return;
    addPost({
      author: userName,
      initials: initialsFrom(userName),
      color: "#B6955F",
      text,
    });
    setCompose("");
  };

  const handleDeleteGroup = () => {
    if (!localGrupo) return;
    Alert.alert(
      "Eliminar grupo",
      `¿Seguro que quieres eliminar "${localGrupo.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await deleteGrupo(localGrupo.id);
            router.back();
          },
        },
      ],
    );
  };

  if (!grupo) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 32 }]}>
        <StatusBar barStyle="light-content" />
        <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginTop: 12 }}>
          Grupo no encontrado
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 6, textAlign: "center" }}>
          Este grupo ya no existe o fue eliminado.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 24, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <Text style={{ color: colors.foreground, fontWeight: "600" }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <SacredBackground />

        {/* Header */}
        <LinearGradient colors={grupo.gradient} style={[styles.header, { paddingTop: topPad + 12 }]}>
          <View style={styles.headerTop}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Feather name="arrow-left" size={22} color="#C8C1B5" />
            </Pressable>
            <Pressable hitSlop={12}>
              <Feather name="more-horizontal" size={22} color="#C8C1B5" />
            </Pressable>
          </View>

          <View style={styles.headerBody}>
            {grupo.imageSrc ? (
              <Image source={grupo.imageSrc} style={styles.groupIconImg} />
            ) : (
              <View style={[styles.groupIcon, { backgroundColor: grupo.color + "22" }]}>
                <Feather name={grupo.icon} size={26} color={grupo.color} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.groupName}>{grupo.name}</Text>
              <Text style={styles.groupSub} numberOfLines={1}>{grupo.description}</Text>
              <View style={styles.groupMeta}>
                <Feather name="users" size={11} color="#C8C1B5AA" />
                <Text style={styles.groupMetaText}>
                  {grupo.members} {grupo.members === 1 ? "miembro" : "miembros"}
                </Text>
                <Text style={styles.groupMetaDot}>·</Text>
                <View style={styles.activeDot} />
                <Text style={styles.groupMetaText}>activo ahora</Text>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {(["discusion", "miembros", "info"] as TabType[]).map((t) => (
              <Pressable key={t} onPress={() => setTab(t)} style={[styles.tabItem, tab === t && styles.tabItemActive]}>
                <Text style={[styles.tabText, { color: tab === t ? "#C8C1B5" : "#C8C1B588" }]}>
                  {t === "discusion" ? "Discusión" : t === "miembros" ? "Miembros" : "Info"}
                </Text>
              </Pressable>
            ))}
          </View>
        </LinearGradient>

        {/* ── Discusión ── */}
        {tab === "discusion" && (
          <>
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad + 90 }}
              showsVerticalScrollIndicator={false}
            >
              {grupo.posts.length === 0 ? (
                <View style={[styles.emptyState, { borderColor: colors.border }]}>
                  <Feather name="message-square" size={28} color={colors.mutedForeground} />
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sin publicaciones aún</Text>
                  <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                    Sé el primero en escribir algo en este grupo.
                  </Text>
                </View>
              ) : (
                grupo.posts.map((post) => (
                  <View
                    key={post.id}
                    style={[
                      styles.postCard,
                      {
                        backgroundColor: post.pinned ? colors.primary + "10" : colors.card,
                        borderColor: post.pinned ? colors.primary + "44" : colors.border,
                      },
                    ]}
                  >
                    {post.pinned && (
                      <View style={styles.pinnedRow}>
                        <Feather name="bookmark" size={11} color={colors.primary} />
                        <Text style={[styles.pinnedText, { color: colors.primary }]}>Fijado</Text>
                      </View>
                    )}
                    <View style={styles.postHeader}>
                      <Pressable
                        style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}
                        onPress={() => {
                          if (grupo.isLocalGroup) {
                            router.push({
                              pathname: "/grupo-post/[postId]",
                              params: { postId: post.id, grupoId: grupo.id },
                            });
                          }
                        }}
                      >
                        <View style={[styles.postAvatar, { backgroundColor: post.color + "30" }]}>
                          <Text style={[styles.postInitials, { color: post.color }]}>{post.initials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.postAuthor, { color: colors.foreground }]}>{post.author}</Text>
                          <Text style={[styles.postTime, { color: colors.mutedForeground }]}>{post.time}</Text>
                        </View>
                      </Pressable>
                      {grupo.isLocalGroup && (
                        <Pressable
                          hitSlop={10}
                          onPress={() => openPostMenu(post.id, post.author, post.text, grupo.name)}
                          style={styles.menuBtn}
                        >
                          <Feather name="more-horizontal" size={18} color={colors.mutedForeground} />
                        </Pressable>
                      )}
                    </View>
                    <Pressable
                      onPress={() => {
                        if (grupo.isLocalGroup) {
                          router.push({
                            pathname: "/grupo-post/[postId]",
                            params: { postId: post.id, grupoId: grupo.id },
                          });
                        }
                      }}
                    >
                      <Text style={[styles.postText, { color: colors.foreground }]}>{post.text}</Text>
                    </Pressable>
                    <View style={[styles.postActions, { borderTopColor: colors.border }]}>
                      <Pressable onPress={() => toggleLike(post.id)} style={styles.actionBtn}>
                        <Feather
                          name="heart"
                          size={15}
                          color={likedPosts.has(post.id) ? "#D4709A" : colors.mutedForeground}
                        />
                        <Text style={[styles.actionText, { color: likedPosts.has(post.id) ? "#D4709A" : colors.mutedForeground }]}>
                          {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.actionBtn}
                        onPress={() => {
                          if (grupo.isLocalGroup) {
                            router.push({
                              pathname: "/grupo-post/[postId]",
                              params: { postId: post.id, grupoId: grupo.id },
                            });
                          }
                        }}
                      >
                        <Feather name="message-square" size={15} color={colors.mutedForeground} />
                        <Text style={[styles.actionText, { color: colors.mutedForeground }]}>{post.replies}</Text>
                      </Pressable>
                      <Pressable
                        style={styles.actionBtn}
                        onPress={async () => {
                          try {
                            await Share.share({
                              message: `${post.author} en ${grupo.name}:\n\n${post.text}\n\n— Compartido desde RESONANCIA`,
                            });
                          } catch {
                            // usuario canceló o error al compartir
                          }
                        }}
                      >
                        <Feather name="share" size={15} color={colors.mutedForeground} />
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Compose bar */}
            <View style={[styles.composeBar, { paddingBottom: bottomPad + 8, backgroundColor: colors.background, borderTopColor: colors.border }]}>
              <View style={[styles.composeInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  value={compose}
                  onChangeText={setCompose}
                  placeholder={grupo.isLocalGroup ? "Escribir en el grupo..." : "Solo el creador puede publicar"}
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.composeText, { color: colors.foreground }]}
                  multiline
                  editable={grupo.isLocalGroup}
                />
              </View>
              <Pressable
                style={[styles.sendBtn, { backgroundColor: compose.trim() && grupo.isLocalGroup ? colors.primary : colors.card, borderColor: colors.border }]}
                onPress={handleSend}
                disabled={!grupo.isLocalGroup}
              >
                <Feather name="send" size={17} color={compose.trim() && grupo.isLocalGroup ? "#131D17" : colors.mutedForeground} />
              </Pressable>
            </View>
          </>
        )}

        {/* ── Miembros ── */}
        {tab === "miembros" && (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad + 40 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.memberCount, { color: colors.mutedForeground }]}>
              {grupo.members} {grupo.members === 1 ? "miembro" : "miembros"}
            </Text>
            {grupo.memberList.map((m) => (
              <View key={m.name} style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ position: "relative" }}>
                  <View style={[styles.memberAvatar, { backgroundColor: m.color + "30" }]}>
                    <Text style={[styles.memberInitials, { color: m.color }]}>{m.initials}</Text>
                  </View>
                  {m.active && <View style={styles.onlineDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberName, { color: colors.foreground }]}>{m.name}</Text>
                  <Text style={[styles.memberRole, { color: m.role === "Moderadora" || m.role === "Moderador" || m.role === "Admin" ? colors.primary : colors.mutedForeground }]}>
                    {m.role}
                  </Text>
                </View>
                <Pressable hitSlop={8}>
                  <Feather name="message-circle" size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ))}

            {grupo.isLocalGroup && (
              <View style={[styles.emptyState, { borderColor: colors.border, marginTop: 8 }]}>
                <Feather name="user-plus" size={24} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Invita a más personas</Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  Comparte el enlace desde la pestaña Info para que se unan al grupo.
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* ── Info ── */}
        {tab === "info" && (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad + 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* About */}
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.infoCardHeader}>
                <Feather name="info" size={16} color={colors.primary} />
                <Text style={[styles.infoCardTitle, { color: colors.foreground }]}>Sobre el grupo</Text>
              </View>
              <Text style={[styles.infoCardText, { color: colors.mutedForeground }]}>{grupo.description}</Text>
              {grupo.isLocalGroup && (
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, { backgroundColor: colors.primary + "22" }]}>
                    <Feather name={grupo.privado ? "lock" : "globe"} size={11} color={colors.primary} />
                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                      {grupo.privado ? "Privado" : "Público"}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Moderator */}
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.infoCardHeader}>
                <Feather name="shield" size={16} color={colors.primary} />
                <Text style={[styles.infoCardTitle, { color: colors.foreground }]}>
                  {grupo.isLocalGroup ? "Administrador" : "Moderación"}
                </Text>
              </View>
              <View style={styles.modRow}>
                <View style={[styles.modAvatar, { backgroundColor: grupo.modColor + "30" }]}>
                  <Text style={[styles.modInitials, { color: grupo.modColor }]}>{grupo.modInitials}</Text>
                </View>
                <Text style={[styles.modName, { color: colors.foreground }]}>{grupo.moderator}</Text>
              </View>
            </View>

            {/* Invite link (local groups) */}
            {grupo.isLocalGroup && grupo.inviteCode && (
              <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.infoCardHeader}>
                  <Feather name="link" size={16} color={colors.primary} />
                  <Text style={[styles.infoCardTitle, { color: colors.foreground }]}>Enlace de invitación</Text>
                </View>
                <View style={[styles.linkBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={1}>
                    {grupo.inviteCode}
                  </Text>
                </View>
              </View>
            )}

            {/* Rules */}
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.infoCardHeader}>
                <Feather name="book-open" size={16} color={colors.primary} />
                <Text style={[styles.infoCardTitle, { color: colors.foreground }]}>Reglas del espacio</Text>
              </View>
              {grupo.rules.map((rule, i) => (
                <View key={i} style={styles.ruleRow}>
                  <View style={[styles.ruleNum, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[styles.ruleNumText, { color: colors.primary }]}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.ruleText, { color: colors.foreground }]}>{rule}</Text>
                </View>
              ))}
            </View>

            {/* Leave / Delete */}
            {grupo.isLocalGroup ? (
              <Pressable
                onPress={handleDeleteGroup}
                style={[styles.leaveBtn, { borderColor: "#C0392B33", backgroundColor: "#C0392B0A" }]}
              >
                <Feather name="trash-2" size={15} color="#E07060" />
                <Text style={[styles.leaveText, { color: "#E07060" }]}>Eliminar grupo</Text>
              </Pressable>
            ) : (
              <Pressable style={[styles.leaveBtn, { borderColor: "#C0392B33", backgroundColor: "#C0392B0A" }]}>
                <Feather name="log-out" size={15} color="#E07060" />
                <Text style={[styles.leaveText, { color: "#E07060" }]}>Salir del grupo</Text>
              </Pressable>
            )}
          </ScrollView>
        )}

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 0 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerBody: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 16 },
  groupIcon: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  groupIconImg: { width: 52, height: 52, borderRadius: 14 },
  groupName: { color: "#C8C1B5", fontSize: 18, fontWeight: "700", marginBottom: 3 },
  groupSub: { color: "#C8C1B5AA", fontSize: 12, marginBottom: 6 },
  groupMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  groupMetaText: { color: "#C8C1B5AA", fontSize: 11 },
  groupMetaDot: { color: "#C8C1B5AA", fontSize: 11 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#7ED65A" },
  tabs: { flexDirection: "row" },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: "#C8C1B5" },
  tabText: { fontSize: 14, fontWeight: "600" },
  // Posts
  postCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12, gap: 10 },
  pinnedRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  pinnedText: { fontSize: 11, fontWeight: "600" },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  menuBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  postAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  postInitials: { fontSize: 13, fontWeight: "700" },
  postAuthor: { fontSize: 14, fontWeight: "700" },
  postTime: { fontSize: 11 },
  postText: { fontSize: 14, lineHeight: 22 },
  postActions: { flexDirection: "row", gap: 20, paddingTop: 10, borderTopWidth: 1 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionText: { fontSize: 13 },
  // Empty state
  emptyState: { borderRadius: 16, borderWidth: 1, borderStyle: "dashed", padding: 24, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 14, fontWeight: "700", marginTop: 4 },
  emptySub: { fontSize: 12, textAlign: "center", lineHeight: 18 },
  // Compose
  composeBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, padding: 12, borderTopWidth: 1, alignItems: "flex-end" },
  composeInput: { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 100 },
  composeText: { fontSize: 14 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  // Members
  memberCount: { fontSize: 12, fontWeight: "600", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  memberInitials: { fontSize: 14, fontWeight: "700" },
  onlineDot: { position: "absolute", bottom: 2, right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: "#7ED65A", borderWidth: 2, borderColor: "#131D17" },
  memberName: { fontSize: 14, fontWeight: "600" },
  memberRole: { fontSize: 12, marginTop: 2 },
  // Info
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14, gap: 12 },
  infoCardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoCardTitle: { fontSize: 15, fontWeight: "700" },
  infoCardText: { fontSize: 14, lineHeight: 21 },
  modRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  modAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  modInitials: { fontSize: 13, fontWeight: "700" },
  modName: { fontSize: 14, fontWeight: "600" },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  ruleNum: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  ruleNumText: { fontSize: 12, fontWeight: "700" },
  ruleText: { fontSize: 13, flex: 1, lineHeight: 19 },
  badgeRow: { flexDirection: "row", gap: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  linkBox: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  linkText: { fontSize: 13, fontWeight: "600" },
  leaveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, borderWidth: 1, paddingVertical: 14, marginTop: 8 },
  leaveText: { fontSize: 14, fontWeight: "700" },
});
