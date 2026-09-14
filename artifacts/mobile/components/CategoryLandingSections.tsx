import React from "react";
import { SessionCarousel } from "@/components/SessionCarousel";
import type { Session } from "@/data/sessions";
import { getCategorySessionTags } from "@/data/category-tabs";

type CategoryLandingSectionsProps = {
  categoryId: string;
  sessions: Session[];
  tabs: string[];
  isPremium: boolean;
  onPress: (session: Session) => void;
  onLongPress?: (session: Session) => void;
  onOpenSubcategory: (tag: string) => void;
  soundPreview?: React.ComponentProps<typeof SessionCarousel>["soundPreview"];
};

/**
 * The category landing pattern: one preview carousel per non-empty
 * subcategory. The full list is deliberately a separate destination so the
 * landing page never turns into an in-place filter when a tab is tapped.
 */
export function CategoryLandingSections({
  categoryId,
  sessions,
  tabs,
  isPremium,
  onPress,
  onLongPress,
  onOpenSubcategory,
  soundPreview,
}: CategoryLandingSectionsProps) {
  const getTags = (session: Session) =>
    categoryId === "meditaciones-guiadas"
      ? session.meditationTag ? [session.meditationTag] : []
      : categoryId === "sonidos-ancestrales"
        ? session.ancestralTag ? [session.ancestralTag] : []
        : getCategorySessionTags(session, categoryId);

  const collections = tabs
    .map((tag) => ({
      tag,
      sessions: sessions.filter((session) => getTags(session).includes(tag)).slice(0, 5),
    }))
    .filter((collection) => collection.sessions.length > 0);

  if (collections.length === 0) return null;

  return (
    <>
      {collections.map((collection, index) => (
        <SessionCarousel
          key={collection.tag}
          title={collection.tag}
          sessions={collection.sessions}
          isPremium={isPremium}
          onPress={onPress}
          onLongPress={onLongPress}
          onViewAll={() => onOpenSubcategory(collection.tag)}
          style={{
            paddingHorizontal: 0,
            marginTop: index === 0 ? 33 : 26,
            marginBottom: 0,
          }}
          presentation="editorial"
          disableAmbientalVariant={categoryId !== "ambientales"}
          sleepMetadataBelow={categoryId !== "ambientales"}
          categoryGridPresentation={categoryId !== "ambientales"}
          whiteMetadataGlass={categoryId !== "ambientales"}
          showDurationClock={categoryId !== "ambientales"}
          trailingPeek={20}
          cardBorderRadius={16}
          hideCategoryAboveTitle={categoryId !== "ambientales"}
          showSleepCategoryPillWithInlineDuration={categoryId !== "ambientales"}
          ambientalTitleOnly={categoryId === "ambientales"}
          overlayGradientLocations={[0.18, 0.48, 1]}
          soundPreview={soundPreview}
        />
      ))}
    </>
  );
}