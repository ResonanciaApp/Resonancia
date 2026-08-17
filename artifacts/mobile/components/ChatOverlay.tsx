import React, { useEffect, useRef, useState, Suspense } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Animated, Dimensions, StyleSheet } from "react-native";

import { useDrawer } from "@/context/DrawerContext";
import { BackOverrideProvider } from "@/context/BackOverrideContext";
import { DURATION, easeOutCubic } from "@/constants/motion";
import { useSceneTheme } from "@/context/SceneThemeContext";

const W = Dimensions.get("window").width;

const ChatScreen = React.lazy(() => import("@/app/chat/[userId]"));

/**
 * Overlay de chat: se desliza SOBRE el overlay de Amigos (que queda abierto
 * debajo, igual que el drawer queda debajo de Amigos). El botón ← del chat
 * cierra solo esta capa y vuelve a Amigos.
 */
export function ChatOverlay() {
  const { chatUserId, closeChat } = useDrawer();
  const { theme: sceneTheme } = useSceneTheme();
  const [rendered, setRendered] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const slideAnim = useRef(new Animated.Value(W)).current;

  useEffect(() => {
    if (chatUserId != null) {
      setActiveId(chatUserId);
      setRendered(true);
      slideAnim.stopAnimation();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: DURATION.DRAWER,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start();
    } else if (rendered) {
      slideAnim.stopAnimation();
      Animated.timing(slideAnim, {
        toValue: W,
        duration: DURATION.DRAWER,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setRendered(false);
          setActiveId(null);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatUserId]);

  if (!rendered || activeId == null) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: sceneTheme.gradient[0], transform: [{ translateX: slideAnim }] },
      ]}
    >
      <BackOverrideProvider onBack={closeChat}>
        <Suspense
          fallback={
            <LinearGradient
              style={StyleSheet.absoluteFill}
              colors={sceneTheme.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          }
        >
          <ChatScreen userIdOverride={activeId} />
        </Suspense>
      </BackOverrideProvider>
    </Animated.View>
  );
}
