---
name: MessageDeck shadow card sizing
description: Why the wrapper needs an explicit width equal to CARD_W
---

Shadow cards in MessageDeck use `position: absolute` with `left: offset/2, right: offset/2`.
In React Native, absolute children calculate left/right relative to the parent's width.
If the wrapper has no explicit width (only `alignItems: center`), it stretches to screen width and the shadow cards become much wider than the main card.

**Why:** `alignItems: center` doesn't constrain the wrapper width — it only centers children in the flow. Absolute children are sized by left/right relative to whatever the parent resolves to.

**How to apply:** Whenever absolute children need to be sized relative to a known card width, give the parent `width: CARD_W` (plus `alignSelf: "center"` to keep it centered in its own parent).
