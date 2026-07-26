/**
 * FadeToggleSection — envuelve contenido que aparece/desaparece con fade
 * según un toggle. Mantiene el contenido montado durante el fade-out y
 * lo desmonta al terminar.
 */
import React, { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";

export function FadeToggleSection({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [rendered, setRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) setRendered(false);
        },
      );
    }
  }, [visible, opacity]);

  if (!rendered) return null;

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}
