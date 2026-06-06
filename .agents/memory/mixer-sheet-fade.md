---
name: MixerSheet save-popup + reproductor fade
description: Por qué un popup que es <Modal> aparte no puede desvanecer sincronizado con el contenido detrás, y cómo se resolvió
---

# Fade sincronizado popup + reproductor (MixerSheet)

Al cerrar el mezclador tras guardar, el popup "Guardar mezcla" debía desvanecer
EXACTAMENTE a la par del bottom sheet (reproductor) detrás.

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
   a mitad del fade y produce un tirón real. Fix: diferir ese trabajo al callback
   `.start(() => ...)` de la animación, no ejecutarlo antes de `.start()`. Bonus:
   el audio acompaña el fade y se corta al terminar.
