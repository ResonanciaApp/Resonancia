import { Stack } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function InspiracionDiariaLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: Platform.OS === "ios" ? "default" : "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="[date]" />
        <Stack.Screen name="notas" />
      </Stack>
    </View>
  );
}
