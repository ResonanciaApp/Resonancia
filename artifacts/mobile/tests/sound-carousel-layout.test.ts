import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import {
  CONTENT_CAROUSEL_GAP,
  CONTENT_CAROUSEL_HORIZONTAL_PADDING,
  getExactTwoCardCarouselCardWidth,
  getTwoCardCarouselCardWidth,
} from "../constants/carousel.ts";

test("Sonidos fits two complete cards and exactly 20 px of the third on phones and tablets", () => {
  const outerPadding = 16;
  const rightInset = outerPadding - CONTENT_CAROUSEL_HORIZONTAL_PADDING;
  for (const viewport of [320, 360, 375, 390, 393, 402, 430, 768, 1024]) {
    const cardWidth = getExactTwoCardCarouselCardWidth(viewport, outerPadding, 20, rightInset);
    const thirdCardStart = outerPadding + 2 * (cardWidth + CONTENT_CAROUSEL_GAP);
    const listRightEdge = viewport - rightInset;
    assert.equal(listRightEdge - thirdCardStart, 20);
    assert.ok(cardWidth > 0);
    assert.ok(thirdCardStart - CONTENT_CAROUSEL_GAP <= listRightEdge, "The second card is fully visible");
  }
  assert.equal(getExactTwoCardCarouselCardWidth(393, 16, 20, 2), 163.5,
    "Fractional logical pixels avoid rounding the third-card peek");
  assert.equal(getTwoCardCarouselCardWidth(402, 16), 174,
    "Other carousels retain their existing sizing");
});

test("Sonidos tracks window width and prevents the editorial carousel's legacy width adjustment", () => {
  const soundSource = readFileSync(new URL("../app/(tabs)/sonidos.tsx", import.meta.url), "utf8");
  const carouselSource = readFileSync(new URL("../components/SessionCarousel.tsx", import.meta.url), "utf8");
  assert.match(soundSource, /const \{ width: viewportWidth \} = useWindowDimensions\(\)/);
  assert.match(soundSource, /getExactTwoCardCarouselCardWidth\(\s*viewportWidth,\s*H_PAD,\s*20,\s*H_PAD - CONTENT_CAROUSEL_HORIZONTAL_PADDING/);
  assert.match(soundSource, /cardWidth=\{ambientalCarouselCardWidth\}\s*trailingPeek=\{20\}/);
  assert.match(soundSource, /cardVariant="ambiental"/);
  assert.match(carouselSource, /const GRID_PAD = CONTENT_CAROUSEL_HORIZONTAL_PADDING/);
  assert.match(carouselSource, /marginHorizontal: -GRID_PAD/);
  assert.match(carouselSource, /paddingHorizontal: GRID_PAD, gap: CONTENT_CAROUSEL_GAP/);
  assert.match(carouselSource, /isEditorialPresentation && trailingPeek === undefined \? -3\.5 : 0/);
});