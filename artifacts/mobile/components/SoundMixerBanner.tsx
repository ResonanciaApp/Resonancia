import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MoonCrescentIcon } from "@/components/MoonCrescentIcon";
import { MEMBERSHIP_AURORA } from "@/constants/colors";
import { useMixerPanel } from "@/context/MixerPanelContext";
import { useColors } from "@/hooks/useColors";

export function SoundMixerBanner() {
  const { openMixer } = useMixerPanel();
  const colors = useColors();

  return (
    <Pressable
      onPress={openMixer}
      accessibilityRole="button"
      accessibilityLabel="Abrir Mezclador de sonidos"
      style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.82 : 1 }]}
    >
      <View style={styles.icon}>
        <MoonCrescentIcon color="#C4A8F5" size={30} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Mezclador de sonidos</Text>
        <Text style={[styles.subtitle, { color: colors.accent }]}>
          Crea tu propio universo sonoro con más de 400 sonidos ambientales{" "}
          <MaterialCommunityIcons
            name="diamond-stone"
            size={14}
            color={MEMBERSHIP_AURORA.plus.accent}
          />
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color="rgba(249,249,249,0.7)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 110,
    marginTop: 26,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(227,247,255,0.27)",
    backgroundColor: "rgba(0,0,0,0.28)",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  icon: {
    width: 51,
    height: 51,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: 2 }],
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },
  subtitle: {
    fontFamily: "Manrope",
    fontSize: 12,
  },
});