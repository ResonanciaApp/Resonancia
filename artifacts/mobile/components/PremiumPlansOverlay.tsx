import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";

import { BackOverrideProvider } from "@/context/BackOverrideContext";
import {
  registerPremiumPlansModalHost,
  registerPremiumPlansOverlay,
} from "@/lib/premiumPlansOverlay";

const MembershipScreen = React.lazy(() => import("@/app/membresia"));

export function PremiumPlansSurface({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.surface}>
      <BackOverrideProvider onBack={onClose}>
        <Suspense fallback={<View style={styles.fallback} />}>
          <MembershipScreen />
        </Suspense>
      </BackOverrideProvider>
    </View>
  );
}

export function usePremiumPlansModalHost(active: boolean) {
  const [visible, setVisible] = useState(false);
  const openingRef = useRef(false);
  const hostId = useRef(Symbol("premium-plans-modal-host")).current;
  const close = useCallback(() => {
    openingRef.current = false;
    setVisible(false);
  }, []);
  const isOpening = useCallback(() => openingRef.current, []);

  useEffect(() => {
    if (!active) {
      openingRef.current = false;
      setVisible(false);
      return;
    }
    return registerPremiumPlansModalHost(hostId, () => {
      openingRef.current = true;
      setVisible(true);
    });
  }, [active, hostId]);

  return { visible, close, isOpening };
}

export function PremiumPlansOverlay() {
  const [visible, setVisible] = useState(false);
  const close = useCallback(() => setVisible(false), []);

  useEffect(() => {
    registerPremiumPlansOverlay(() => setVisible(true));
    return () => registerPremiumPlansOverlay(null);
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={close}
    >
      <PremiumPlansSurface onClose={close} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  surface: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
    backgroundColor: "#060A0F",
  },
  fallback: {
    flex: 1,
    backgroundColor: "#060A0F",
  },
});