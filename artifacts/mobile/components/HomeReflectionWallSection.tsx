import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Keyboard,
  Platform,
  ScrollView,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import { useFocusEffect } from "expo-router";

import { InnerSpaceCard, INNER_SPACE_CARD_BOTTOM_MARGIN } from "@/components/InnerSpaceCard";
import { useDrawer } from "@/context/DrawerContext";

const KEYBOARD_ESTIMATE = Platform.OS === "android" ? 305 : 335;
const KEYBOARD_GAP = 15;

export type HomeReflectionWallHandle = {
  cancelPendingScroll: () => void;
  finishPendingScroll: (scrollEnded?: boolean) => void;
};

type Props = {
  scrollRef: React.RefObject<Pick<ScrollView, "scrollTo" | "getNativeScrollRef"> | null>;
  getScrollY: () => number;
  onComposingChange: (composing: boolean) => void;
  onMessageSaved: () => void;
  style?: StyleProp<ViewStyle>;
  sectionTitle?: string;
  canonicalVerticalInsets?: boolean;
  sectionBackgroundColor?: string;
  profileVariant?: boolean;
  onCollapsedHeightChange?: (height: number) => void;
};

export const HomeReflectionWallSection = forwardRef<HomeReflectionWallHandle, Props>(
  function HomeReflectionWallSection({
    scrollRef,
    getScrollY,
    onComposingChange,
    onMessageSaved,
    style,
    sectionTitle,
    canonicalVerticalInsets = false,
    sectionBackgroundColor,
    profileVariant = false,
    onCollapsedHeightChange,
  }, ref) {
    const { wallComposeRequest, consumeWallComposeRequest } = useDrawer();
    const sectionRef = useRef<View>(null);
    const [layoutReady, setLayoutReady] = useState(false);
    const [focusRequest, setFocusRequest] = useState(0);
    const [keepKeyboardOnCategories, setKeepKeyboardOnCategories] = useState(false);
    const collapsedHeightRef = useRef(0);
    const autoScrollPendingRef = useRef(false);
    const composePendingRef = useRef(false);
    const composeStartedAtRef = useRef(0);
    const composeTargetRef = useRef<number | null>(null);
    const composeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const composeFrameRef = useRef<number | null>(null);
    const lastKeyboardHeightRef = useRef(0);
    const bottomMargin = canonicalVerticalInsets ? 0 : INNER_SPACE_CARD_BOTTOM_MARGIN;

    const clearComposeTimer = useCallback(() => {
      if (composeTimerRef.current) clearTimeout(composeTimerRef.current);
      composeTimerRef.current = null;
    }, []);

    const cancelPendingScroll = useCallback(() => {
      autoScrollPendingRef.current = false;
      if (!composePendingRef.current) return;
      composePendingRef.current = false;
      composeTargetRef.current = null;
      if (composeFrameRef.current !== null) cancelAnimationFrame(composeFrameRef.current);
      composeFrameRef.current = null;
      clearComposeTimer();
      onComposingChange(false);
    }, [clearComposeTimer, onComposingChange]);

    const finishComposeScroll = useCallback((reason = "ready") => {
      if (!composePendingRef.current) return;
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.info("[reflection-wall-keyboard] scroll-ready", {
          reason,
          waitMs: Date.now() - composeStartedAtRef.current,
          target: composeTargetRef.current,
          scrollY: getScrollY(),
        });
      }
      composePendingRef.current = false;
      composeTargetRef.current = null;
      clearComposeTimer();
      setFocusRequest((value) => value + 1);
    }, [clearComposeTimer, getScrollY]);

    const finishPendingScroll = useCallback((scrollEnded = false) => {
      const target = composeTargetRef.current;
      if (!composePendingRef.current || target === null) return;
      if (scrollEnded || Math.abs(getScrollY() - target) < 3) {
        finishComposeScroll(scrollEnded ? "scroll-end" : "target-reached");
        return;
      }
      // También reconoce un destino limitado por el scroll nativo: esperar
      // reposo tras el último evento, no el respaldo largo ni una Y imposible.
      clearComposeTimer();
      composeTimerRef.current = setTimeout(() => finishComposeScroll("scroll-stopped"), 80);
    }, [clearComposeTimer, finishComposeScroll, getScrollY]);

    useImperativeHandle(ref, () => ({ cancelPendingScroll, finishPendingScroll }), [
      cancelPendingScroll,
      finishPendingScroll,
    ]);

    const measureSectionAndViewport = useCallback((
      callback: (cardY: number, cardHeight: number, viewportY: number, viewportHeight: number) => void,
    ) => {
      sectionRef.current?.measureInWindow((_x, cardY, _width, cardHeight) => {
        scrollRef.current?.getNativeScrollRef()?.measureInWindow((_sx, viewportY, _sw, viewportHeight) => {
          callback(cardY, cardHeight, viewportY, viewportHeight);
        });
      });
    }, [scrollRef]);

    const requestCompose = useCallback(() => {
      // onPressIn, onFocus y nuevos toques pertenecen a la misma apertura.
      // Reiniciar aquí el scroll/timeout prolonga la espera con cada solicitud.
      if (composePendingRef.current) return;
      if (!layoutReady) {
        setFocusRequest((value) => value + 1);
        return;
      }
      cancelPendingScroll();
      composePendingRef.current = true;
      composeStartedAtRef.current = Date.now();
      onComposingChange(true);
      // También cubre medidas nativas que no responden: el toque nunca pierde el foco.
      composeTimerRef.current = setTimeout(() => finishComposeScroll("measurement-timeout"), 1200);
      // El espacio de scroll se añade antes de medir y antes de enfocar el teclado.
      composeFrameRef.current = requestAnimationFrame(() => {
        composeFrameRef.current = requestAnimationFrame(() => {
          composeFrameRef.current = null;
          if (!composePendingRef.current) return;
          measureSectionAndViewport((cardY, cardHeight, viewportY, viewportHeight) => {
            if (!composePendingRef.current) return;
            const keyboardHeight = lastKeyboardHeightRef.current || KEYBOARD_ESTIMATE;
            const expandedHeight = cardHeight > 220 ? cardHeight : 390;
            const cardBottom = cardY + expandedHeight - bottomMargin;
            const visibleBottom = viewportY + viewportHeight - keyboardHeight - KEYBOARD_GAP;
            const target = Math.max(0, getScrollY() + cardBottom - visibleBottom);
            if (Math.abs(target - getScrollY()) < 3) {
              finishComposeScroll();
              return;
            }
            composeTargetRef.current = target;
            scrollRef.current?.scrollTo({ y: target, animated: true });
            // Respaldo si la plataforma no informa el final del scroll programático.
            clearComposeTimer();
            composeTimerRef.current = setTimeout(() => finishComposeScroll("scroll-timeout"), 900);
          });
        });
      });
    }, [
      cancelPendingScroll,
      clearComposeTimer,
      bottomMargin,
      finishComposeScroll,
      getScrollY,
      layoutReady,
      measureSectionAndViewport,
      onComposingChange,
      scrollRef,
    ]);

    useFocusEffect(useCallback(() => {
      if (!layoutReady || wallComposeRequest === null) return;
      const frame = requestAnimationFrame(() => {
        setKeepKeyboardOnCategories(true);
        requestCompose();
        consumeWallComposeRequest(wallComposeRequest);
      });
      return () => cancelAnimationFrame(frame);
    }, [consumeWallComposeRequest, layoutReady, requestCompose, wallComposeRequest]));

    useFocusEffect(useCallback(() => () => {
      cancelPendingScroll();
      setKeepKeyboardOnCategories(false);
    }, [cancelPendingScroll]));

    useEffect(() => {
      const show = Keyboard.addListener("keyboardDidShow", (event) => {
        lastKeyboardHeightRef.current = event.endCoordinates.height;
      });
      const hide = Keyboard.addListener("keyboardDidHide", () => {
        if (!composePendingRef.current) onComposingChange(false);
      });
      return () => {
        show.remove();
        hide.remove();
        composePendingRef.current = false;
        composeTargetRef.current = null;
        if (composeFrameRef.current !== null) cancelAnimationFrame(composeFrameRef.current);
        composeFrameRef.current = null;
        clearComposeTimer();
      };
    }, [clearComposeTimer, onComposingChange]);

    const beginAutoScroll = () => {
      sectionRef.current?.measureInWindow((_x, _y, _width, height) => {
        collapsedHeightRef.current = height;
      });
      autoScrollPendingRef.current = true;
    };

    const finishAutoScroll = (expandedHeight: number) => {
      requestAnimationFrame(() => {
        if (!autoScrollPendingRef.current) return;
        autoScrollPendingRef.current = false;
        measureSectionAndViewport((cardY, height, viewportY, viewportHeight) => {
          const cardBottom = cardY + Math.max(height, collapsedHeightRef.current + expandedHeight)
            - bottomMargin;
          const missingSpace = cardBottom - (viewportY + viewportHeight - 96);
          if (missingSpace >= 2) {
            scrollRef.current?.scrollTo({
              y: getScrollY() + Math.min(missingSpace, 140),
              animated: true,
            });
          }
        });
      });
    };

    return (
      <View ref={sectionRef} style={style} onLayout={() => setLayoutReady(true)}>
        <InnerSpaceCard
          focusRequest={focusRequest}
          keepKeyboardOnCategories={keepKeyboardOnCategories}
          onComposeRequested={requestCompose}
          onInputBlur={() => {
            setKeepKeyboardOnCategories(false);
            if (!Keyboard.isVisible()) onComposingChange(false);
          }}
          onMessageSaved={onMessageSaved}
          onExpandStart={beginAutoScroll}
          onExpandComplete={finishAutoScroll}
          sectionTitle={sectionTitle}
          canonicalVerticalInsets={canonicalVerticalInsets}
          sectionBackgroundColor={sectionBackgroundColor}
          profileVariant={profileVariant}
          onCollapsedHeightChange={onCollapsedHeightChange}
        />
      </View>
    );
  },
);