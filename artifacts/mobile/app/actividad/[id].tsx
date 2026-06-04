import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
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

import { SacredBackground } from "@/components/SacredBackground";
import { useColors } from "@/hooks/useColors";

const ACTIVITIES: Record<string, {
  title: string; organizer: string; city: string; address: string;
  date: string; time: string; type: string;
  description: string;
  gradient: [string, string]; orgColor: string; orgInitials: string;
  tags: string[];
}> = {
  "1": {
    title: "Baño de Cuencos al Atardecer",
    organizer: "Sofía Herrera",
    city: "Buenos Aires",
    address: "Parque Centenario, Sala de Meditación — Av. Díaz Vélez 4900",
    date: "Sábado 31 de mayo, 2026",
    time: "18:00 hs",
    type: "Presencial",
    description:
      "Una experiencia profunda de sanación sonora al caer el sol. Los cuencos tibetanos y de cristal generarán un campo vibracional que guiará tu cuerpo y mente hacia un estado de relajación profunda.\n\nNo se necesita experiencia previa. Traé ropa cómoda, una mantita y dispónte a recibir.",
    gradient: ["#7A5520", "#3E2208"],
    orgColor: "#f4c993",
    orgInitials: "SH",
    tags: ["Cuencos tibetanos", "Relajación", "Al aire libre"],
  },
  "2": {
    title: "Meditación Grupal en Parque",
    organizer: "Martín Paz",
    city: "Córdoba",
    address: "Parque Sarmiento — Sector Rosedal, entrada por Av. Poeta Lugones",
    date: "Domingo 1 de junio, 2026",
    time: "09:00 hs",
    type: "Presencial",
    description:
      "Arrancá el domingo con una meditación guiada al aire libre en uno de los parques más hermosos de Córdoba. Combinamos técnicas de respiración consciente, visualización y silencio compartido.\n\nLlevá esterilla o manta. Se recomienda llegar 10 minutos antes.",
    gradient: ["#3A5438", "#1E2E1C"],
    orgColor: "#A8C4A8",
    orgInitials: "MP",
    tags: ["Meditación", "Respiración", "Comunidad"],
  },
  "3": {
    title: "Círculo de Gong — Ciclo Lunar",
    organizer: "Luna Vega",
    city: "Madrid",
    address: "Espacio Ánanda — Calle Fuencarral 82, 2.º piso, Madrid",
    date: "Viernes 6 de junio, 2026",
    time: "20:00 hs",
    type: "Presencial",
    description:
      "El gong es uno de los instrumentos más poderosos para la transformación interior. En este círculo lunar trabajaremos con la energía del ciclo actual para soltar lo que ya no nos sirve y abrir espacio a lo nuevo.\n\nCada sesión es única e irrepetible. Ropa cómoda, bolsa de dormir o manta gruesa.",
    gradient: ["#4A3260", "#251633"],
    orgColor: "#C8B4E0",
    orgInitials: "LV",
    tags: ["Gong", "Ciclo lunar", "Transformación"],
  },
  "4": {
    title: "Retiro de Silencio — Weekend",
    organizer: "Casa del Cuenco",
    city: "Mendoza",
    address: "Finca La Quietud — Ruta Provincial 86 km 12, Valle de Uco, Mendoza",
    date: "14 y 15 de junio, 2026",
    time: "Llegada vie 18:00 · Salida sáb 17:00",
    type: "Retiro",
    description:
      "Un fin de semana de silencio, sonido y naturaleza en un entorno privilegiado de los Andes mendocinos. El programa incluye baños de cuencos, meditaciones guiadas, caminatas conscientes y momentos de silencio profundo.\n\nIncluye alojamiento y alimentación vegetariana. Cupos muy limitados.",
    gradient: ["#3A5438", "#1E2E1C"],
    orgColor: "#BE9650",
    orgInitials: "CC",
    tags: ["Retiro", "Silencio", "Naturaleza", "Full weekend"],
  },
};

