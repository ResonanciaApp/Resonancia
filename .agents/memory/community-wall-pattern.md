---
name: Community wall pattern (Geometrix)
description: Architecture for sharing Geometrix compositions to a community feed (shared_glyphs + likes table, jsonb recipe, live preview)
---

# Community wall — shared_glyphs

## Pattern
Replicates shared_mixes architecture exactly:
- `shared_glyphs` table: `id, authorId, name, description, recipe jsonb, likes int, hidden bool, createdAt`
- `shared_glyph_likes` table: unique index on (glyphId, userId); likes counter recalculated under FOR UPDATE lock
- Recipe JSON: `{ active: string[], master: { opacity, motion, glow, bgColor, bgGradientId, bgBrightness }, settings: Record<string, GeoSettings>, soloId? }`

## Key decisions
- Recipe stored as jsonb (no static image needed; SacredGlyph rerenders live from recipe)
- `likes` column is denormalized (recalculated with `count(*) FOR UPDATE` in transaction)
- Mobile community feed renders previews STATIC (no animation) for performance — only cards animate in the "Mis creaciones" per-card play button
- Max 30 shared glyphs per user (enforced server-side before insert)
- Admin can delete any glyph (`me.role === "admin"` check in DELETE endpoint)

**Why:** jsonb recipe means no storage cost per composition and zero CDN dependency. Live render ensures exact visual fidelity across devices.

**How to apply:** When adding new community-shareable content types, follow this same pattern: jsonb recipe + denormalized likes counter + client-side live render.
