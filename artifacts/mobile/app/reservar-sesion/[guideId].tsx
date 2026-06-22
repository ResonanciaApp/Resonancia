/**
 * Pantalla de reserva de sesión en vivo — WebView in-app.
 *
 * Flujo:
 *  1. "idle"    — info del guiador + botón "Elegir fecha y hora"
 *  2. "webview" — WebView fullscreen con Cal.com embebido
 *               — JS inyectado captura evento bookingSuccessful de Cal.com
 *               — onNavigationStateChange detecta URL de éxito (/booking/ path)
 *  3. "confirm" — pantalla de éxito con guiador, fecha y hora (si se parsearon)
 */
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Image as ExpoImage } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewNavigation, type WebViewMessageEvent } from "react-native-webview";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { getGuide } from "@/data/guides";

// ── Paleta ────────────────────────────────────────────────────────────────────
const WARM_BLACK = "#1B060F";
const BURGUNDY_MID = "#4A0C0C";
const PRIMARY_GOLD = "#D4AF37";
const ACCENT_GOLD = "#E9C46A";
const FOREGROUND = "#F4DAD5";
const MUTED = "rgba(242,231,228,0.55)";
const BORDER = "#3D0E16";

type Phase = "idle" | "webview" | "confirm";

interface BookingInfo {
  date?: string;
  time?: string;
}

