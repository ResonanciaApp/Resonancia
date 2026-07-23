import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { Encuentro } from "@/data/encuentros";

const STORAGE_KEY = "@cal_encuentros";
const GOLD = "#F7CB6B";
const WARM_BLACK = "#1B060F";

type CalState = "idle" | "loading" | "done" | "error";

// ── Phone hero (drawn with Views) ─────────────────────────────────────────────
function PhoneMockup({ titulo, horaTexto }: { titulo: string; horaTexto: string }) {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const horaDisplay = `${h}:${m}`;
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const fechaDisplay = `${dias[now.getDay()]}, ${now.getDate()} ${meses[now.getMonth()]}`;

  return (
    <View style={phone.phone}>
      {/* Notch */}
      <View style={phone.notch} />

      {/* Screen */}
      <View style={phone.screen}>
        {/* Lock icon */}
        <Text style={phone.lockIcon}>🔒</Text>

        {/* Time */}
        <Text style={phone.time}>{horaDisplay}</Text>
        <Text style={phone.date}>{fechaDisplay}</Text>

        {/* Notification card */}
        <View style={phone.notifCard}>
          {/* App icon */}
          <View style={phone.appIcon}>
            <LinearGradient
              colors={["#F7CB6B", "#FBA980"]}
              style={phone.appIconGrad}
            >
              <Text style={phone.appIconText}>R</Text>
            </LinearGradient>
          </View>

          {/* Text */}
          <View style={phone.notifText}>
            <Text style={phone.notifTitle} numberOfLines={1}>
              ¡El encuentro está por comenzar!
            </Text>
            <Text style={phone.notifSub} numberOfLines={1}>
              {titulo} · {horaTexto}
            </Text>
          </View>

          {/* Time badge */}
          <Text style={phone.notifBadge}>ahora</Text>
        </View>
      </View>
    </View>
  );
}

// ── Sheet ─────────────────────────────────────────────────────────────────────
type Props = {
  encuentro: Encuentro | null;
  visible: boolean;
  onClose: () => void;
};

