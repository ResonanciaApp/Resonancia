import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image as ExpoImage } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getGuide } from "@/data/guides";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { type LiveSessionItem, canEnterLiveSession, formatLiveSessionDate } from "@/hooks/useLiveSessions";

// ── Paleta ────────────────────────────────────────────────────────────────────
const WARM_BLACK = "#1B060F";
const PRIMARY_GOLD = "#F9F9F9";
const ACCENT_GOLD = "#F9F9F9";
const FOREGROUND = "#FFFFFF";
const MUTED = "#F4F4F4";
const BORDER = "#3D0E16";
const CARD_BG = "rgba(74,12,12,0.14)";

type Props = {
  session: LiveSessionItem;
  onEnter: (session: LiveSessionItem) => void;
};

export function LiveSessionCard({ session, onEnter }: Props) {
  const guide = getGuide(session.guideId);
  const dateStr = formatLiveSessionDate(session.scheduledAt);
  const canEnter = canEnterLiveSession(session.scheduledAt, session.scheduledEnd);
  const isPending = session.status === "pending";

  return (
    <View style={styles.card}>
      {/* Borde dorado superior decorativo */}
      <View style={styles.goldBar} />

      <View style={styles.row}>
        {/* Foto del guiador */}
        <View style={styles.photoWrap}>
          <ExpoImage
            source={guide.photo as never}
            style={styles.photo}
            contentFit="cover"
            placeholder={BLUR_PLACEHOLDER}
            transition={IMAGE_TRANSITION}
          />
          {/* Indicador de estado */}
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isPending ? ACCENT_GOLD : "#5CB85C" },
            ]}
          />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.guideName} numberOfLines={1}>
            {session.guideDisplayName ?? guide.name}
          </Text>
          <View style={styles.dateRow}>
            <Feather name="calendar" size={11} color={MUTED} style={{ marginRight: 5 }} />
            <Text style={styles.dateText} numberOfLines={2}>
              {dateStr}
            </Text>
          </View>
          {!!session.calEventTitle && (
            <Text style={styles.eventTitle} numberOfLines={1}>
              {session.calEventTitle}
            </Text>
          )}
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {isPending ? "Pendiente de confirmación" : "Confirmada"}
            </Text>
          </View>
        </View>

        {/* Botón entrar */}
        <Pressable
          style={({ pressed }) => [
            styles.enterBtn,
            !canEnter && styles.enterBtnDisabled,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => canEnter && onEnter(session)}
          disabled={!canEnter}
          hitSlop={4}
        >
          {canEnter ? (
            <>
              <LinearGradient
                colors={["#884D80", "#884D80"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Feather name="video" size={12} color={WARM_BLACK} />
              <Text style={styles.enterBtnText}>Entrar</Text>
            </>
          ) : (
            <Text style={styles.enterBtnTextDisabled}>Próximo</Text>
          )}
        </Pressable>
      </View>

      {/* Mensaje de disponibilidad */}
      {!canEnter && (
        <View style={styles.footer}>
          <Feather name="clock" size={11} color={MUTED} style={{ marginRight: 5 }} />
          <Text style={styles.footerText}>
            El botón "Entrar" se activa 15 min antes de la sesión
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  goldBar: {
    height: 2,
    backgroundColor: PRIMARY_GOLD,
    opacity: 0.6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  photoWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "visible",
  },
  photo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(74,12,12,0.3)",
  },
  statusDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: WARM_BLACK,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  guideName: {
    color: FOREGROUND,
    fontSize: 14,
    fontFamily: "Manrope", fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dateText: {
    color: MUTED,
    fontSize: 11,
    fontFamily: "Manrope",
    flex: 1,
    lineHeight: 15,
  },
  eventTitle: {
    color: ACCENT_GOLD,
    fontSize: 11,
    fontFamily: "Manrope",
    marginTop: 1,
  },
  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
  statusText: {
    color: MUTED,
    fontSize: 10,
    fontFamily: "Manrope",
    fontStyle: "italic",
  },
  enterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    overflow: "hidden",
    minWidth: 72,
  },
  enterBtnDisabled: {
    backgroundColor: "rgba(61,14,22,0.5)",
    borderWidth: 1,
    borderColor: BORDER,
  },
  enterBtnText: {
    color: WARM_BLACK,
    fontSize: 13,
    fontFamily: "Manrope", fontWeight: "600",
  },
  enterBtnTextDisabled: {
    color: MUTED,
    fontSize: 12,
    fontFamily: "Manrope",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  footerText: {
    color: MUTED,
    fontSize: 11,
    fontFamily: "Manrope",
    flex: 1,
    lineHeight: 15,
  },
});
