import AsyncStorage from "@react-native-async-storage/async-storage";
import { useClerk } from "@clerk/expo";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";

export default function DevReset() {
  const { signOut } = useClerk();
  const [status, setStatus] = useState("Listo para borrar todo");
  const [working, setWorking] = useState(false);

  const reset = async () => {
    setWorking(true);
    try {
      setStatus("Cerrando sesión…");
      try { await signOut(); } catch {}
      setStatus("Borrando datos locales…");
      try {
        const keys = await AsyncStorage.getAllKeys();
        if (keys.length > 0) {
          await AsyncStorage.multiRemove(keys);
        }
      } catch {
        try { await AsyncStorage.clear(); } catch {}
      }
      setStatus("Listo. Recargando…");
      if (Platform.OS === "web" && typeof window !== "undefined") {
        try { window.location.assign("/"); return; } catch {}
      }
      router.replace("/onboarding");
    } catch (e) {
      setStatus("Error: " + (e instanceof Error ? e.message : String(e)));
      setWorking(false);
    }
  };

  useEffect(() => {}, []);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Reset de prueba</Text>
      <Text style={styles.body}>
        Esto cierra tu sesión de Clerk y borra TODO el AsyncStorage (onboarding, perfil local, favoritos, etc.). Solo
        para probar el flujo desde cero.
      </Text>
      <Pressable onPress={reset} disabled={working} style={[styles.btn, working && { opacity: 0.5 }]}>
        {working ? <ActivityIndicator color="#080F0A" /> : <Text style={styles.btnText}>Borrar todo y reiniciar</Text>}
      </Pressable>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#070E09", padding: 28, justifyContent: "center", gap: 16 },
  title: { color: "#C8C1B5", fontSize: 24, fontFamily: "PlayfairDisplay_700Bold" },
  body: { color: "rgba(237,225,211,0.65)", fontSize: 14, lineHeight: 20 },
  btn: { backgroundColor: "#BE9650", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 12 },
  btnText: { color: "#080F0A", fontFamily: "Inter_700Bold", fontSize: 15, letterSpacing: 0.3 },
  status: { color: "rgba(182,149,95,0.7)", fontSize: 12, textAlign: "center" },
});
