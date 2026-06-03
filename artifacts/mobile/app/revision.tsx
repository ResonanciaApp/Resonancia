import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useQueryClient } from "@tanstack/react-query";

import {
  useGetPendingSubmissions,
  useApproveSubmission,
  useRejectSubmission,
  getGetPendingSubmissionsQueryKey,
  getGetCatalogQueryKey,
  type Submission,
} from "@workspace/api-client-react";

import { SacredBackground } from "@/components/SacredBackground";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function RevisionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const q = useGetPendingSubmissions(undefined, {
    query: { enabled: isAdmin, queryKey: getGetPendingSubmissionsQueryKey() },
  });
  const submissions = q.data?.submissions ?? [];

  const approveMut = useApproveSubmission();
  const rejectMut = useRejectSubmission();

  const [rejectTarget, setRejectTarget] = useState<Submission | null>(null);
  const [reason, setReason] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: getGetPendingSubmissionsQueryKey() });
    await queryClient.invalidateQueries({ queryKey: getGetCatalogQueryKey() });
  }

  async function onApprove(s: Submission) {
    setActingId(s.id);
    try {
      await approveMut.mutateAsync({ id: s.id });
      await refresh();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "No se pudo aprobar.");
    } finally {
      setActingId(null);
    }
  }

  async function onConfirmReject() {
    if (!rejectTarget) return;
    if (!reason.trim()) {
      Alert.alert("Falta el motivo", "Escribí por qué se rechaza este contenido.");
      return;
    }
    setActingId(rejectTarget.id);
    try {
      await rejectMut.mutateAsync({ id: rejectTarget.id, data: { reason: reason.trim() } });
      setRejectTarget(null);
      setReason("");
      await refresh();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "No se pudo rechazar.");
    } finally {
      setActingId(null);
    }
  }

  if (!isAdmin) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <SacredBackground />
        <View style={[styles.empty, { paddingTop: topPad + 60 }]}>
          <Feather name="lock" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Sección exclusiva para administradores.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { borderColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backBtnText, { color: colors.primary }]}>Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPad + 8,
          paddingBottom: bottomPad + 40,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Revisión</Text>
          <View style={{ width: 22 }} />
        </View>

        {q.isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : submissions.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="check-circle" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No hay contenido pendiente de revisión.
            </Text>
          </View>
        ) : (
          submissions.map((s) => {
            const acting = actingId === s.id;
            return (
              <View
                key={s.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{s.title}</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                  {s.subtitle}
                </Text>
                <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                  {s.categoryLabel} · {s.durationLabel}
                  {s.isPremium ? " · Premium" : ""}
                </Text>
                {s.creator ? (
                  <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                    Por {s.creator.displayName || s.creator.username || "creador"}
                  </Text>
                ) : null}
                <Text style={[styles.cardDesc, { color: colors.foreground }]} numberOfLines={3}>
                  {s.description}
                </Text>
                <View style={[styles.assetLine, { borderTopColor: colors.border }]}>
                  <Feather name="music" size={13} color={colors.accent} />
                  <Text style={[styles.assetText, { color: colors.mutedForeground }]}>
                    {s.audioFiles.length} audio{s.audioFiles.length === 1 ? "" : "s"}
                    {s.imageKey ? " · portada" : ""}
                  </Text>
                </View>

                <View style={styles.actions}>
                  <Pressable
                    disabled={acting}
                    onPress={() => setRejectTarget(s)}
                    style={({ pressed }) => [
                      styles.rejectBtn,
                      { borderColor: "#C46A6A", opacity: pressed || acting ? 0.7 : 1 },
                    ]}
                  >
                    <Feather name="x" size={15} color="#C46A6A" />
                    <Text style={[styles.rejectText, { color: "#C46A6A" }]}>Rechazar</Text>
                  </Pressable>
                  <Pressable
                    disabled={acting}
                    onPress={() => onApprove(s)}
                    style={({ pressed }) => [
                      styles.approveBtn,
                      { backgroundColor: "#5FAE7A", opacity: pressed || acting ? 0.7 : 1 },
                    ]}
                  >
                    {acting ? (
                      <ActivityIndicator color="#06130C" size="small" />
                    ) : (
                      <>
                        <Feather name="check" size={15} color="#06130C" />
                        <Text style={styles.approveText}>Aprobar</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={rejectTarget != null} transparent animationType="fade" onRequestClose={() => setRejectTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Motivo del rechazo</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              El creador verá este mensaje en "Mis envíos".
            </Text>
            <View style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Ej: el audio tiene ruido de fondo…"
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                style={[styles.modalInputText, { color: colors.foreground }]}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setRejectTarget(null);
                  setReason("");
                }}
                style={({ pressed }) => [styles.modalCancel, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={onConfirmReject}
                style={({ pressed }) => [styles.modalConfirm, { backgroundColor: "#C46A6A", opacity: pressed ? 0.8 : 1 }]}
              >
                <Text style={styles.modalConfirmText}>Rechazar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    height: 40,
  },
  screenTitle: { fontSize: 17, fontWeight: "700" },
  loading: { paddingTop: 60, alignItems: "center" },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardSub: { fontSize: 13, marginTop: 2 },
  cardMeta: { fontSize: 12, marginTop: 4 },
  cardDesc: { fontSize: 13, lineHeight: 19, marginTop: 10 },
  assetLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 10,
  },
  assetText: { fontSize: 12 },
  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  rejectText: { fontSize: 14, fontWeight: "700" },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 12,
  },
  approveText: { fontSize: 14, fontWeight: "700", color: "#06130C" },
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32, gap: 14 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 21 },
  backBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 28, marginTop: 8 },
  backBtnText: { fontSize: 14, fontWeight: "600" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: { borderRadius: 18, borderWidth: 1, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalSub: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  modalInput: { borderRadius: 12, borderWidth: 1, padding: 12, minHeight: 80, marginTop: 14 },
  modalInputText: { fontSize: 14, lineHeight: 20 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalCancel: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  modalCancelText: { fontSize: 14, fontWeight: "600" },
  modalConfirm: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 12, paddingVertical: 12 },
  modalConfirmText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
