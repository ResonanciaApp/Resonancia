---
name: Tab route lazy import crash
description: React.lazy de rutas TAB de Expo Router duplica SceneThemeContext → crash "must be inside Provider"
---

## La regla

**Nunca usar `React.lazy(() => import("@/app/(tabs)/..."))` para rutas dentro de grupos `(tabs)`.**

## Por qué

Expo Router empaqueta las rutas de tab como split-bundles propios (uno por ruta).
Cuando además se hace un `React.lazy()` del mismo archivo, Metro crea un SEGUNDO
bundle para ese mismo módulo. Durante la evaluación del segundo bundle, todos los
módulos que importa se evalúan de nuevo (incluido `SceneThemeContext.tsx`).

Resultado:
- `SceneThemeContext.tsx` corre dos veces → dos objetos `createContext()` distintos.
- `SceneThemeProvider` provee valores via el contexto VIEJO.
- Cualquier consumidor (`useSceneTheme`) que cargó en el segundo bundle busca el
  NUEVO contexto → `null` → lanza "useSceneTheme must be inside SceneThemeProvider".
- `ErrorBoundary` (encima del provider) captura el error → usuario ve pantalla de error.

## Cómo detectarlo

El error aparece en los logs de Metro DESPUÉS de que el split-bundle de la ruta tab
termina de cargarse (no al inicio).

## Cómo aplicar

| Tipo de ruta | `React.lazy` seguro? | Solución alternativa |
|---|---|---|
| `app/foo.tsx` (root) | ✅ Sí | — |
| `app/category/foo.tsx` (root) | ✅ Sí | — |
| `app/(tabs)/foo.tsx` (tab) | ❌ NO | Import eager (si es pequeño) o extraer contenido a archivo fuera de `app/` |

## Caso concreto resuelto

`CategoryOverlay` importaba `@/app/(tabs)/descanzo` con `React.lazy`.
Fix: import eager directo `import DescanzoScreen from "@/app/(tabs)/descanzo"`.
El resto de pantallas (`app/category/`) siguen siendo lazy sin problema.
