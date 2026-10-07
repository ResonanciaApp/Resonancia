import { Feather } from "@expo/vector-icons";
import React from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSceneTheme } from "@/context/SceneThemeContext";

const RULES = [
  ["Tu creación", "Necesitas una cuenta. Guarda tu mezcla y elige una imagen en «Ver / editar detalles» antes de compartirla."],
  ["Sonidos y nombre", "Incluye entre 2 y 10 sonidos y un nombre de hasta 40 caracteres. La descripción es opcional y admite hasta 120 caracteres."],
  ["Sin duplicados", "No puedes publicar otra mezcla con el mismo conjunto de sonidos que una que ya compartiste, aunque cambies el nombre o los volúmenes."],
  ["Límite de publicaciones", "Puedes tener hasta 20 mezclas compartidas. Si llegas al límite, elimina alguna antes de publicar otra."],
  ["Respeto por la comunidad", "Evita nombres o descripciones ofensivos, contenido inapropiado y spam. Puedes reportar una mezcla manteniendo presionada su card."],
] as const;

export function CommunityMixRulesSheet({ visible, onClose }: {
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFill, styles.backdrop]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar Bases"
        />
        <View style={[styles.sheet, {
          backgroundColor: theme.gradient[0],
          paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 16,
        }]} accessibilityViewIsModal>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Bases</Text>
            <Pressable
              testID="community-mix-rules-close"
              onPress={onClose}
              style={styles.close}
              accessibilityRole="button"
              accessibilityLabel="Cerrar Bases"
            >
              <Feather name="x" size={22} color="#FBFBFB" />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={styles.intro}>Reglas para compartir creaciones</Text>
            {RULES.map(([title, text], index) => (
              <View key={title} style={styles.rule}>
                <Text style={styles.ruleTitle}>{index + 1}. {title}</Text>
                <Text style={styles.body}>{text}</Text>
              </View>
            ))}
            <Text style={styles.ruleTitle}>Cómo compartir</Text>
            <Text style={styles.body}>
              Abre el menú de tu mezcla guardada en Biblioteca y elige «Compartir con la comunidad».
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: { maxHeight: "85%", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, overflow: "hidden" },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.16)", alignSelf: "center", marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  title: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700", color: "#FBFBFB" },
  close: { width: 43, height: 43, borderRadius: 21.5, backgroundColor: "rgba(0,0,0,0.16)", alignItems: "center", justifyContent: "center" },
  content: { paddingBottom: 12 },
  intro: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600", color: "#FBFBFB", marginBottom: 22 },
  rule: { marginBottom: 20 },
  ruleTitle: { fontFamily: "Manrope", fontSize: 14, fontWeight: "700", color: "#FBFBFB", marginBottom: 6 },
  body: { fontFamily: "Manrope", fontSize: 13, lineHeight: 20, color: "#CFCFCF" },
});
