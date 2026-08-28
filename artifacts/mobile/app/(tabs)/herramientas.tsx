import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { EncuentrosResonadoresSection } from "@/components/EncuentrosResonadoresSection";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";

const GRID_PAD = 19;

export default function HerramientasScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { theme } = useSceneTheme();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: theme.gradient[0] as string }]}>
      <SacredBackground variant="gradient" />
      <StatusBar hidden />

      <View style={styles.contentShift}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: topPad + 8,
              paddingBottom: 160 + bottomPad,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>Recursos</Text>

          <View style={styles.fullBleedSection}>
            <EncuentrosResonadoresSection titleMarginTop={0} />
          </View>

        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  contentShift: {
    flex: 1,
    transform: [{ translateY: -5 }],
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: GRID_PAD,
  },
  title: {
    marginBottom: 24,
    fontFamily: "Manrope",
    fontSize: 31,
    fontWeight: "700",
    letterSpacing: -0.3,
    textAlign: "left",
    transform: [{ translateY: 1 }],
  },
  fullBleedSection: {
    marginHorizontal: -GRID_PAD,
    marginTop: 53,
  },
});
