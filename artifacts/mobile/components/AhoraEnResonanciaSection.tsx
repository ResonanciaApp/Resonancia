import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ActivityFeedCard } from "@/components/ActivityFeedCard";
import { useAuth } from "@/context/AuthContext";
import { useCommunityFeed } from "@/hooks/useCommunityFeed";

const PREVIEW_COUNT = 3;

export function AhoraEnResonanciaSection() {
  const { clerkUserId } = useAuth();
  const { events, loading } = useCommunityFeed(clerkUserId);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Ahora en RESONANCIA</Text>

      {loading ? (
        <ActivityIndicator color="#BE9650" style={styles.loading} />
      ) : events.length === 0 ? (
        <Text style={styles.empty}>La comunidad está en silencio{"\n"}vuelve pronto</Text>
      ) : (
        <View>
          {events.slice(0, PREVIEW_COUNT).map((event) => (
            <ActivityFeedCard key={event.id} event={event} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
    color: "#F9F9F9",
    marginBottom: 14,
  },
  loading: {
    marginTop: 16,
  },
  empty: {
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(244,244,244,0.6)",
    textAlign: "center",
    paddingVertical: 20,
  },
});