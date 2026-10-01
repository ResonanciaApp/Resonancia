import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  InteractionManager,
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
  finishPendingScroll: () => void;
};

type Props = {
  scrollRef: React.RefObject<Pick<ScrollView, "scrollTo" | "getNativeScrollRef"> | null>;
  getScrollY: () => number;
  onComposingChange: (composing: boolean) => void;
  onMessageSaved: () => void;
  style?: StyleProp<ViewStyle>;
  sectionTitle?: string;
  canonicalVerticalInsets?: boolean;
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
  }, ref) {
    const { wallComposeRequest, consumeWallComposeRequest } = useDrawer();
    const sectionRef = useRef<View>(null);
    const [layoutReady, setLayoutReady] = useState(false);
    const [focusRequest, setFocusRequest] = useState(0);
    const [keepKeyboardOnCategories, setKeepKeyboardOnCategories] = useState(false);
    const collapsedHeightRef = useRef(0);
    const autoScrollPendingRef = useRef(false);
    const composePendingRef = useRef(false);
    const composeTargetRef = useRef<number | null>(null);
    const composeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const interactionRef = useRef<ReturnType<typeof InteractionManager.runAfterInteractions> | null>(null);
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
      interactionRef.current?.cancel();
      clearComposeTimer();
      onComposingChange(false);
    }, [clearComposeTimer, onComposingChange]);

    const finishComposeScroll = useCallback(() => {
      if (!composePendingRef.current) return;
      composePendingRef.current = false;
      composeTargetRef.current = null;
      clearComposeTimer();
      setFocusRequest((value) => value + 1);
    }, [clearComposeTimer]);

    const finishPendingScroll = useCallback(() => {
      const target = composeTargetRef.current;
      if (target !== null && Math.abs(getScrollY() - target) < 3) {
        clearComposeTimer();
        composeTimerRef.current = setTimeout(finishComposeScroll, 80);
      }
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
      if (!layoutReady) return;
      cancelPendingScroll();
      composePendingRef.current = true;
      onComposingChange(true);
      // El espacio de scroll se añade antes de medir y antes de enfocar el teclado.
      interactionRef.current = InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
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
            composeTimerRef.current = setTimeout(finishComposeScroll, 900);
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
        interactionRef.current?.cancel();
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
        />
      </View>
    );
  },
);