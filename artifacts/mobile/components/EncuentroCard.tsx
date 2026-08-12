import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { Encuentro } from "@/data/encuentros";
import { formatearFecha } from "@/data/encuentros";

type Props = {
  encuentro: Encuentro;
  onPress: () => void;
  onCalendarPress: () => void;
};

export function EncuentroCard({ encuentro, onPress, onCalendarPress }: Props) {
  const fechaTexto = formatearFecha(encuentro.fechaISO);
  const extraInscritos = Math.max(0, encuentro.inscritos - encuentro.participantes.length);

  return (
    <View style={styles.card}>
      {/* Hero — imagen del tema */}
      <Pressable onPress={onPress} style={styles.heroWrap}>
        {encuentro.heroImagen ? (
          <Image source={encuentro.heroImagen} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : null}
      </Pressable>

      {/* Contenido */}
      <View style={styles.body}>
        {/* Fila fecha + avatares */}
        <View style={styles.metaRow}>
          <View style={styles.fechaChip}>
            <Feather name="calendar" size={12} color="#f9f9f9" style={{ marginRight: 5 }} />
            <Text style={styles.fechaText}>{fechaTexto}  {encuentro.horaTexto}</Text>
          </View>

          <View style={styles.avatarsRow}>
            {encuentro.participantes.slice(0, 3).map((p, i) => (
              <View
                key={p.id}
                style={[
                  styles.avatar,
                  { backgroundColor: p.avatarColor, marginLeft: i === 0 ? 0 : -8 },
                ]}
              >
                <Text style={styles.avatarText}>{p.iniciales[0]}</Text>
              </View>
            ))}
            {extraInscritos > 0 && (
              <Text style={styles.inscritosText}>+{extraInscritos}</Text>
            )}
          </View>
        </View>

        {/* Guía + Título con avatar */}
        <View style={styles.titleRow}>
          <View style={[styles.titleAvatar, { backgroundColor: encuentro.guia.avatarColor }]}>
            {encuentro.guia.foto ? (
              <Image source={encuentro.guia.foto} style={styles.heroAvatarImg} contentFit="cover" />
            ) : (
              <Text style={styles.titleAvatarText}>{encuentro.guia.iniciales}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.guideNameBody} numberOfLines={1}>{encuentro.guia.nombre}</Text>
            <Text style={styles.titulo} numberOfLines={2}>{encuentro.titulo}</Text>
          </View>
        </View>

        {/* Descripción */}
        <Text style={styles.descripcion} numberOfLines={3}>{encuentro.descripcion}</Text>

        {/* Botón calendario */}
        <Pressable
          onPress={onCalendarPress}
          style={({ pressed }) => [styles.calBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#7354A0" }]} />
          <Text style={styles.calBtnText}>Añadir a mi calendario</Text>
          <Feather name="calendar" size={16} color="#F9F9F9" style={{ marginLeft: 8 }} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(218,212,236,0.12)",
  },
  heroWrap: {
    width: "100%",
    height: 200,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
  },
  heroAvatarImg: {
    width: "100%",
    height: "100%",
  },
  heroAvatarText: {
    color: "#fff",
    fontSize: 26,
    fontFamily: "Manrope",
    fontWeight: "700",
  },
  guideNameBody: {
    color: "rgba(244,218,213,0.8)",
    fontSize: 12,
    fontFamily: "Manrope",
    fontWeight: "600",
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  titleAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
  },
  titleAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Manrope",
    fontWeight: "700",
  },
  body: {
    padding: 16,
    gap: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fechaChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  fechaText: {
    color: "#F4F4F4",
    fontSize: 12,
    fontFamily: "Manrope",
    fontWeight: "500",
  },
  avatarsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#1B060F",
  },
  avatarText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Manrope",
    fontWeight: "700",
  },
  inscritosText: {
    color: "#F4DAD5",
    fontSize: 12,
    fontFamily: "Manrope",
    fontWeight: "600",
    marginLeft: 6,
  },
  titulo: {
    color: "#F4F4F4",
    fontSize: 18,
    fontFamily: "Manrope",
    fontWeight: "700",
    lineHeight: 24,
  },
  descripcion: {
    color: "rgba(244,218,213,0.75)",
    fontSize: 13,
    fontFamily: "Manrope",
    fontWeight: "400",
    lineHeight: 19,
  },
  calBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    paddingVertical: 13,
    marginTop: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5D6FF",
  },
  calBtnText: {
    color: "#F9F9F9",
    fontSize: 15,
    fontFamily: "Manrope",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
