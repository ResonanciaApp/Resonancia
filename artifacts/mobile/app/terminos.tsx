import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { useColors } from "@/hooks/useColors";

const UPDATED = "Mayo 2026";

export default function TerminosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar hidden />
      <SacredBackground />

      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 60, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>

        <Text style={[styles.title, { color: colors.foreground }]}>Términos y privacidad</Text>
        <Text style={[styles.updated, { color: colors.mutedForeground }]}>Última actualización: {UPDATED}</Text>

        <Section title="1. Aceptación" colors={colors}>
          Al usar RESONANCIA — Casa del Cuenco aceptás estos términos. Si no estás de acuerdo, te pedimos que no uses la app.
        </Section>

        <Section title="2. Qué es RESONANCIA" colors={colors}>
          RESONANCIA es una app de meditación, sonidos y bienestar. El contenido tiene fines de relajación y acompañamiento personal. No reemplaza atención médica ni psicológica profesional.
        </Section>

        <Section title="3. Cuenta y uso" colors={colors}>
          Sos responsable del uso que hagas de la app y del cuidado de tus credenciales si decidís registrarte. Te pedimos que no uses la app mientras manejás vehículos ni en situaciones que requieran tu atención plena.
        </Section>

        <Section title="4. Membresía Premium" colors={colors}>
          Algunas sesiones requieren membresía premium. Las suscripciones se cobran a través de App Store o Google Play según corresponda y se renuevan automáticamente hasta que las canceles desde tu cuenta de la tienda.
        </Section>

        <Section title="5. Datos personales" colors={colors}>
          Guardamos lo mínimo necesario para que la app funcione: tu nombre, foto opcional y preferencias. Los textos del Diario y tus grabaciones de Voz Interior quedan en tu dispositivo. No vendemos ni compartimos tus datos con terceros con fines comerciales.
        </Section>

        <Section title="6. Notificaciones" colors={colors}>
          Si activás notificaciones, las usaremos solo para recordatorios de práctica y avisos de contenido nuevo. Podés desactivarlas en cualquier momento desde Configuraciones.
        </Section>

        <Section title="7. Propiedad intelectual" colors={colors}>
          Las sesiones, audios, textos e imágenes son propiedad de Casa del Cuenco o de sus colaboradores. No podés redistribuirlos sin autorización.
        </Section>

        <Section title="8. Cambios" colors={colors}>
          Podemos actualizar estos términos cuando agreguemos funcionalidades. Te avisaremos dentro de la app cuando haya cambios importantes.
        </Section>

        <Section title="9. Contacto" colors={colors}>
          Para consultas, escribinos a hola@resonancia.app.
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children, colors }: { title: string; children: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ marginTop: 22 }}>
      <Text style={[styles.h, { color: colors.primary }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.foreground }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { width: 40, height: 40, justifyContent: "center", marginBottom: 8 },
  title: { fontFamily: "Manrope", fontSize: 26, fontWeight: "700", marginTop: 8 },
  updated: { fontFamily: "Manrope", fontSize: 12, marginTop: 6 },
  h: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", marginBottom: 6, letterSpacing: 0.2 },
  body: { fontFamily: "Manrope", fontSize: 14, lineHeight: 21 },
});
