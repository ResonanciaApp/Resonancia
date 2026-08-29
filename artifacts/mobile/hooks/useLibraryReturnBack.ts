import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useRef } from "react";
import { BackHandler } from "react-native";

import { useDrawer, type LibraryTab } from "@/context/DrawerContext";

/**
 * Los detalles abiertos desde el overlay de Biblioteca deben volver a ese
 * overlay, no a la tab que quedó debajo (por ejemplo, Recursos).
 */
export function useLibraryReturnBack(fromLibrary?: string | string[], returnTab?: LibraryTab) {
  const { openLib } = useDrawer();
  const returningRef = useRef(false);
  const shouldReturnToLibrary = Array.isArray(fromLibrary)
    ? fromLibrary.includes("1")
    : fromLibrary === "1";

  const goBack = useCallback(() => {
    if (!shouldReturnToLibrary) {
      if (router.canGoBack()) router.back();
      else router.navigate("/(tabs)/biblioteca" as never);
      return;
    }
    if (returningRef.current) return;
    returningRef.current = true;

    // Montar Biblioteca antes de retirar el detalle evita que Recursos se vea
    // siquiera durante un frame mientras el router restaura la ruta inferior.
    openLib(returnTab);
    requestAnimationFrame(() => {
      if (router.canGoBack()) router.back();
      else router.navigate("/(tabs)/biblioteca" as never);
    });
  }, [openLib, returnTab, shouldReturnToLibrary]);

  useFocusEffect(
    useCallback(() => {
      returningRef.current = false;
      if (!shouldReturnToLibrary) return;
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        goBack();
        return true;
      });
      return () => sub.remove();
    }, [goBack, shouldReturnToLibrary]),
  );

  return goBack;
}