export default function ActividadDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { id } = useLocalSearchParams<{ id: string }>();

  const [showReserva, setShowReserva] = useState(false);
  const [reservaEnviada, setReservaEnviada] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nota, setNota] = useState("");

  const [showMensaje, setShowMensaje] = useState(false);
  const [mensajeEnviado, setMensajeEnviado] = useState(false);
  const [mensajeTexto, setMensajeTexto] = useState("");

  const act = ACTIVITIES[id ?? "1"] ?? ACTIVITIES["1"];

  const handleEnviarReserva = () => {
    if (nombre.trim() && email.trim() && telefono.trim()) {
      setReservaEnviada(true);
    }
  };

  const handleEnviarMensaje = () => {
    if (mensajeTexto.trim()) {
      setMensajeEnviado(true);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      {/* Hero header */}
      <LinearGradient colors={act.gradient} style={[styles.hero, { paddingTop: topPad + 20 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>

        <View style={[styles.typeBadge, { backgroundColor: "#ffffff18" }]}>
          <Text style={styles.typeBadgeText}>{act.type}</Text>
        </View>

        <Text style={styles.heroTitle}>{act.title}</Text>

        <View style={styles.heroMeta}>
          <Feather name="map-pin" size={13} color="rgba(255,255,255,0.55)" />
          <Text style={styles.heroMetaText}>{act.city}</Text>
          <Text style={styles.heroMetaSep}>·</Text>
          <Feather name="calendar" size={13} color="rgba(255,255,255,0.55)" />
          <Text style={styles.heroMetaText}>{act.date}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hora + Fecha chips */}
        <View style={[styles.chipsRow, { paddingHorizontal: 20, marginTop: 20 }]}>
          <View style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="clock" size={14} color={colors.primary} />
            <View>
              <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>Horario</Text>
              <Text style={[styles.chipValue, { color: colors.foreground }]}>{act.time}</Text>
            </View>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="tag" size={14} color={colors.primary} />
            <View>
              <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>Modalidad</Text>
              <Text style={[styles.chipValue, { color: colors.foreground }]}>{act.type}</Text>
            </View>
          </View>
        </View>

        {/* Lugar — fila completa */}
        <View style={[styles.lugarCard, { marginHorizontal: 20, marginTop: 12, backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.lugarIconWrap, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="map-pin" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.lugarLabel, { color: colors.mutedForeground }]}>Lugar</Text>
            <Text style={[styles.lugarValue, { color: colors.foreground }]}>{act.address}</Text>
          </View>
          <Pressable
            style={[styles.mapaBtn, { borderColor: colors.border }]}
            hitSlop={8}
          >
            <Feather name="navigation" size={14} color={colors.accent} />
            <Text style={[styles.mapaBtnText, { color: colors.accent }]}>Mapa</Text>
          </Pressable>
        </View>

        {/* Description */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sobre esta actividad</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{act.description}</Text>
        </View>

        {/* Tags */}
        <View style={[styles.tagsRow, { paddingHorizontal: 20, marginTop: 16 }]}>
          {act.tags.map(tag => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Organizer */}
        <View style={[styles.organizerCard, { marginHorizontal: 20, backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.orgAvatar, { backgroundColor: act.orgColor + "30" }]}>
            <Text style={[styles.orgInitials, { color: act.orgColor }]}>{act.orgInitials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.orgLabel, { color: colors.mutedForeground }]}>Organiza</Text>
            <Text style={[styles.orgName, { color: colors.foreground }]}>{act.organizer}</Text>
          </View>
          <Pressable
            onPress={() => { setShowMensaje(true); setMensajeEnviado(false); setMensajeTexto(""); }}
            style={[styles.msgBtn, { borderColor: colors.border }]}
          >
            <Feather name="message-circle" size={16} color={colors.accent} />
            <Text style={[styles.msgBtnText, { color: colors.accent }]}>Mensaje</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* CTA fixed bottom */}
      <View style={[styles.ctaBar, { paddingBottom: bottomPad + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {reservaEnviada ? (
          <View style={[styles.ctaConfirmed, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Feather name="check-circle" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.ctaConfirmedTitle, { color: colors.primary }]}>Solicitud enviada</Text>
              <Text style={[styles.ctaConfirmedSub, { color: colors.mutedForeground }]}>
                {act.organizer} confirmará tu lugar a la brevedad
              </Text>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setShowReserva(true)}
            style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <LinearGradient colors={["#FFFFFF", "#BE9650"]} style={styles.ctaGrad}>
              <Feather name="send" size={17} color="#080F0A" />
              <Text style={styles.ctaText}>Solicitar reserva</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>

      {/* ── Modal Reserva ────────────────────────────────── */}
      <Modal
        visible={showReserva}
        animationType="slide"
        transparent
        onRequestClose={() => setShowReserva(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowReserva(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: bottomPad + 24 }]}>
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Solicitar reserva</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Completá tus datos y {act.organizer} confirmará tu lugar.
            </Text>

            <View style={styles.modalForm}>
              <ModalField icon="user" placeholder="Tu nombre completo" value={nombre} onChangeText={setNombre} colors={colors} />
              <ModalField icon="mail" placeholder="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" colors={colors} />
              <ModalField icon="phone" placeholder="Teléfono / WhatsApp" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" colors={colors} />

              <View style={[styles.textAreaRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput
                  value={nota}
                  onChangeText={setNota}
                  placeholder="Nota opcional para el organizador..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={3}
                  style={[styles.textAreaInput, { color: colors.foreground }]}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <Pressable
              onPress={handleEnviarReserva}
              style={({ pressed }) => [styles.modalBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <LinearGradient colors={["#FFFFFF", "#BE9650"]} style={styles.modalBtnGrad}>
                <Text style={styles.modalBtnText}>Enviar solicitud</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal Mensaje ────────────────────────────────── */}
      <Modal
        visible={showMensaje}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMensaje(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowMensaje(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: bottomPad + 24 }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            {mensajeEnviado ? (
              <View style={styles.sentBlock}>
                <View style={[styles.sentIcon, { backgroundColor: colors.primary + "22" }]}>
                  <Feather name="check-circle" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.sentTitle, { color: colors.foreground }]}>Mensaje enviado</Text>
                <Text style={[styles.sentSub, { color: colors.mutedForeground }]}>
                  {act.organizer} recibirá tu mensaje y podrá responderte pronto.
                </Text>
                <Pressable
                  onPress={() => setShowMensaje(false)}
                  style={[styles.sentClose, { borderColor: colors.border }]}
                >
                  <Text style={[styles.sentCloseText, { color: colors.foreground }]}>Cerrar</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {/* Org header */}
                <View style={styles.msgOrgRow}>
                  <View style={[styles.msgOrgAvatar, { backgroundColor: act.orgColor + "30" }]}>
                    <Text style={[styles.msgOrgInitials, { color: act.orgColor }]}>{act.orgInitials}</Text>
                  </View>
                  <View>
                    <Text style={[styles.msgOrgTo, { color: colors.mutedForeground }]}>Mensaje para</Text>
                    <Text style={[styles.msgOrgName, { color: colors.foreground }]}>{act.organizer}</Text>
                  </View>
                </View>

                <View style={[styles.msgInputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TextInput
                    value={mensajeTexto}
                    onChangeText={setMensajeTexto}
                    placeholder={`Escribí tu mensaje para ${act.organizer}...`}
                    placeholderTextColor={colors.mutedForeground}
                    multiline
                    numberOfLines={5}
                    style={[styles.msgInput, { color: colors.foreground }]}
                    textAlignVertical="top"
                    autoFocus
                  />
                </View>

                <Pressable
                  onPress={handleEnviarMensaje}
                  style={({ pressed }) => [styles.modalBtn, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <LinearGradient colors={["#FFFFFF", "#BE9650"]} style={styles.modalBtnGrad}>
                    <Feather name="send" size={16} color="#080F0A" />
                    <Text style={styles.modalBtnText}>Enviar mensaje</Text>
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function ModalField({ icon, placeholder, value, onChangeText, keyboardType, colors }: any) {
  return (
    <View style={[styles.fieldRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Feather name={icon} size={15} color={colors.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType ?? "default"}
        style={[styles.fieldInput, { color: colors.foreground }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 28, alignItems: "flex-start" },
  backBtn: { marginBottom: 20, width: 40, height: 40, justifyContent: "center" },
  typeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 },
  typeBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  heroTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "700", lineHeight: 30, marginBottom: 12 },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroMetaText: { color: "rgba(255,255,255,0.55)", fontSize: 12 },
  heroMetaSep: { color: "rgba(255,255,255,0.55)", fontSize: 12 },
  // Chips
  chipsRow: { flexDirection: "row", gap: 10 },
  chip: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  chipLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 2 },
  chipValue: { fontSize: 13, fontWeight: "700" },
  // Lugar
  lugarCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 1, padding: 16 },
  lugarIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  lugarLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 3 },
  lugarValue: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
  mapaBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  mapaBtnText: { fontSize: 12, fontWeight: "600" },
  // Content
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 23 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  tagText: { fontSize: 12, fontWeight: "600" },
  // Organizer
  organizerCard: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginTop: 24 },
  orgAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  orgInitials: { fontSize: 15, fontWeight: "700" },
  orgLabel: { fontSize: 11, marginBottom: 2 },
  orgName: { fontSize: 15, fontWeight: "700" },
  msgBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  msgBtnText: { fontSize: 13, fontWeight: "600" },
  // CTA bar
  ctaBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  ctaBtn: { borderRadius: 16, overflow: "hidden" },
  ctaGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  ctaText: { fontWeight: "700", fontSize: 16, color: "#080F0A" },
  ctaConfirmed: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 1.5, padding: 16 },
  ctaConfirmedTitle: { fontSize: 14, fontWeight: "700" },
  ctaConfirmedSub: { fontSize: 12, marginTop: 2 },
  // Modal shared
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 16, gap: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  modalSub: { fontSize: 13, lineHeight: 19, marginBottom: 4 },
  modalForm: { gap: 10 },
  fieldRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14 },
  fieldInput: { flex: 1, fontSize: 14 },
  textAreaRow: { borderRadius: 14, borderWidth: 1, padding: 14, minHeight: 80 },
  textAreaInput: { fontSize: 14, lineHeight: 21 },
  modalBtn: { borderRadius: 16, overflow: "hidden", marginTop: 4 },
  modalBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  modalBtnText: { color: "#080F0A", fontWeight: "700", fontSize: 16 },
  // Mensaje modal
  msgOrgRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  msgOrgAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  msgOrgInitials: { fontSize: 14, fontWeight: "700" },
  msgOrgTo: { fontSize: 11, marginBottom: 2 },
  msgOrgName: { fontSize: 15, fontWeight: "700" },
  msgInputWrap: { borderRadius: 16, borderWidth: 1, padding: 14, minHeight: 120 },
  msgInput: { fontSize: 14, lineHeight: 22 },
  // Enviado
  sentBlock: { alignItems: "center", paddingVertical: 20, gap: 12 },
  sentIcon: { width: 68, height: 68, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  sentTitle: { fontSize: 20, fontWeight: "700" },
  sentSub: { fontSize: 14, textAlign: "center", lineHeight: 21 },
  sentClose: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 12, marginTop: 4 },
  sentCloseText: { fontSize: 14, fontWeight: "600" },
});
