import React, { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ENCUENTROS, formatearFechaDetalle } from "@/data/encuentros";
import { CalendarioEncuentroSheet } from "@/components/CalendarioEncuentroSheet";

const H_PAD = 22;
const HERO_H = 300;
const AVATAR_SIZE = 40;

export default function EncuentroDetalle() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const encuentro = ENCUENTROS.find((e) => e.id === id);
  const [asistencia, setAsistencia] = useState(false);
  const [calSheet, setCalSheet] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  function handleShare() {
    Share.share({ message: `${encuentro?.titulo} — RESONANCIA` }).catch(() => {});
  }

  if (!encuentro) {
    return (
      <View style={styles.root}>
        <StatusBar hidden />
        <LinearGradient colors={["#340D1A", "#190913"]} style={StyleSheet.absoluteFill} />
        <View style={[styles.navRow, { top: topPad + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.navBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color="#F4F4F4" />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Encuentro no encontrado</Text>
        </View>
      </View>
    );
  }

  const extraInscritos = Math.max(0, encuentro.inscritos - encuentro.participantes.length);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <LinearGradient colors={["#2A0A14", "#1B060F"]} style={StyleSheet.absoluteFill} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.heroWrap}>
          <Image source={encuentro.imagen} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={["transparent", "rgba(27,6,15,0.85)"]}
            style={styles.heroGradient}
          />

          {/* Botones flotantes */}
          <View style={[styles.navRow, { top: topPad + 8 }]}>
            <Pressable
              onPress={() => router.back()}
              style={styles.navBtn}
              hitSlop={8}
            >
              <Feather name="arrow-left" size={20} color="#F4F4F4" />
            </Pressable>
            <Pressable onPress={handleShare} style={styles.navBtn} hitSlop={8}>
              <Feather name="share-2" size={20} color="#F4F4F4" />
            </Pressable>
          </View>
        </View>

        {/* ── Contenido ── */}
        <View style={styles.content}>

          {/* Chip de fecha */}
          <View style={styles.fechaChipWrap}>
            <View style={styles.fechaChip}>
              <Feather name="calendar" size={13} color="#F9F9F9" style={{ marginRight: 6 }} />
              <Text style={styles.fechaText}>
                {formatearFechaDetalle(encuentro.fechaISO, encuentro.horaTexto)}
              </Text>
            </View>
          </View>

          {/* Título */}
          <Text style={styles.titulo}>{encuentro.titulo}</Text>

          {/* Descripción */}
          <Text style={styles.descripcion}>{encuentro.descripcion}</Text>

          {/* ── Guía ── */}
          <Text style={styles.sectionLabel}>Guía</Text>
          <Pressable style={styles.guiaCard} android_ripple={{ color: "rgba(255,255,255,0.05)" }}>
            {/* Avatar */}
            <View style={[styles.guiaAvatar, { backgroundColor: encuentro.guia.avatarColor }]}>
              <Text style={styles.guiaAvatarText}>{encuentro.guia.iniciales}</Text>
            </View>
            {/* Info */}
            <View style={styles.guiaInfo}>
              <Text style={styles.guiaNombre}>{encuentro.guia.nombre}</Text>
              <Text style={styles.guiaEncuentros}>{encuentro.guia.encuentros} encuentros</Text>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(244,244,244,0.4)" />
          </Pressable>

          {/* ── Participantes ── */}
          <Text style={styles.sectionLabel}>Participantes</Text>
          <View style={styles.participantesRow}>
            {encuentro.participantes.slice(0, 6).map((p, i) => (
              <View
                key={p.id}
                style={[
                  styles.avatar,
                  {
                    backgroundColor: p.avatarColor,
                    marginLeft: i === 0 ? 0 : -10,
                    zIndex: 10 - i,
                  },
                ]}
              >
                <Text style={styles.avatarText}>{p.iniciales[0]}</Text>
              </View>
            ))}
            {extraInscritos > 0 && (
              <View style={[styles.avatar, styles.avatarExtra, { marginLeft: -10 }]}>
                <Text style={styles.avatarExtraText}>+{extraInscritos}</Text>
              </View>
            )}
          </View>

          {/* Botón asistencia */}
          <Pressable
            style={[styles.asistenciaBtn, asistencia && styles.asistenciaBtnConfirmed]}
            onPress={() => setAsistencia((v) => !v)}
          >
            {asistencia ? (
              <>
                <Text style={styles.asistenciaBtnText}>¡Asistencia confirmada!</Text>
                <Feather name="check" size={16} color="#1B060F" style={{ marginLeft: 8 }} />
              </>
            ) : (
              <Text style={styles.asistenciaBtnText}>Confirmar asistencia</Text>
            )}
          </Pressable>

          {/* Botón añadir al calendario */}
          <Pressable
            style={({ pressed }) => [styles.calBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => setCalSheet(true)}
          >
            <Feather name="calendar" size={16} color="#F9F9F9" style={{ marginRight: 8 }} />
            <Text style={styles.calBtnText}>Añadir a mi calendario</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Sheet de calendario */}
      {encuentro && (
        <CalendarioEncuentroSheet
          encuentro={encuentro}
          visible={calSheet}
          onClose={() => setCalSheet(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1B060F",
  },
  scroll: {
    flex: 1,
  },

  /* Hero */
  heroWrap: {
    width: "100%",
    height: HERO_H,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  navRow: {
    position: "absolute",
    left: H_PAD,
    right: H_PAD,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(27,6,15,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Content */
  content: {
    paddingHorizontal: H_PAD,
    paddingTop: 24,
  },

  /* Fecha */
  fechaChipWrap: {
    alignItems: "center",
    marginBottom: 18,
  },
  fechaChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(218,212,236,0.1)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(218,212,236,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  fechaText: {
    color: "#F9F9F9",
    fontSize: 14,
    fontFamily: "Manrope",
    fontWeight: "600",
  },

  /* Título */
  titulo: {
    color: "#F4F4F4",
    fontSize: 24,
    fontFamily: "Manrope",
    fontWeight: "800",
    lineHeight: 32,
    textAlign: "center",
    marginBottom: 14,
  },

  /* Descripción */
  descripcion: {
    color: "rgba(244,218,213,0.75)",
    fontSize: 15,
    fontFamily: "Manrope",
    fontWeight: "400",
    lineHeight: 23,
    textAlign: "center",
    marginBottom: 32,
  },

  /* Sección label */
  sectionLabel: {
    color: "rgba(244,244,244,0.55)",
    fontSize: 13,
    fontFamily: "Manrope",
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  /* Guía card */
  guiaCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(218,212,236,0.1)",
    padding: 14,
    marginBottom: 28,
  },
  guiaAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  guiaAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Manrope",
    fontWeight: "700",
  },
  guiaInfo: {
    flex: 1,
  },
  guiaNombre: {
    color: "#F4F4F4",
    fontSize: 16,
    fontFamily: "Manrope",
    fontWeight: "700",
  },
  guiaEncuentros: {
    color: "rgba(244,218,213,0.6)",
    fontSize: 13,
    fontFamily: "Manrope",
    fontWeight: "400",
    marginTop: 2,
  },

  /* Participantes */
  participantesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1B060F",
  },
  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Manrope",
    fontWeight: "700",
  },
  avatarExtra: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  avatarExtraText: {
    color: "#F4F4F4",
    fontSize: 12,
    fontFamily: "Manrope",
    fontWeight: "700",
  },

  /* Botón asistencia */
  asistenciaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 30,
    paddingVertical: 16,
    marginTop: 4,
  },
  asistenciaBtnConfirmed: {
    backgroundColor: "#F9F9F9",
    opacity: 0.9,
  },
  asistenciaBtnText: {
    color: "#1B060F",
    fontSize: 16,
    fontFamily: "Manrope",
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  /* Botón calendario */
  calBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5146A8",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(218,212,236,0.25)",
    paddingVertical: 14,
    marginTop: 10,
  },
  calBtnText: {
    color: "#F9F9F9",
    fontSize: 15,
    fontFamily: "Manrope",
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  /* Not found */
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    color: "rgba(244,244,244,0.5)",
    fontSize: 16,
    fontFamily: "Manrope",
  },
});
