import AsyncStorage from "@react-native-async-storage/async-storage";
import { PremiumProvider as BasePremiumProvider, usePremium } from "@workspace/premium";
import React from "react";

const storage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
};

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  return <BasePremiumProvider storage={storage}>{children}</BasePremiumProvider>;
}

export { usePremium };
