---
name: Navy + gold theme palette (rebrand)
description: Paleta actual azul marina + dorado de RESONANCIA y archivos con colores hardcodeados; antes era cálida café/bronce
---

## Paleta actual — azul marina + dorado (navy + gold)
La marca migró de cálido (café/bronce) a **azul marina + dorado**. Aplicada en app móvil y en las 3 decks (resonancia-deck, resonancia-pitch, resonancia-identidad).

- background / bg: `#060A0F` (azul marina)  ← antes `#18110C` (café)
- card: `#090E17` (azul profundo)  ← antes `#24160F`
- primary: `#BE9650` (dorado)  ← antes `#C69B4F`
- accent: `#D6A85B` (ámbar/dorado claro)
- foreground / text: `#EDE1D3` (crema, sin cambios)
- mutedForeground / muted: `#7A8FA8` (azul-gris frío)  ← antes `#7a6050` / `#8A7060` (café)

**Why:** El usuario rebrandeó la app a "azul y dorado". NO reintroducir tonos café/bronce. Los textos que describían la paleta ("Estética cálida", "Bronce, oscuridad...", "Negro cacao", "Café oscuro") se reescribieron a "serena / Azul profundo, dorado / Azul marina".

## Mapeo de reemplazo cálido→navy (por si aparecen restos hardcodeados)
- `#18110C` / `#18110c` → `#060A0F`
- `#24160F` → `#090E17`
- `#C69B4F` → `#BE9650`
- `#7a6050` → `#7A8FA8`
- `#3d2a18`, `#5a4632` (textos café oscuros, ilegibles sobre navy) → `#7A8FA8`
- `#cbb9a4` (beige cálido de párrafos) → `#7A8FA8`
- `rgba(24,17,12,a)` → `rgba(6,10,15,a)`; `rgba(36,22,15,a)` → `rgba(9,14,23,a)`; `rgba(198,155,79,a)` → `rgba(190,150,80,a)`

## Decks: theme tokens en `src/index.css`
Las 3 decks definen la paleta como CSS vars `--slide-*` en `src/index.css`, pero la MAYORÍA de las slides hardcodean hex inline (no usan las vars). Al recolorear, hay que hacer barrido global de hex en `src/pages/slides/*.tsx`, no solo cambiar index.css.

## Mockups de las decks (PENDIENTE — no regenerables vía preview web)
Las decks incrustan capturas de la app (`public/mockup-{home,biblioteca,musica,perfil,sonidos}.jpg`). Siguen siendo del tema CÁLIDO viejo + nombres/grid de categorías viejos (4 cats: "Música y Sonidos", "HaciaAdentro·PodCast"; la app ahora tiene 6: Ancestrales/Meditaciones/Música/Sonidos/Mañanas/Noches).
**No se pueden regenerar desde el preview web de Expo**: el web no carga las fuentes de `@expo/vector-icons` → los íconos salen como cuadros vacíos. Hace falta capturas reales de dispositivo (o arreglar carga de fuentes en web) para actualizarlos.

## Archivos mobile con paletas hardcodeadas (NO usan colors.ts)
- `app/onboarding.tsx` — constantes BG/CARD/GOLD/FG al top
- `app/(auth)/sign-in.tsx`, `sign-up.tsx` — objeto COLORS al top
- `components/SocialAuthButtons.tsx` — objeto COLORS al top
- `components/AmbientWidget.tsx` — inline en StyleSheet
- `app/(tabs)/_layout.tsx` — inline en JSX (tab bar; ACTIVE_COLOR/PILL_BG `#6B9AB5`)

**Why:** creados antes de que colors.ts fuera fuente única; cada cambio de tema requiere tocarlos a mano.
