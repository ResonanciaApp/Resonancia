import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";

import { SessionBadgeGlass, SessionDurationBadge } from "@/components/SessionDurationBadge";

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

export function SessionCategoryPill({
  categoryId,
  inline = false,
  plain = false,
  textOnly = false,
  showIconGlyph = true,
  iconSize = 19,
  outlineColor,
  leftInset,
}: {
  categoryId?: string;
  inline?: boolean;
  plain?: boolean;
  textOnly?: boolean;
  showIconGlyph?: boolean;
  iconSize?: number;
  outlineColor?: string;
  leftInset?: number;
}) {
  const category = categoryId ? CATEGORY_PILL_META[categoryId] : undefined;
  if (!category) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.categoryPill,
        inline && styles.categoryPillInline,
        plain && styles.categoryPillPlain,
        textOnly && styles.categoryPillTextOnly,
        outlineColor && styles.categoryPillOutlined,
        outlineColor ? { borderColor: outlineColor } : null,
        leftInset !== undefined ? { left: leftInset } : null,
      ]}
    >
      {!plain && !outlineColor && <SessionBadgeGlass />}
      {!textOnly && (
        <SessionCategoryIcon
          categoryId={categoryId}
          size={iconSize}
          showGlyph={showIconGlyph}
        />
      )}
      <Text style={[styles.categoryLabel, !plain && styles.categoryLabelCard]} numberOfLines={1}>
        {category.label.toUpperCase()}
      </Text>
    </View>
  );
}

export function SessionCategoryIcon({
  categoryId,
  style,
  size = 19,
  showGlyph = true,
}: {
  categoryId?: string;
  style?: object;
  size?: number;
  showGlyph?: boolean;
}) {
  const category = categoryId ? CATEGORY_PILL_META[categoryId] : undefined;
  if (!category) return null;
  const iconSize = Math.round(size * 0.63);

  return (
    <View style={[styles.categoryCircle, { width: size, height: size, borderRadius: size / 2 }, style, { backgroundColor: category.color }]}>
      {showGlyph && category.materialIcon ? (
        <MaterialCommunityIcons name={category.materialIcon} size={iconSize} color="#F9F9F9" />
      ) : showGlyph && category.icon ? (
        <Image source={category.icon} style={[styles.categoryIcon, { width: iconSize, height: iconSize }]} resizeMode="contain" />
      ) : null}
    </View>
  );
}

type Props = {
  categoryId?: string;
  durationLabel: string;
  title: string;
  authorName?: string;
  authorAvatar?: ImageSourcePropType;
  showAuthor?: boolean;
  showCategoryPill?: boolean;
  showCategoryBelow?: boolean;
  showMetaBelow?: boolean;
  titleFontSize?: number;
  titleNumberOfLines?: number;
  showDuration?: boolean;
  durationBottom?: number;
  metaBottom?: number;
  metaLeft?: number;
  contentLeft?: number;
};

export function SessionCardMetadataOverlay({
  categoryId,
  durationLabel,
  title,
  authorName,
  authorAvatar,
  showAuthor = true,
  showCategoryPill = true,
  showCategoryBelow = false,
  showMetaBelow = false,
  titleFontSize,
  titleNumberOfLines = 2,
  showDuration = true,
  // Deja un poco más de aire cuando el título ocupa dos líneas.
  durationBottom = 70,
  metaBottom = 15,
  metaLeft = 10,
  contentLeft = 8,
}: Props) {
  const [titleLineCount, setTitleLineCount] = React.useState(1);
  const effectiveDurationBottom =
    durationBottom + Math.max(0, titleLineCount - 1) * 18;
  const categoryLabel = categoryId ? CATEGORY_PILL_META[categoryId]?.label : undefined;
  const metaBelowLabel = [categoryLabel, durationLabel].filter(Boolean).join(" · ");

  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={["transparent", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.82)"]}
        locations={[0, 0.42, 1]}
        style={styles.bottomGradient}
      />
      {showCategoryPill && (
        <SessionCategoryPill categoryId={categoryId} leftInset={contentLeft} />
      )}
      {showDuration && (
        <SessionDurationBadge
          label={durationLabel}
          style={[styles.durationBadge, { bottom: effectiveDurationBottom, left: contentLeft }]}
          textStyle={styles.durationText}
          showClock
        />
      )}
      <View pointerEvents="none" style={[styles.meta, { bottom: metaBottom, left: metaLeft }, authorAvatar ? styles.metaWithAvatar : null]}>
        {authorAvatar ? (
          <Image source={authorAvatar} style={styles.authorAvatar} resizeMode="cover" />
        ) : null}
        <View style={styles.metaText}>
          <Text
            style={[
              styles.title,
              titleFontSize ? { fontSize: titleFontSize, lineHeight: titleFontSize + 4 } : null,
            ]}
            numberOfLines={titleNumberOfLines}
            onTextLayout={(event) => {
              const lineCount = event.nativeEvent.lines?.length ?? 1;
              setTitleLineCount((previous) =>
                previous === lineCount ? previous : lineCount
              );
            }}
          >
            {title}
          </Text>
          {showMetaBelow && metaBelowLabel ? (
            <Text style={styles.author} numberOfLines={1}>{metaBelowLabel}</Text>
          ) : showCategoryBelow && categoryLabel ? (
            <Text style={styles.author} numberOfLines={1}>{categoryLabel}</Text>
          ) : null}
          {showAuthor && authorName ? (
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
    minHeight: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 3,
    paddingRight: 9,
    paddingLeft: 3,
    borderRadius: 100,
    overflow: "hidden",
  },
  categoryPillInline: {
    position: "relative",
    top: 0,
    left: 0,
    maxWidth: "100%",
  },
  categoryPillPlain: {
    minHeight: 0,
    paddingVertical: 0,
    paddingRight: 0,
    paddingLeft: 0,
    backgroundColor: "transparent",
  },
  categoryPillTextOnly: {
    gap: 0,
  },
  categoryPillOutlined: {
    borderWidth: 2,
    backgroundColor: "transparent",
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
    tintColor: "#F9F9F9",
  },
  categoryLabel: {
    flexShrink: 1,
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  categoryLabelCard: {
    fontWeight: "900",
  },
  durationBadge: {
    position: "absolute",
    left: 8,
    borderRadius: 999,
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
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    color: "#FFFFFF",
  },
  author: {
    fontFamily: "Manrope",
    fontSize: 11,
    color: "#A9A9C3",
    marginTop: 4,
    flexShrink: 1,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});