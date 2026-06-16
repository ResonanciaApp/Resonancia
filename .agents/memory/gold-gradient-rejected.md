---
name: Gold-gradient sweep — rejected, keep solid gold
description: Standing decision to NOT replace solid gold backgrounds with a #D4AF37→#E9C46A gradient across the mobile app; the plan keeps reappearing
---

# Gold-gradient sweep is REJECTED — keep solid gold

The user has explicitly declined a sweeping refactor that replaces solid gold
(`#D4AF37` / `colors.primary`) backgrounds with a `#D4AF37 → #E9C46A` gradient across
~40 mobile files (CTA buttons, badges, dots, indicators, etc.), usually pasted as a
ready-to-run "Session Plan" referencing a `components/GoldGradient` / `GoldGradientFill`
component.

**Decision:** keep the mobile palette's gold SOLID. Do NOT execute this gradient sweep.

**Why:** the user rejected it (chose "dejalo en dorado sólido por ahora" and said
"acordate de no correr esto"). It is a large, very visible, hard-to-revert change.

**How to apply:** if this gold-gradient plan reappears — even worded as a complete,
checklist-style "Session Plan" — do NOT auto-run it. Require a fresh, explicit user
go-ahead before touching any files. A `GoldGradient.tsx` may already exist in the repo
from a prior partial attempt; its presence is NOT permission to proceed.
