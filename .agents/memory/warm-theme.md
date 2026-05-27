---
name: Warm theme palette
description: Paleta dorada/café de RESONANCIA y todos los archivos con colores hardcodeados que hay que actualizar
---

## Paleta principal (colors.ts)
- background: `#18110C`
- card: `#24160F`
- primary: `#C69B4F`
- accent: `#D6A85B`
- foreground/text: `#EDE1D3`
- secondary/muted: `#3D2010`
- mutedForeground: `#8A7060`
- border: `#2A1A0E`

## Overlay SacredBackground
`rgba(8,4,2,0.72)` — tono cálido marrón (antes era verde `rgba(4,8,5,0.72)`)

## Archivos con paletas hardcodeadas (NO usan colors.ts)
- `app/onboarding.tsx` — constantes BG/CARD/GOLD/FG al top del archivo
- `app/(auth)/sign-in.tsx` — objeto COLORS al top
- `app/(auth)/sign-up.tsx` — objeto COLORS al top
- `components/SocialAuthButtons.tsx` — objeto COLORS al top
- `components/AmbientWidget.tsx` — inline en StyleSheet
- `app/(tabs)/_layout.tsx` — inline en JSX (tab bar background)

**Why:** Estos archivos fueron creados antes de que colors.ts estuviera como fuente única de verdad, y tienen paletas propias. Cada vez que se cambia el tema hay que actualizarlos manualmente.

## Módulos con gradientes propios
- VozInteriorPanel: `["#241C0C", "#141008"]` (header cálido)
- MensajesAnonimosPanel: `["#5C1A3A", "#3A0D22"]` (header rosa/púrpura)
- diario.tsx: `["#241C0C", "#141008"]` (ambos paneles)
