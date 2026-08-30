---
name: Guardado y cierre de MixerSheet
description: El guardado conserva la hoja y pausa la mezcla; los fades globales solo corresponden a cierres reales.
---

# Fade sincronizado popup + reproductor (MixerSheet)

## Estado actual: guardar no cierra “Tu mezcla”

Al confirmar un guardado, se cierra únicamente el popup de nombre. La hoja
“Tu mezcla” permanece abierta, los sonidos y el miniplayer se conservan y la
reproducción queda pausada mediante la operación idempotente de pausa. Una
confirmación compacta con corazón morado indica que la mezcla quedó guardada en
Biblioteca.

**Why:** Guardar no debe destruir el contexto de edición ni obligar a reconstruir
la mezcla; el usuario puede revisar lo guardado y reanudarla inmediatamente.

**How to apply:** No llamar al cierre de hoja ni al vaciado total desde el flujo
de guardado. Vincular la mezcla activa con el preset recién creado, pausar sin
quitar sonidos y cerrar solo el overlay de nombre. Las notas de fade global que
siguen aplican exclusivamente a cierres reales del editor.

## Historial técnico del fade de cierre

Cuando un flujo sí cierra todo el mezclador, el popup y la hoja deben
desvanecerse de forma coherente.

**El problema (no obvio):** dos capas que animan opacidad en simultáneo se
cancelan visualmente. El popup era un `<Modal>` nativo separado con backdrop
oscuro (`rgba(0,0,0,0.7)`). Al cerrarse, ese backdrop se des-oscurecía y
"aclaraba" el reproductor justo cuando el reproductor bajaba su propia opacidad.
Resultado percibido: el reproductor "se queda parado" (los dos efectos se anulan)
y luego cae de golpe cuando el modal ya se fue. Ninguna curva de easing
(linear/cubic/delay) lo arregla porque la causa es estructural, no de timing.

**La regla:** si querés que un overlay/popup desvanezca en lockstep con el
contenido detrás, NO lo hagas un `<Modal>` aparte (renderiza en capa nativa
propia, fuera del alcance de tu `Animated.Value` de opacidad). Ponelo como
`Animated.View` in-tree DENTRO del mismo contenedor que lleva la opacidad
compartida, con `StyleSheet.absoluteFillObject`. Así una sola animación de
opacidad cubre todo y nada se "des-oscurece" de forma independiente.

**Why:** la opacidad de un Modal nativo es independiente de la del árbol React
que lo invoca; su backdrop fade interactúa multiplicativamente con el fade de la
capa de abajo y produce un mínimo/rebote de brillo intermedio.

**How to apply:** popup in-tree con su propia `Animated.Value` para el fade-in al
abrir y fade-out al cancelar; en el flujo que cierra TODO (confirmar guardado), NO
cierres el popup antes del fade global — dejá que la opacidad del contenedor lo
arrastre y reseteá el estado en el callback de la animación.

## Segundo síntoma: el fade unificado "se clava a la mitad"

Una vez unificado, el fade lineal se percibía detenido al 50%. Dos causas:

1. **Percepción gamma (la principal):** el brillo percibido ≈ opacidad^0.45. Con
   opacidad lineal, al llegar al 50% del tiempo (opacidad 0.5) el ojo todavía ve
   ~73% de brillo → parece que "no avanza" y luego cae de golpe al final. Fix:
   `Easing.out(Easing.quad)` (o cubic) en vez de `Easing.linear` — baja la
   opacidad rápido al inicio para que el desvanecido percibido sea parejo.
   **Regla:** para fades de opacidad usá ease-out, NO lineal; lineal SIEMPRE se
   ve "pesado/clavado" en la mitad por gamma.
2. **Bloqueo del hilo JS:** trabajo pesado disparado junto con la animación
   (acá `stopAll()` que frena varios reproductores de audio) bloquea unos frames
   a mitad del fade y produce un tirón real. La causa NO es el momento de la
   llamada sino el trabajo SÍNCRONO pesado (pause/remove de N players). Fix
   correcto: hacer ese trabajo barato/asíncrono, no diferirlo en bloque (ver
   abajo).

## Cierre con fade-out de audio + cards que se deseleccionan acompañando (modelo actual)

Reemplaza el "diferí stopAll al callback" de arriba (que dejaba el corte de
audio + el snap de las cards PARA EL FINAL del fade → se percibían demorados y
de golpe). El modelo correcto separa lo visual de lo pesado:

- **`stopAll()` se llama al INICIO del cierre** (no en el callback). Resetea la
  UI de forma SÍNCRONA (`setActiveSounds([])`, refs) para que las cards de "Mi
  Música" empiecen a deseleccionarse YA y animen junto al fade de la hoja.
- **El audio hace su propio fade-out** dentro de stopAll: captura los players,
  DESACOPLA los refs sincrónicamente (clear de los maps) y rampa el volumen a 0
  por RAF (~340ms); recién al terminar hace pause+remove. Así no hay corte de
  golpe y el trabajo pesado cae al final del ramp, no en el frame de arranque.
- **Las cards animan tilt/scale/border** con un `Animated.Value` propio por card
  (0↔1, ease-out). El borde se anima por color → `useNativeDriver:false`.

**Regla de re-entrancy (bug sutil, NO obvio):** como los players del fade ya
están desacoplados de los refs, si una nueva llamada a stopAll cancela el fade
en curso (`cancelAnimationFrame`), esos players quedan HUÉRFANOS sonando a
volumen parcial — nadie más los apagaría. Hay que guardar el teardown del fade
en un ref (`fadeTeardownRef`) y ejecutarlo inmediatamente al cancelar, antes de
arrancar el nuevo. Vale para closes rápidos repetidos y para el chain
`stopAll()+toggleSound()` de re-entrar a Sonidos Naturaleza.

**Why:** desacoplar los refs es necesario para que un `toggleSound()` encadenado
entre en maps limpios, pero eso mismo deja los players viejos inalcanzables; el
único puntero que queda es el closure del RAF, que al cancelarse se pierde.
