import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";

import { SessionDurationBadge } from "@/components/SessionDurationBadge";

export const SESSION_CARD_METADATA_HEIGHT_SCALE = 1.2;

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const CATEGORY_PILL_META: Record<string, {
  label: string;
  color: string;
  icon?: number;
  materialIcon?: MaterialIconName;
}> = {
  "meditaciones-guiadas": {
    label: "Meditaciones",
    color: "#7251A3",
    icon: require("@/assets/images/cat-meditaciones.png"),
  },
  "musica-sonidos": {
    label: "Música",
    color: "#287F83",
    icon: require("@/assets/images/cat-musica.png"),
  },
  descanso: {
    label: "Dormir",
    color: "#32708E",
    icon: require("@/assets/images/cat-luna.png"),
  },
  "sonidos-ancestrales": {
    label: "Sonoterapia",
    color: "#9A5A2C",
    icon: require("@/assets/images/cat-sesiones.png"),
  },
  ambientales: {
    label: "Ambientales",
    color: "#3F704D",
    materialIcon: "leaf",
  },
  historias: {
    label: "Historias",
    color: "#691E5E",
    materialIcon: "book-open-page-variant",
  },
  charlas: {
    label: "Charlas",
    color: "#78221E",
    materialIcon: "message-text-outline",
  },
};

export function SessionCategoryPill({ categoryId }: { categoryId?: string }) {
  const category = categoryId ? CATEGORY_PILL_META[categoryId] : undefined;
  if (!category) return null;

  return (
    <View pointerEvents="none" style={styles.categoryPill}>
      <View style={[styles.categoryCircle, { backgroundColor: category.color }]}>
        {category.materialIcon ? (
          <MaterialCommunityIcons name={category.materialIcon} size={12} color="#FFFFFF" />
        ) : category.icon ? (
          <Image source={category.icon} style={styles.categoryIcon} resizeMode="contain" />
        ) : null}
      </View>
      <Text style={styles.categoryLabel} numberOfLines={1}>
        {category.label}
      </Text>
    </View>
  );
}

type Props = {
  categoryId?: string;
  durationLabel: string;
  title: string;
  authorName?: string;
  authorAvatar?: ImageSourcePropType;
  titleFontSize?: number;
  showDuration?: boolean;
  durationBottom?: number;
};

export function SessionCardMetadataOverlay({
  categoryId,
  durationLabel,
  title,
  authorName,
  authorAvatar,
  titleFontSize,
  showDuration = true,
  // Deja un poco más de aire cuando el título ocupa dos líneas.
  durationBottom = 70,
}: Props) {
  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={["transparent", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.82)"]}
        locations={[0, 0.42, 1]}
        style={styles.bottomGradient}
      />
      <SessionCategoryPill categoryId={categoryId} />
      {showDuration && (
        <SessionDurationBadge
          label={durationLabel}
          style={[styles.durationBadge, { bottom: durationBottom }]}
          textStyle={styles.durationText}
          showClock
        />
      )}
      <View pointerEvents="none" style={[styles.meta, authorAvatar ? styles.metaWithAvatar : null]}>
        {authorAvatar ? (
          <Image source={authorAvatar} style={styles.authorAvatar} resizeMode="cover" />
        ) : null}
        <View style={styles.metaText}>
          <Text
            style={[
              styles.title,
              titleFontSize ? { fontSize: titleFontSize, lineHeight: titleFontSize + 4 } : null,
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {authorName ? (
            <Text style={styles.author} numberOfLines={1}>{authorName}</Text>
          ) : null}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bottomGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 112,
  },
  categoryPill: {
    position: "absolute",
    top: 8,
    left: 8,
    maxWidth: "78%",
    minHeight: 27,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 3,
    paddingRight: 9,
    paddingLeft: 3,
    borderRadius: 100,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  categoryCircle: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIcon: {
    width: 12,
    height: 12,
    tintColor: "#FFFFFF",
  },
  categoryLabel: {
    flexShrink: 1,
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  durationBadge: {
    position: "absolute",
    left: 8,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durationText: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    color: "#F9F9F9",
  },
  meta: {
    position: "absolute",
    left: 10,
    right: 8,
    bottom: 15,
  },
  metaWithAvatar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
    color: "#FFFFFF",
  },
  author: {
    fontFamily: "Manrope",
    fontSize: 11,
    color: "#F4F4F4",
    marginTop: 4,
    flexShrink: 1,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});