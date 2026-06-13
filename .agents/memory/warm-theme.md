---
name: Paleta de colores activa — burgundy + dorado
description: Paleta actual de RESONANCIA mobile (burgundy/rojo oscuro + dorado); historial de rebrand; archivos con colores hardcodeados
---

## Paleta actual — burgundy + dorado (desde Junio 2026)
La marca migró de **navy+dorado** a **burgundy/rojo oscuro + dorado**.

- bg / background:      `#1B060F` (burgundy muy oscuro)  ← antes `#0B0F14` (navy)
- secondary / input:    `#27070E`
- card:                 `rgba(74,12,12,0.08)` (tinte rojo translúcido)  ← antes `rgba(190,150,80,0.05)` (tinte dorado)
- border:               `#3D0E16`
- primary:              `#D4AF37` (dorado)  ← antes `#BE9650`
- accent:               `#E9C46A`
- foreground / text:    `#F4DAD5` (rosado/crema)  ← antes `#EDE1D3`
- mutedForeground:      `rgba(242,231,228,0.45)`  ← antes `#7A8FA8`
- destructive:          `#E63946`
- bg gradientes:        `["#4A0C0C","#27070E","#1B060F"]`  ← antes `["#090D20","#080A18","#06070F"]`

**Why:** El usuario solicitó rebrand completo a paleta cálida burgundy+rojo oscuro+dorado (Junio 2026). NO reintroducir tonos navy.

## Mapeo de reemplazo navy→burgundy (para detectar restos hardcodeados)
- `#0B0F14` → `#1B060F`
- `#090F17` → `#1B060F`
- `#151A23` → `#27070E`
- `#BE9650` → `#D4AF37`
- `#D6A85B` (accent viejo) → `#E9C46A`
- `#EDE1D3` → `#F4DAD5`
- `#7A8FA8` → `rgba(242,231,228,0.45)`
- `rgba(190,150,80,x)` → `rgba(212,175,55,x)`
- `rgba(182,149,95,x)` → `rgba(212,175,55,x)`
- `rgba(198,155,79,x)` → `rgba(212,175,55,x)`
- `rgba(255,255,255,0.03–0.08)` card bg → `rgba(74,12,12,0.08)`
- `rgba(255,255,255,0.06–0.09)` borders → `rgba(61,14,22,0.40)`
- bg gradientes `["#090D20","#080A18","#06070F"]` → `["#4A0C0C","#27070E","#1B060F"]`
- `#090D20` sólido → `#1B060F`

## Geometrix — EXCLUIDO del rebrand
`app/(tabs)/geometrix.tsx`, `app/geometrix-aprende/`, `components/GeometrixPatternBg.tsx`, `components/GeometrixCommunitySection.tsx` conservan la paleta navy. NO tocar.

## Archivos mobile con paletas hardcodeadas (NO usan colors.ts)
- `app/onboarding.tsx` — constantes BG/CARD/GOLD/FG al top
- `app/(auth)/sign-in.tsx`, `sign-up.tsx` — objeto COLORS al top
- `components/SocialAuthButtons.tsx` — objeto COLORS al top
- `app/(tabs)/_layout.tsx` — inline en JSX (tab bar)

**Why:** creados antes de que colors.ts fuera fuente única; cada cambio de tema requiere tocarlos a mano.

## Token central
`artifacts/mobile/constants/colors.ts` — fuente de verdad para la paleta. `card` y alias `darkChocolate` = `rgba(74,12,12,0.08)`.
