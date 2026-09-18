import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, BackHandler, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useInspiration } from "@/hooks/inspiration";
import { useColors } from "@/hooks/useColors";
import { formatTime } from "@/lib/date-utils";
import type { InspirationNote } from "@/types/inspiration";
import { useAuth } from "@/context/AuthContext";

export function confirmInspirationAction(title: string, message: string, action: () => void) {
  if (Platform.OS === "web") { if (window.confirm(`${title}\n\n${message}`)) action(); }
  else Alert.alert(title, message, [{ text: "Cancelar", style: "cancel" }, { text: "Confirmar", onPress: action }]);
}
export function InspirationNotes({ inspirationId, notesLabel = "Mis notas" }: { inspirationId?: string; notesLabel?: string }) {
  const auth = useAuth();
  if (auth.authLoading) return <ActivityIndicator />;
  return <NotesEditor key={`${auth.isSignedIn ? auth.clerkUserId : "guest"}-${inspirationId || "all"}`} inspirationId={inspirationId} notesLabel={notesLabel} />;
}

function NotesEditor({ inspirationId, notesLabel }: { inspirationId?: string; notesLabel: string }) {
  const colors = useColors();
  const router = useRouter();
  const navigation = useNavigation();
  const { notes, createNote, updateNote, deleteNote, ready, syncStatus, syncError, retrySync, pendingCount,
    guestImportAvailable, importGuestData, dismissGuestImport } = useInspiration();
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<InspirationNote | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const allowLeave = useRef(false);
  const dirty = text !== (editing?.text || "");
  const guarded = useRef(false);
  guarded.current = dirty || busy;
  // Native-stack can dismiss a swipe before beforeRemove runs. Disable that
  // gesture while editing, and handle Android hardware back before dismissal.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !dirty && !busy });
    return () => navigation.setOptions({ gestureEnabled: true });
  }, [navigation, dirty, busy]);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!guarded.current) return false;
      if (busyRef.current) { setError("Espera a que termine el guardado local."); return true; }
      confirmInspirationAction("¿Salir sin guardar?", "Tus cambios de esta edición aún no se han guardado.", () => {
        allowLeave.current = true;
        if (navigation.canGoBack()) navigation.goBack();
        else router.replace("/inspiracion-diaria");
      });
      return true;
    });
    return () => subscription.remove();
  }, [navigation, router]));
  useEffect(() => navigation.addListener("beforeRemove", event => {
    if (!guarded.current || allowLeave.current) return;
    event.preventDefault();
    if (busy) { setError("Espera a que termine el guardado local."); return; }
    confirmInspirationAction("¿Salir sin guardar?", "Tus cambios de esta edición aún no se han guardado.", () => {
      allowLeave.current = true;
      navigation.dispatch(event.data.action);
    });
  }), [navigation, busy]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const prevent = (event: BeforeUnloadEvent) => { if (guarded.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, []);
  const run = async (operation: () => Promise<unknown>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true); setError(null);
    try { await operation(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar. Conservamos tu texto; vuelve a intentarlo."); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const save = () => run(async () => {
    if (!text.trim() || text.length > 20000) throw new Error("Escribe entre 1 y 20.000 caracteres.");
    if (editing) {
      const current = notes.find(note => note.id === editing.id);
      if (!current || current.deletedAt) throw new Error("Esta nota fue borrada en otra sesión. Tu edición sigue aquí; cópiala antes de cerrar o revisa las copias recuperadas.");
      if (current.text !== editing.text || current.revision !== editing.revision) {
        throw new Error("La nota cambió en otra sesión. Tu texto no se ha sobrescrito: copia tu edición o guárdala como una nota nueva.");
      }
      await updateNote(editing.id, text);
    }
    else if (inspirationId) await createNote(inspirationId, text);
    else throw new Error("Abre una inspiración para escribir una nueva nota.");
    setText(""); setEditing(null);
  });
  const edit = (note: InspirationNote) => {
    const apply = () => { setEditing(note); setText(note.text); setError(null); };
    if (dirty) confirmInspirationAction("Descartar edición", "¿Descartar los cambios sin guardar?", apply);
    else apply();
  };
  const visibleNotes = notes.filter(note => !note.deletedAt && (!inspirationId || note.inspirationId === inspirationId));
  const foreground = { color: colors.foreground };
  return <View style={{ paddingVertical: 20, gap: 16 }}>
    <Text style={[foreground, { fontSize: 21, fontWeight: "600" }]}>{notesLabel}</Text>
    <Text style={{ color: colors.mutedForeground }}>Tus reflexiones son privadas. Las copias recuperadas también permanecen aquí aunque la publicación se retire.</Text>
    {!ready && <ActivityIndicator color={colors.primary} />}
    <Text accessibilityLiveRegion="polite" style={{ color: colors.mutedForeground }}>
      {!ready ? "Cargando notas privadas…" : syncStatus === "guest" ? "Guardadas solo en este dispositivo (invitado)." : syncStatus === "syncing" ? "Sincronizando…" : pendingCount ? `${pendingCount} cambios guardados localmente, pendientes de sincronizar.` : "Cambios guardados localmente."}
    </Text>
    {!!syncError && <View><Text style={{ color: "#d87272" }}>{syncError}</Text><Pressable disabled={busy} onPress={() => void run(retrySync)} style={{ paddingVertical: 10 }}><Text style={foreground}>Reintentar sincronización</Text></Pressable></View>}
    {guestImportAvailable && <View style={{ backgroundColor: colors.card, padding: 16, gap: 12 }}>
      <Text style={foreground}>Hay notas y favoritos de invitado en este dispositivo. ¿Importarlos a esta cuenta? Solo se hará con tu confirmación.</Text>
      <Pressable disabled={busy} onPress={() => confirmInspirationAction("Importar datos de invitado", "Se guardarán en tu cuenta actual; los originales seguirán en este dispositivo.", () => void run(() => importGuestData({ confirmed: true })))}><Text style={{ color: colors.primary }}>Importar a mi cuenta</Text></Pressable>
      <Pressable disabled={busy} onPress={() => void run(dismissGuestImport)}><Text style={foreground}>No importar ni volver a preguntar</Text></Pressable>
    </View>}
    {visibleNotes.length === 0 && ready && <Text style={{ color: colors.mutedForeground }}>Aún no hay notas.</Text>}
    {visibleNotes.map(note => <View key={note.id} style={{ backgroundColor: colors.card, padding: 16, borderRadius: 12, gap: 12 }}>
      {note.localOnly && <Text style={{ color: "#d4aa68" }}>Copia recuperada — pendiente de revisión</Text>}
      <Text selectable style={foreground}>{note.text}</Text>
      <Text style={{ color: colors.mutedForeground }}>{note.date || "Publicación no disponible"} · {formatTime(note.updatedAt)}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
        <Pressable disabled={busy} onPress={() => edit(note)}><Text style={{ color: colors.primary }}>{note.localOnly ? "Revisar y guardar copia" : "Editar"}</Text></Pressable>
        <Pressable disabled={busy} onPress={() => confirmInspirationAction("Borrar nota", "¿Borrar esta nota privada?", () => void run(async () => {
          await deleteNote(note.id);
          if (editing?.id === note.id) { setEditing(null); setText(""); }
        }))}><Text style={foreground}>Borrar</Text></Pressable>
        {!inspirationId && note.date && <Pressable disabled={busy} onPress={() => router.push({ pathname: "/inspiracion-diaria/[date]", params: { date: note.date!, id: note.inspirationId } })}><Text style={foreground}>Ver inspiración</Text></Pressable>}
      </View>
    </View>)}
    {(inspirationId || editing) && <View style={{ backgroundColor: colors.card, padding: 16, borderRadius: 12, gap: 12 }}>
      <Text style={foreground}>{editing ? editing.localOnly ? "Revisar copia recuperada (se guardará como nota nueva)" : "Editar nota" : "Nueva reflexión"}</Text>
      <TextInput multiline editable={!busy} value={text} onChangeText={setText} maxLength={20000}
        placeholder="Escribe una reflexión…" placeholderTextColor={colors.mutedForeground}
        style={{ color: colors.foreground, minHeight: 110, textAlignVertical: "top", fontSize: 16 }} />
      <Text style={{ color: colors.mutedForeground }}>{text.length}/20.000</Text>
      <Pressable disabled={busy || !text.trim()} onPress={() => void save()} style={{ paddingVertical: 12 }}><Text style={{ color: colors.primary }}>{busy ? "Guardando…" : "Guardar nota"}</Text></Pressable>
      {editing && error && <Pressable disabled={busy || !text.trim()} onPress={() => void run(async () => {
        await createNote(editing.inspirationId, text);
        setText(""); setEditing(null);
      })}><Text style={{ color: colors.primary }}>Guardar mi edición como nota nueva (si la publicación está disponible)</Text></Pressable>}
      {editing && <Pressable disabled={busy} onPress={() => {
        const clear = () => { setEditing(null); setText(""); };
        if (dirty) confirmInspirationAction("Cancelar edición", "¿Descartar los cambios sin guardar?", clear); else clear();
      }}><Text style={foreground}>Cancelar edición</Text></Pressable>}
    </View>}
    {error && <Text accessibilityRole="alert" style={{ color: "#d87272" }}>{error}</Text>}
    {inspirationId && <Pressable onPress={() => router.push("/inspiracion-diaria/notas")} style={{ paddingVertical: 12 }}><Text style={{ color: colors.primary }}>Ver todas mis notas</Text></Pressable>}
  </View>;
}