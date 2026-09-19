import React from "react";
import { useLocalSearchParams } from "expo-router";

import { ProfileScreenBase } from "@/components/ProfileScreenBase";

export default function ProfileScreen() {
  const { composeReflection } = useLocalSearchParams<{ composeReflection?: string }>();
  return <ProfileScreenBase dedicated composeReflectionToken={composeReflection} />;
}