// JS inyectado en el WebView para capturar evento bookingSuccessful de Cal.com
const INJECTED_JS = `
(function() {
  window.addEventListener('message', function(e) {
    try {
      var raw = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (!raw) return;
      var type = raw.type || raw.action || (raw.data && raw.data.type);
      if (type === 'bookingSuccessful') {
        window.ReactNativeWebView.postMessage(JSON.stringify({ _rn: 'bookingSuccessful', payload: raw }));
      }
    } catch(e) {}
  });
  var _lastUrl = location.href;
  new MutationObserver(function() {
    if (location.href !== _lastUrl) {
      _lastUrl = location.href;
      if (location.pathname.includes('/booking/')) {
        setTimeout(function() {
          try {
            var dateEl = document.querySelector('[data-testid="booking-date"]') || document.querySelector('time');
            var timeEl = document.querySelector('[data-testid="booking-time"]');
            window.ReactNativeWebView.postMessage(JSON.stringify({
              _rn: 'bookingUrl',
              url: location.href,
              dateText: dateEl ? dateEl.innerText : '',
              timeText: timeEl ? timeEl.innerText : '',
            }));
          } catch(err) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ _rn: 'bookingUrl', url: location.href }));
          }
        }, 800);
      }
    }
  }).observe(document, { subtree: true, childList: true });
  true;
})();
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseBookingFromUrl(url: string): BookingInfo {
  try {
    const u = new URL(url);
    const raw = u.searchParams.get("date") ?? u.searchParams.get("startTime") ?? u.searchParams.get("slot");
    if (raw) {
      const d = new Date(decodeURIComponent(raw));
      if (!isNaN(d.getTime())) {
        return {
          date: d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" }),
          time: d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
        };
      }
    }
  } catch {}
  return {};
}

function parseBookingFromPayload(payload: unknown): BookingInfo {
  try {
    const p = payload as Record<string, unknown>;
    const booking =
      (p.data as Record<string, unknown>)?.booking ??
      (p.booking as Record<string, unknown>) ??
      p;
    const start =
      (booking as Record<string, unknown>)?.startTime ??
      (booking as Record<string, unknown>)?.date;
    if (typeof start === "string" || typeof start === "number") {
      const d = new Date(start);
      if (!isNaN(d.getTime())) {
        return {
          date: d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" }),
          time: d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
        };
      }
    }
  } catch {}
  return {};
}

// ── Pantalla ──────────────────────────────────────────────────────────────────
export default function ReservarSesionScreen() {
  const { guideId, calLink, guideDisplayName } = useLocalSearchParams<{
    guideId: string;
    calLink?: string;
    guideDisplayName?: string;
  }>();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [phase, setPhase] = useState<Phase>("idle");
  const [bookingInfo, setBookingInfo] = useState<BookingInfo>({});
  const [webviewLoading, setWebviewLoading] = useState(true);

  const guide = getGuide(guideId);
  const displayName = guideDisplayName ?? guide.name;
  const topPad = insets.top + 8;
  const bottomPad = insets.bottom + 24;

  const fadeTo = useCallback(
    (cb: () => void) => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        cb();
        Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
      });
    },
    [fadeAnim],
  );

  const handleOpenWebView = useCallback(() => {
    if (!calLink) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fadeTo(() => {
      setWebviewLoading(true);
      setPhase("webview");
    });
  }, [calLink, fadeTo]);

  const handleBookingSuccess = useCallback(
    (info: BookingInfo) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fadeTo(() => {
        setBookingInfo(info);
        setPhase("confirm");
      });
    },
    [fadeTo],
  );

  const handleNavChange = useCallback(
    (navState: WebViewNavigation) => {
      if (phase !== "webview") return;
      const { url } = navState;
      if (!url) return;
      if (/\/booking\/[a-zA-Z0-9_-]+/.test(url)) {
        handleBookingSuccess(parseBookingFromUrl(url));
      }
    },
    [phase, handleBookingSuccess],
  );

  const handleMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data) as Record<string, unknown>;
        if (msg._rn === "bookingSuccessful") {
          handleBookingSuccess(parseBookingFromPayload(msg.payload));
        } else if (msg._rn === "bookingUrl") {
          handleBookingSuccess(parseBookingFromUrl(String(msg.url ?? "")));
        }
      } catch {}
    },
    [handleBookingSuccess],
  );

  // ── Fase: webview ─────────────────────────────────────────────────────────
  if (phase === "webview") {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.webviewHeader, { paddingTop: topPad }]}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Reservar con {displayName}
          </Text>
          <Pressable
            style={styles.closeBtn}
            onPress={() => fadeTo(() => setPhase("idle"))}
            hitSlop={12}
          >
            <Feather name="x" size={22} color={FOREGROUND} />
          </Pressable>
        </View>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <WebView
            source={{ uri: calLink! }}
            style={{ flex: 1, backgroundColor: WARM_BLACK }}
            injectedJavaScript={INJECTED_JS}
            onMessage={handleMessage}
            onNavigationStateChange={handleNavChange}
            onLoadStart={() => setWebviewLoading(true)}
            onLoadEnd={() => setWebviewLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
          />
          {webviewLoading && (
            <View style={styles.webviewLoader}>
              <ActivityIndicator color={PRIMARY_GOLD} size="large" />
            </View>
          )}
        </Animated.View>
      </View>
    );
  }

  // ── Fase: confirmación ────────────────────────────────────────────────────
  if (phase === "confirm") {
    return (
      <View style={[styles.root, { paddingTop: topPad, paddingBottom: bottomPad }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[BURGUNDY_MID, WARM_BLACK, WARM_BLACK]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.centeredContainer, { opacity: fadeAnim }]}>
          <View style={styles.iconCircle}>
            <LinearGradient
              colors={["rgba(212,175,55,0.20)", "rgba(212,175,55,0.06)"]}
              style={StyleSheet.absoluteFill}
            />
            <Feather name="check-circle" size={38} color={PRIMARY_GOLD} />
          </View>

          <Text style={styles.confirmTitle}>¡Reserva confirmada!</Text>
          <Text style={styles.confirmSub}>
            Tu sesión con{" "}
            <Text style={{ color: ACCENT_GOLD, fontFamily: "Inter_600SemiBold" }}>
              {displayName}
            </Text>{" "}
            quedó agendada.
          </Text>

          <View style={styles.infoCard}>
            {bookingInfo.date ? (
              <>
                <View style={styles.infoRow}>
                  <Feather name="calendar" size={14} color={ACCENT_GOLD} style={styles.infoIcon} />
                  <Text style={[styles.infoText, { color: FOREGROUND }]}>
                    {bookingInfo.date}
                  </Text>
                </View>
                {bookingInfo.time ? (
                  <View style={[styles.infoRow, { marginTop: 10 }]}>
                    <Feather name="clock" size={14} color={ACCENT_GOLD} style={styles.infoIcon} />
                    <Text style={[styles.infoText, { color: FOREGROUND }]}>
                      {bookingInfo.time}
                    </Text>
                  </View>
                ) : null}
                <View style={[styles.infoRow, { marginTop: 10 }]}>
                  <Feather name="mail" size={14} color={MUTED} style={styles.infoIcon} />
                  <Text style={styles.infoText}>Recibirás confirmación y enlace por email.</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.infoRow}>
                  <Feather name="mail" size={14} color={ACCENT_GOLD} style={styles.infoIcon} />
                  <Text style={styles.infoText}>
                    Recibirás un email de Cal.com con fecha, hora y enlace para unirte.
                  </Text>
                </View>
                <View style={[styles.infoRow, { marginTop: 10 }]}>
                  <Feather name="calendar" size={14} color={ACCENT_GOLD} style={styles.infoIcon} />
                  <Text style={styles.infoText}>
                    El botón "Entrar" aparecerá en{" "}
                    <Text style={{ color: FOREGROUND }}>Mis sesiones</Text>{" "}
                    15 minutos antes de comenzar.
                  </Text>
                </View>
              </>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => {
              router.back();
              setTimeout(() => router.push("/mis-sesiones" as never), 200);
            }}
          >
            <LinearGradient
              colors={["#D6AD5F", "#B47344"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.primaryBtnText}>Ver mis sesiones</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={() => router.replace("/" as never)}>
            <Text style={styles.secondaryBtnText}>Volver al inicio</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // ── Fase: idle ────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[BURGUNDY_MID, WARM_BLACK, WARM_BLACK]}
        locations={[0, 0.3, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Feather name="x" size={22} color={FOREGROUND} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Reservar sesión
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: bottomPad + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.guideProfile}>
            <View style={styles.photoWrap}>
              <ExpoImage
                source={guide.photo as never}
                style={styles.photo}
                contentFit="cover"
                placeholder={BLUR_PLACEHOLDER}
                transition={IMAGE_TRANSITION}
              />
            </View>
            <Text style={styles.guideName}>{displayName}</Text>
            {guide.specialty ? (
              <Text style={styles.guideSpecialty}>{guide.specialty}</Text>
            ) : null}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Feather name="calendar" size={14} color={ACCENT_GOLD} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Elige fecha y hora directamente en Cal.com. Al completar, tu sesión quedará registrada.
              </Text>
            </View>
            <View style={[styles.infoRow, { marginTop: 10 }]}>
              <Feather name="clock" size={14} color={ACCENT_GOLD} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                El botón "Entrar" aparece en la app 15 minutos antes de tu sesión.
              </Text>
            </View>
          </View>

          {calLink ? (
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, { marginTop: 28, opacity: pressed ? 0.85 : 1 }]}
              onPress={handleOpenWebView}
            >
              <LinearGradient
                colors={["#D6AD5F", "#B47344"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Feather name="calendar" size={16} color={WARM_BLACK} style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Elegir fecha y hora</Text>
            </Pressable>
          ) : (
            <View style={[styles.infoCard, { marginTop: 24 }]}>
              <View style={styles.infoRow}>
                <Feather name="alert-circle" size={14} color={MUTED} style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: MUTED }]}>
                  Este guiador aún no tiene disponibilidad configurada.
                </Text>
              </View>
            </View>
          )}

          <Pressable style={[styles.secondaryBtn, { marginTop: 16 }]} onPress={() => router.back()}>
            <Text style={styles.secondaryBtnText}>Cancelar</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WARM_BLACK },

  webviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WARM_BLACK,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  webviewLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WARM_BLACK,
  },
  closeBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    color: FOREGROUND,
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    textAlign: "center",
  },

  guideProfile: { alignItems: "center", paddingVertical: 28 },
  photoWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(212,175,55,0.35)",
    overflow: "hidden",
    marginBottom: 14,
  },
  photo: { width: "100%", height: "100%" },
  guideName: {
    color: FOREGROUND,
    fontSize: 22,
    fontFamily: "PlayfairDisplay_700Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  guideSpecialty: {
    color: MUTED,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  infoCard: {
    backgroundColor: "rgba(74,12,12,0.25)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start" },
  infoIcon: { marginRight: 10, marginTop: 1 },
  infoText: {
    flex: 1,
    color: MUTED,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },

  primaryBtn: {
    height: 54,
    borderRadius: 14,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: WARM_BLACK, fontSize: 16, fontFamily: "Inter_600SemiBold" },
  secondaryBtn: { alignItems: "center", padding: 12 },
  secondaryBtnText: { color: MUTED, fontSize: 14, fontFamily: "Inter_400Regular" },

  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 16,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.30)",
    overflow: "hidden",
    marginBottom: 8,
  },
  confirmTitle: {
    color: FOREGROUND,
    fontSize: 24,
    fontFamily: "PlayfairDisplay_700Bold",
    textAlign: "center",
  },
  confirmSub: {
    color: MUTED,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
});