export function CalendarioEncuentroSheet({ encuentro, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(600)).current;
  const dimAnim = useRef(new Animated.Value(0)).current;
  const [calState, setCalState] = useState<CalState>("idle");

  // ── Load persisted state ───────────────────────────────────────────────────
  useEffect(() => {
    if (!visible || !encuentro) return;
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      const saved: string[] = JSON.parse(raw);
      if (saved.includes(encuentro.id)) setCalState("done");
      else setCalState("idle");
    });
  }, [visible, encuentro]);

  // ── Animations ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(600);
      dimAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 24,
          stiffness: 220,
          useNativeDriver: true,
        }),
        Animated.timing(dimAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, dimAnim, slideAnim]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(dimAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [slideAnim, dimAnim, onClose]);

  // ── Calendar logic (ICS file — no native rebuild needed) ─────────────────
  async function handleAddToCalendar() {
    if (!encuentro || calState === "loading" || calState === "done") return;
    setCalState("loading");

    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(
          "No disponible",
          "Tu dispositivo no puede compartir archivos de calendario en este momento.",
          [{ text: "Entendido", onPress: () => setCalState("idle") }]
        );
        return;
      }

      // Build ICS content
      const start = new Date(encuentro.fechaISO);
      const end = new Date(start.getTime() + 90 * 60 * 1000);

      const fmt = (d: Date) =>
        d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

      const uid = `${encuentro.id}-${Date.now()}@resonancia.app`;
      const now = fmt(new Date());

      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//RESONANCIA//Casa del Cuenco//ES",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART:${fmt(start)}`,
        `DTEND:${fmt(end)}`,
        `SUMMARY:${encuentro.titulo}`,
        `DESCRIPTION:Encuentro en vivo · RESONANCIA\\nGuía: ${encuentro.guia.nombre}`,
        "ORGANIZER:RESONANCIA Casa del Cuenco",
        "BEGIN:VALARM",
        "TRIGGER:-PT10M",
        "ACTION:DISPLAY",
        "DESCRIPTION:Tu encuentro en vivo está por comenzar",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");

      // Write to temp file
      const filePath =
        (FileSystem.cacheDirectory ?? "") +
        `encuentro-${encuentro.id}.ics`;

      await FileSystem.writeAsStringAsync(filePath, ics, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share/open → iOS shows native "Add to Calendar" sheet
      await Sharing.shareAsync(filePath, {
        mimeType: "text/calendar",
        dialogTitle: "Agregar al calendario",
        UTI: "public.calendar-event",
      });

      // Persist confirmation
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const saved: string[] = raw ? JSON.parse(raw) : [];
      if (!saved.includes(encuentro.id)) {
        saved.push(encuentro.id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      }

      setCalState("done");
    } catch {
      setCalState("error");
    }
  }

  const isDone = calState === "done";
  const isLoading = calState === "loading";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: dimAnim }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Sheet */}
      <View style={styles.sheetContainer}>
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 24 },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Cierre */}
          <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={10}>
            <Feather name="x" size={20} color="rgba(244,244,244,0.6)" />
          </Pressable>

          {/* Hero — mockup teléfono */}
          {encuentro && (
            <View style={styles.heroWrap}>
              <PhoneMockup titulo={encuentro.titulo} horaTexto={encuentro.horaTexto} />
            </View>
          )}

          {/* Texto */}
          <Text style={styles.titulo}>¡Gracias por sumarte{"\n"}al encuentro!</Text>
          <Text style={styles.descripcion}>
            Agrega este encuentro a tu calendario para que te avisemos unos minutos antes de comenzar
          </Text>

          {/* Botón */}
          <Pressable
            onPress={handleAddToCalendar}
            disabled={isDone || isLoading}
            style={({ pressed }) => [
              styles.calBtn,
              isDone && styles.calBtnDone,
              { opacity: pressed && !isDone ? 0.85 : 1 },
            ]}
          >
            {isDone ? (
              <>
                <Feather name="check" size={16} color={WARM_BLACK} style={{ marginRight: 8 }} />
                <Text style={styles.calBtnText}>¡Añadido al calendario!</Text>
              </>
            ) : (
              <>
                <Text style={styles.calBtnText}>
                  {isLoading ? "Agregando…" : "Agregar al calendario"}
                </Text>
                {!isLoading && (
                  <Feather name="chevron-right" size={18} color={WARM_BLACK} style={{ marginLeft: 6 }} />
                )}
              </>
            )}
          </Pressable>

          {calState === "error" && (
            <Text style={styles.errorText}>
              No se pudo agregar el evento. Verificá los permisos del calendario.
            </Text>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  sheetContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1E0910",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderColor: "rgba(247,203,107,0.12)",
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  heroWrap: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 28,
  },
  titulo: {
    color: "#F4F4F4",
    fontSize: 22,
    fontFamily: "Manrope",
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 30,
    marginBottom: 12,
  },
  descripcion: {
    color: "rgba(244,218,213,0.72)",
    fontSize: 14,
    fontFamily: "Manrope",
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  calBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GOLD,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
  },
  calBtnDone: {
    backgroundColor: "#4CAF50",
  },
  calBtnText: {
    color: WARM_BLACK,
    fontSize: 16,
    fontFamily: "Manrope",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  errorText: {
    color: "#FBA980",
    fontSize: 13,
    fontFamily: "Manrope",
    textAlign: "center",
    marginTop: 12,
  },
});

// ── Phone mockup styles ───────────────────────────────────────────────────────
const PHONE_W = 200;
const PHONE_H = 260;
const SCREEN_R = 24;

const phone = StyleSheet.create({
  phone: {
    width: PHONE_W,
    height: PHONE_H,
    backgroundColor: "#0E0E14",
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#2A2A36",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
  },
  notch: {
    width: 60,
    height: 14,
    backgroundColor: "#0E0E14",
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 8,
    zIndex: 2,
  },
  screen: {
    flex: 1,
    backgroundColor: "#1A1A2E",
    borderRadius: SCREEN_R,
    marginHorizontal: 4,
    marginBottom: 4,
    alignItems: "center",
    paddingTop: 8,
    overflow: "hidden",
  },
  lockIcon: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.7,
  },
  time: {
    color: "#FFFFFF",
    fontSize: 40,
    fontFamily: "Manrope",
    fontWeight: "200",
    letterSpacing: -1,
    lineHeight: 46,
  },
  date: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontFamily: "Manrope",
    fontWeight: "400",
    marginBottom: 14,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 12,
    marginHorizontal: 8,
    padding: 8,
    gap: 6,
  },
  appIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    overflow: "hidden",
    flexShrink: 0,
  },
  appIconGrad: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  appIconText: {
    color: "#1B060F",
    fontSize: 14,
    fontFamily: "Manrope",
    fontWeight: "800",
  },
  notifText: {
    flex: 1,
  },
  notifTitle: {
    color: "#1A1A1A",
    fontSize: 9,
    fontFamily: "Manrope",
    fontWeight: "700",
    lineHeight: 12,
  },
  notifSub: {
    color: "#555",
    fontSize: 8,
    fontFamily: "Manrope",
    fontWeight: "400",
    lineHeight: 11,
  },
  notifBadge: {
    color: "#888",
    fontSize: 7,
    fontFamily: "Manrope",
    flexShrink: 0,
  },
});
