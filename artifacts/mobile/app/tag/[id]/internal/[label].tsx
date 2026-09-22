import { useLocalSearchParams } from "expo-router";
import React from "react";

import ThemeTagScreen from "@/app/tag/[id]";

function decode(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default function OtherThemeInternalTagScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    label?: string | string[];
  }>();
  return (
    <ThemeTagScreen
      id={decode(params.id)}
      internalLabel={decode(params.label)}
    />
  );
}